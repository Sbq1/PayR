# Runbook: Wompi caído / degradado

**Severidad**: 🔴 Crítica — bloquea 100% de los pagos.
**SLA de respuesta**: < 15 min (pausar flujo) / < 30 min (comunicar a restaurantes).

---

## Síntomas

Señales (en orden de probabilidad de detección):

1. **Sentry alert**: `wompi.createTransaction.timeout > 10 en 30 min` o `payment.status = 'ERROR' > 5% en 10 min`
2. **Restaurantes reportan**: comensales dicen "la app dice error al pagar"
3. **Uptime monitor externo** (BetterStack) falla `/api/health` si depende de Wompi
4. **Panel Wompi status**: https://status.wompi.co/ muestra incidente activo
5. **Cron reconcile-hot** spamea errores porque sus llamadas a Wompi API timeout

---

## 1. Confirmar que es Wompi (no nosotros) — 5 min

### 1.1 Verificar status de Wompi

```
https://status.wompi.co/
```

Si marca incidente activo (Investigating/Identified/Monitoring) → ES Wompi. Saltar a paso 2.

### 1.2 Test manual contra Wompi

```bash
# Ping a la API de Wompi sandbox/prod
curl -i https://sandbox.wompi.co/v1/merchants/<PUBLIC_KEY>
# Prod:
curl -i https://production.wompi.co/v1/merchants/<PUBLIC_KEY>
```

Esperado: 200 con JSON del merchant.
Si tarda > 10s o devuelve 5xx → ES Wompi.

### 1.3 Cross-check con logs propios

```sql
-- ¿Qué % de intentos fallan en la última hora?
SELECT
  COUNT(*) FILTER (WHERE status = 'ERROR')::float / NULLIF(COUNT(*), 0) AS error_rate,
  COUNT(*) FILTER (WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL '10 min') AS pending_stuck,
  COUNT(*) FILTER (WHERE status = 'APPROVED') AS approved,
  COUNT(*) AS total
FROM payments
WHERE created_at > NOW() - INTERVAL '1 hour';
```

- `error_rate > 0.3` → confirmado incidente payment-side
- `pending_stuck > 20` → webhook flow roto (puede ser Wompi o nosotros)
- `approved > 0` parcial → degradación intermitente, no outage total

Si `approved` sigue subiendo normal pero `pending_stuck` también → ES Wompi webhook-side (no API-side).

---

## 2. Mitigación

### 2.1 Caso A — Outage total (nadie puede pagar)

**Bloquear nuevos intentos de pago** para no acumular `payments` huérfanos:

**Opción rápida (5 min)** — variable de entorno:
```bash
# 1. Vercel Dashboard → Settings → Environment Variables → Add
#    Name: PAYMENTS_DISABLED
#    Value: true
#    Environment: Production (✓)
#    Sensitive: No (es un flag operacional, no un secret)
#
# 2. Redeploy último build (Deployments → 3 dots → Redeploy)
#    O push un empty commit: git commit --allow-empty -m "trigger" && git push
```

El backend chequea `process.env.PAYMENTS_DISABLED === 'true'` en el primer paso de
`createPayment` ([payment.service.ts](../../lib/services/payment.service.ts) línea ~72) y
lanza `AppError` → 503 con code `PAYMENTS_DISABLED`. El comensal ve: *"Pagos
temporalmente pausados. Paga al mesero o intenta en unos minutos."*

Para **reactivar**:
```bash
# Opción 1: eliminar la env var → Redeploy
# Opción 2: setear PAYMENTS_DISABLED=false → Redeploy
```

> El flag es string-typed, no boolean. "true" (string exacto, lowercase) activa.
> Cualquier otro valor o vacío → flag OFF.

### 2.2 Caso B — Degradación parcial (funciona intermitente)

**No bloquear** — el polling cliente + cron reconcile-hot están diseñados exactamente para esto.

Monitorear:
- `pending_stuck` query cada 10 min
- Cron reconcile-hot debería estar convergiendo pagos PENDING a terminal conforme Wompi responda

Si `pending_stuck` crece en lugar de bajar → escalar a Caso A (bloquear).

### 2.3 Pagos huérfanos al volver el servicio

Cuando Wompi se restaura:
1. Cron reconcile-hot toma los PENDING en ventana caliente (90s-10min) y los resuelve
2. Los que ya pasaron la ventana → los agarra reconcile-zombie (10min+, hasta 6h con backoff)
3. Verificación manual si pasaron > 6h:

```sql
-- Payments que quedaron PENDING más de 6h — probable manual intervention
SELECT p.reference, p.amount_in_cents, p.created_at, r.slug, r.name
  FROM payments p
  JOIN orders o      ON o.id = p.order_id
  JOIN restaurants r ON r.id = o.restaurant_id
 WHERE p.status = 'PENDING'
   AND p.created_at < NOW() - INTERVAL '6 hours'
 ORDER BY p.created_at ASC;
```

Para cada row: buscar manual en panel Wompi por `reference`. Si Wompi dice APPROVED → aplicar manualmente:

```sql
-- SOLO si Wompi confirma APPROVED fuera-de-banda
BEGIN;
UPDATE payments
   SET status = 'APPROVED',
       paid_at = NOW(),
       wompi_transaction_id = '<TXN_ID_DE_WOMPI>'
 WHERE reference = '<REF>' AND status = 'PENDING';

UPDATE orders SET status = 'PAID', updated_at = NOW(), version = version + 1
 WHERE id = (SELECT order_id FROM payments WHERE reference = '<REF>')
   AND status IN ('PENDING', 'PAYING');
COMMIT;
```

---

## 3. Comunicación

### 3.1 A restaurantes (WhatsApp broadcast — dentro de 30 min de confirmar)

**Caso A (outage total)**:
```
Hola <NOMBRE_RESTAURANTE>,

Estamos con un incidente de nuestro proveedor de pagos (Wompi).
Los pagos vía QR están temporalmente pausados — los comensales van
a ver un mensaje "Pago en pausa, pagá al mesero".

Mientras tanto, podés cobrar con tu método tradicional (datafono,
efectivo, etc.). Cuando se restablezca te avisamos por acá mismo.

Tiempo estimado: <X min> (según status.wompi.co)
Status actualizado: https://status.wompi.co

— PayR
```

**Caso B (degradación parcial)**:
```
Hola <NOMBRE>,

Wompi está con latencia alta. Algunos pagos pueden tardar un poco
más en aparecer como "Pagado" en tu dashboard. Los pagos reales se
están procesando — solo la confirmación visual se atrasa ~5 min.

No tenés que hacer nada. Si un comensal te dice "pagué y no aparece",
pedile la referencia del pago (ref: XXXX...) y te confirmo en minutos.

— PayR
```

### 3.2 A comensales afectados (vía restaurante)

El restaurante le dice al comensal: "Tu pago se está procesando, vuelve en 5 minutos o paga al mesero". No contactamos directamente al comensal en esta fase.

### 3.3 Status page pública (si existe `status.payr.co`)

Post inicial:
```
[Investigating] Estamos detectando fallos intermitentes con nuestro
proveedor de pagos Wompi. Los pagos nuevos pueden fallar. Trabajando
en ello.
```

Actualizaciones cada 30 min hasta resolución + post-mortem en 48 h.

---

## 4. Post-mortem obligatorio (< 48 h)

Plantilla en `docs/runbooks/_incident-template.md` (TODO: crear).

Secciones:
- Timeline (UTC)
- Impacto (# restaurantes, # pagos fallidos, COP $ en hold)
- Root cause (Wompi side — reproducir de su post-mortem)
- Lo que funcionó (polling, reconcile-hot, etc.)
- Lo que NO funcionó (alertas tardías, UI no bloqueó, etc.)
- Acciones preventivas con owner + deadline

---

## 5. Dependencias preventivas (hacer antes de piloto)

- [ ] Feature flag `PAYMENTS_DISABLED` pre-cableado en `payment.service.ts` y UI
- [ ] Banner de incidente dinámico (lee `PAYMENTS_DISABLED` desde server)
- [ ] Sentry alert: `wompi.createTransaction.timeout > 10 en 30 min`
- [ ] Sentry alert: `payment.status = 'ERROR' > 5% en 10 min`
- [ ] Broadcast WhatsApp automatizado a restaurantes (Twilio o similar)
- [ ] Test: simulacro de outage en staging — confirmar que bloqueo + reanudación funcionan sin data loss

---

## 6. Escenarios fuera de scope de este runbook

- **Wompi credenciales del restaurante caducaron** → runbook `wompi-credentials-expired.md` (TODO)
- **HMAC failure masivo** (posible rotación de secret no propagada) → runbook `webhook-hmac-mass-failure.md` (TODO)
- **DB Supabase caída** → runbook `db-restore.md` (TODO)

# Piloto Día 1 — Checklist operacional

**Propósito**: guía de turnado completo para el primer día con un restaurante real. Se supone que todos los runbooks están escritos y las alertas configuradas. Este doc es el "qué mirar, qué responder, cómo cerrar el día".

**Horizonte**: primera semana del piloto, refinar después.

---

## 🌅 Pre-apertura (mañana, antes de servicio)

### Dashboard de salud — 5 min

| Check | Esperado | Si falla |
|---|---|---|
| [ ] `vercel ls smart-checkout --prod` | Último deploy Ready desde ≥ 1h atrás (no pushes frescos) | Investigar deploys fallidos |
| [ ] Sentry → Issues (filter `vercel-production`, last 24h) | 0 issues unresolved nuevos | Triage por prioridad antes de abrir |
| [ ] Sentry → Alerts | 6 alertas activas + uptime ✅ | Re-habilitar si alguna en pausa |
| [ ] Vercel → Observability → Crons | Los 3 crones ejecutaron en última hora con 200 | Ver `uptime-alert.md` |
| [ ] Supabase → Database → Backups | Último backup < 24h | Si falla, escalar a Supabase support |
| [ ] `/api/health` responde 200 | `{"status":"ok","db":"ok"}` | Seguir `uptime-alert.md` |

**Si cualquiera falla rojo**: considerá NO abrir pagos QR ese día. Cobran con datafono mientras resolvés.

### Chequeo con el restaurante — 2 min

WhatsApp al dueño/admin:
```
Buen día <NOMBRE>! Todo listo de nuestro lado para abrir.
Si tenés algún problema con el QR, los pagos, o ves algo raro
en tu dashboard, escribime acá ya. Yo monitoreo en tiempo real.
Éxitos!
```

---

## 🍽️ Durante el servicio (acceso constante)

### Tabs que tenés abiertas

1. **Sentry Issues** — filter `is:unresolved environment:vercel-production` en vista tipo lista
2. **Vercel → Observability → Logs** — filter `/api/payment/*` para ver requests en vivo
3. **Dashboard `/payments`** — la del propio restaurante, mostrando APPROVED + PENDING
4. **WhatsApp con el dueño** — canal directo

### Respuesta a alertas Sentry

| Alerta recibida | Acción inmediata |
|---|---|
| 🔴 Webhook HMAC failure | Abrí `wompi-down.md` §1.1 → verificar status Wompi. Si Wompi OK → posible rotación de secret no propagada, escalar. |
| 🔴 Payment API exception | Abrí el stack trace en Sentry. Si es bug reproducible → fix con hotfix. Si es un caso edge → monitor y no abrir ticket inmediato. |
| 🔴 Reconcile discrepancy | **PARAR TODO**. Seguir `double-charge-claim.md` §1.4. No confiar en ningún payment hasta entender causa. |
| 🟡 Siigo API 5xx surge | Abrir status.siigo.com. Si down → informar al restaurante, los pagos siguen (solo falla el cierre automático de mesa). Reconciliar manual al final. |
| 🟡 Webhook processing errors | Ver últimas requests en Vercel logs. Probable payload malformado de Wompi — reportar al soporte Wompi. |
| 🟡 Webhook replay rejected | Raro. Revisar Sentry → si es 1 evento, falso positivo. Si es spike → posible ataque, escalar a lead-dev. |
| ✅ Uptime monitoring | Seguir `uptime-alert.md`. |

### Respuesta a mensajes del restaurante

| Mensaje del dueño | Respuesta inicial |
|---|---|
| "Un comensal dice que pagó pero no veo el cobro" | Pedir `reference` del pago → query en dashboard `/payments?search=<ref>` (cuando exista) o SQL directo. Revisar status del payment. |
| "Un comensal dice que le cobraron 2 veces" | Abrir `double-charge-claim.md` §1.1 inmediatamente. No conformar con "ya lo devolvemos" sin confirmar primero. |
| "No se abre el QR, dice 'QR no válido'" | Pedir foto del error + la mesa. Si es una sola mesa → runbook `qr-rotate-single.md` NO aplica directo (esto es al revés, el QR no se validó). Verificar `token_version` en DB vs qrToken en URL. |
| "La app está lenta" | Vercel → Analytics → ver p99 latencia `/api/payment/*`. Si >3s sostenido → investigar. |
| "No puedo cobrar, todos los pagos fallan" | **Evaluar**: si es solo ese restaurante → sus credenciales Wompi/Siigo. Si es sistema-wide → `wompi-down.md`. |

### Verificaciones proactivas (cada 30 min mientras hay servicio)

```sql
-- Payments en hold >10min (señal temprana de problema)
SELECT p.reference, p.status, p.amount_in_cents, p.created_at, r.slug
  FROM payments p
  JOIN orders o      ON o.id = p.order_id
  JOIN restaurants r ON r.id = o.restaurant_id
 WHERE p.status = 'PENDING'
   AND p.created_at < NOW() - INTERVAL '10 minutes'
   AND r.is_active = true
 ORDER BY p.created_at ASC;
```

Si devuelve > 3 rows → investigar. Probable webhook perdido + reconcile-hot aún no lo agarra.

---

## 🌙 Cierre del día (al terminar servicio del restaurante)

### Reconciliación — 15 min

Por cada restaurante que operó hoy, cruzar:

```sql
-- Resumen del día
SELECT
  r.slug,
  r.name,
  COUNT(*) FILTER (WHERE p.status = 'APPROVED') AS aprobados,
  COUNT(*) FILTER (WHERE p.status = 'PENDING')  AS pendientes,
  COUNT(*) FILTER (WHERE p.status = 'DECLINED') AS rechazados,
  COUNT(*) FILTER (WHERE p.status = 'ERROR')    AS errores,
  SUM(p.amount_in_cents) FILTER (WHERE p.status = 'APPROVED') AS total_aprobado_cents
FROM payments p
JOIN orders o      ON o.id = p.order_id
JOIN restaurants r ON r.id = o.restaurant_id
WHERE p.created_at::date = NOW()::date
  AND r.is_active = true
GROUP BY r.slug, r.name
ORDER BY r.slug;
```

Contrastar con:
- **Panel Wompi** → total aprobado del día debería matchear `total_aprobado_cents / 100`
- **Panel Siigo** → total facturado del día debería matchear también (con diferencia de propina si aplica)

Si hay mismatch:
- Wompi > nuestro total → webhook perdido. Ver si reconcile-hot/zombie lo atrapó. Si no, entrada manual.
- Siigo > Wompi → algo se facturó sin cobrar? Raro, escalar.
- Siigo < Wompi → algo cobró sin facturar (Siigo falló al cerrar mesa). Ver `payments WHERE status=APPROVED AND paid_at > NOW()-INTERVAL '1 day'` + revisar si siguen mesas abiertas en Siigo.

### Limpieza de PENDING colgados

```sql
-- ¿Hay PENDING de hoy que quedaron huérfanos?
SELECT COUNT(*) FROM payments
 WHERE status = 'PENDING'
   AND created_at::date = NOW()::date
   AND created_at < NOW() - INTERVAL '1 hour';
```

Si >0 → usar `double-charge-claim.md` §1.5 para verificar webhook + aplicar manual si Wompi confirma APPROVED.

### Mensaje de cierre al restaurante

```
<NOMBRE>, cerramos el día.

Resumen:
  Pagos procesados: <N>
  Total cobrado por QR: $<X> COP
  Propina recaudada: $<Y> COP
  Incidencias: ninguna / [lista]

Mañana sigo monitoreando desde las 11am.
Cualquier reclamo de comensales post-cierre, contame acá.

Éxitos!
```

---

## 📊 Métricas de la semana (viernes EOD)

Al cerrar la primera semana:

1. **Tasa de éxito**: `COUNT(APPROVED) / COUNT(*) WHERE status != 'CANCELLED'` → target > 95%
2. **Latencia p99** del checkout: desde escaneo QR hasta redirect APPROVED → target < 8s
3. **Webhooks perdidos**: `COUNT(PENDING al final del día que terminaron APPROVED via cron)` → target < 5% de total
4. **Reclamos**: # de tickets de doble cobro, QR no válido, etc. → target 0-1/semana
5. **NPS del comensal**: si se implementa survey → target > 40

Escribir retro en `docs/pilot-retros/semana-<N>.md` con estas métricas + lecciones.

---

## 🚨 Escaladas — cuándo no resolver solo

Escalar a un 2do par de ojos si:

- 🔴 **Reconcile discrepancy alert disparó** — nunca en normal, siempre escalar
- 🔴 **2+ restaurantes reportan problema simultáneo** — es sistema-wide
- 🔴 **Mismatch de reconciliación > 1 pago** al cierre — no es error puntual
- 🔴 **Cualquier pérdida de dinero reportada del restaurante** (no del comensal) — legal
- 🔴 **Comensal reportando via redes sociales públicas** — manejo de crisis

Contacto escalada: [TODO completar con nombres/teléfonos]

---

## 📞 Contactos rápidos

**Source of truth**: [`contacts.md`](./contacts.md) — abrí ese archivo en otra pestaña durante el servicio.

Si alguno de estos contactos NO está lleno en `contacts.md`, **no abras el piloto**. Es un pre-requisito.

---

## ✅ Pre-flight final antes del Día 1 (revisar 24h antes)

- [ ] Smoke test corrió 12/12 PASS en prod ayer
- [ ] 6 alertas Sentry activas + uptime auto-detected
- [ ] Manual E2E de dashboard validado (banner + payments + refund modal)
- [ ] Runbooks escritos y leídos: double-charge, wompi-down, db-restore, uptime-alert, qr-rotate-single
- [ ] Checklist Día 1 (este doc) leído 2x
- [ ] `docs/contacts.md` 100% completo (Wompi, Siigo, Supabase, Vercel, asesores, restaurante piloto)
- [ ] Supabase PITR… opcional hoy, **obligatorio** cuando hay 2+ restaurantes activos
- [ ] Feature flag `PAYMENTS_DISABLED` en Vercel env vars (aunque el código no lo use aún — pre-cablear para cuando se implemente)
- [ ] QRs firmados impresos y entregados al restaurante piloto
- [ ] Dueño del restaurante sabe que hay QR "de emergencia" y cómo usarlo

Si algo no está listo: **pospón el Día 1**. Un piloto que empieza roto tarda 3x más en recuperar credibilidad que uno que arranca 2 días tarde.

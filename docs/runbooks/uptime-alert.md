# Runbook: Uptime alert — sitio down

**Severidad**: 🔴 Crítica — usuario no puede pagar.
**SLA respuesta**: < 5 min (triage) / < 15 min (resolución o comunicación).
**Disparador**: Sentry Uptime Monitor → `https://smart-checkout-omega.vercel.app` falla 2 checks consecutivos (2 min down).

---

## 1. Triage rápido (2 min)

Abrir 3 pestañas en paralelo:

1. **Sentry Alerts → "Uptime Monitoring for https://smart-checkout-omega.vercel.app"** → ver qué check falló (DNS / TLS / HTTP status / timeout)
2. **Vercel Dashboard → Deployments** → ¿el último deploy está Ready o Error?
3. **`curl -i https://smart-checkout-omega.vercel.app`** desde tu máquina → ¿responde?

## 2. Árbol de diagnóstico

### 2.1 Vercel muestra último deploy en Error

→ **Causa más probable**: build failed en un deploy reciente.

```bash
vercel logs <deployment-url>  # leer último error
```

Fix:
- Si es TS / build error → revertir último commit + redeploy del anterior
- Si es env var faltante → añadir en Vercel → redeploy
- Si es `prisma generate` falla → revisar migración nueva

**Mitigación inmediata** (<5 min): **rollback al último Ready**:
- Vercel Dashboard → Deployments → último Ready → menú `⋯` → **Promote to Production**

### 2.2 Vercel dice Ready pero el sitio no responde

→ **Causa más probable**: DNS / dominio / DB caída.

```bash
# DNS OK?
dig smart-checkout-omega.vercel.app

# TLS OK?
openssl s_client -connect smart-checkout-omega.vercel.app:443 -servername smart-checkout-omega.vercel.app </dev/null 2>&1 | grep -E "issuer|subject|verify"

# Health endpoint OK?
curl -i https://smart-checkout-omega.vercel.app/api/health
```

Interpretación:
- `dig` falla → DNS issue (Vercel DNS o tu dominio custom). Chequear Vercel → Domains.
- TLS falla → certificado expirado/revocado. Vercel auto-renueva Let's Encrypt; si falla manual → contactar soporte Vercel.
- `/api/health` retorna 500 → DB down. Ir a runbook `db-restore.md` §1 para diagnóstico DB.
- `/api/health` retorna 503 → app está corriendo pero algo crítico falla. Leer Sentry issues + Vercel logs.

### 2.3 Todo responde pero Sentry sigue alertando

→ Falso positivo. Probable: Sentry Uptime está chequeando un path específico con timeout corto.

```
Sentry → Alerts → Uptime Monitoring → Settings → ver URL + timeout configurados
```

Si es falso positivo → relajar threshold (timeout 10s → 30s) o cambiar check path a `/api/health`.

---

## 3. Mitigaciones por categoría

| Síntoma | Tiempo a mitigar | Acción |
|---|---|---|
| Deploy con error | 2-5 min | Rollback a último Ready |
| DB connection pool agotado | 5-10 min | Restart del pooler Supabase (Dashboard → Pooler) |
| Redis (Upstash) down | Variable | Rate limit fail-closed → clientes ven 503. Sin fix nuestro, esperar Upstash |
| Dominio expirado | Imposible | Contactar registrador, up a 24h |
| Supabase incident | Variable | status.supabase.com — si acknowledged, esperar. Si no, abrir ticket |
| Tráfico anómalo (scraper) | 5 min | Vercel → Firewall → rule temporal por User-Agent o IP |

---

## 4. Comunicación

### 4.1 Durante el incidente (<15 min)

No comunicar al público hasta tener diagnóstico. Internal war-room:
- Canal Slack / WhatsApp de equipo → "Investigating uptime down"

### 4.2 Si downtime > 15 min

WhatsApp a restaurantes activos:

```
Hola <NOMBRE>,

Nuestro sistema está con problemas técnicos. Los comensales que
escaneen el QR pueden ver un error temporal.

Estamos trabajando. Estimado: <X> min. Mientras tanto, cobrá
con datafono o efectivo.

Actualización en 15 min.
— PayR
```

### 4.3 Una vez resuelto

WhatsApp follow-up:
```
Servicio restaurado ✅.

Duración del incidente: <X> min.
Los pagos están funcionando normalmente.

Perdón por la molestia.
```

---

## 5. Post-mortem si downtime > 30 min

Archivo en `docs/post-mortems/{YYYY-MM-DD}-uptime-{slug}.md`

Mínimo:
- Timeline UTC
- Root cause + 5-whys
- Impacto: # requests failed, # restaurantes afectados (estimado)
- Acciones preventivas con owner + deadline

---

## 6. Runbooks relacionados

Si el triage en §2 apunta a una causa específica, saltar al runbook correspondiente:

- **`wompi-down.md`** — si el sitio responde pero pagos fallan
- **`db-restore.md`** — si `/api/health` dice DB down y no recuperable con restart
- **`webhook-hmac-mass-failure.md`** (TODO) — si webhook HMAC empieza a fallar masivo

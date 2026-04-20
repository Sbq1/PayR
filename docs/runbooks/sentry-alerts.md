# Runbook: Sentry Alerts — Observabilidad del piloto

**Propósito**: definir qué alerta Sentry, con qué threshold, a qué canal de Slack. Todas las reglas se configuran en la UI de Sentry (no hay as-code todavía — revisitar si superamos 25 reglas).

**Fuente de verdad**: cada alerta filtra por el tag `event_type` que emite [lib/utils/logger.ts](../../lib/utils/logger.ts) automáticamente cuando se llama `logger.error(eventName, ...)`.

---

## Tabla maestra

| Evento | Severidad | Threshold | Canal | Dónde se emite |
|---|---|---|---|---|
| `wompi.timeout` | high | ≥3 en 5min | `#payments-alerts` | [wompi-fetch.ts](../../lib/adapters/payment/wompi-fetch.ts) |
| `wompi.5xx` | high | ≥5 en 5min | `#payments-alerts` | [wompi-fetch.ts](../../lib/adapters/payment/wompi-fetch.ts) |
| `wompi.network_error` | medium | ≥3 en 5min | `#payments-alerts` | [wompi-fetch.ts](../../lib/adapters/payment/wompi-fetch.ts) |
| `payment.dead_letter` | critical | ≥1 en 30min | `#payments-alerts` + email | [dead-letter-payments/route.ts](../../app/api/cron/dead-letter-payments/route.ts) |
| `payment.dead_letter.failed` | critical | ≥1 en 30min | `#payments-alerts` + email | [dead-letter-payments/route.ts](../../app/api/cron/dead-letter-payments/route.ts) |
| `payment.reconcile.discrepancy` | high | ≥1 en 15min | `#payments-alerts` | [payment.service.ts](../../lib/services/payment.service.ts) |
| `webhook.hmac_failure` | critical | ≥1 en 5min | `#security-alerts` + email | webhook handler |
| `webhook.replay_rejected` | medium | ≥3 en 5min | `#security-alerts` | webhook handler |
| `webhook.invalid_timestamp` | medium | ≥3 en 5min | `#security-alerts` | webhook handler |
| `siigo.api.5xx` | medium | ≥3 en 10min | `#pos-alerts` | siigo adapter |

**Eventos sin alerta (por ahora)**: `webhook.rate_limited`, `webhook.processing_error`. Esperar baseline de tráfico antes de calibrar threshold — sin datos reales, cualquier número es adivinanza.

---

## Pasos UI (Sentry) — una regla a la vez

Por cada fila de la tabla, repetir este flujo. La UI cambia con el tiempo; los selectores clave son los que importan (`tag:event_type`, Slack action).

1. Sentry → proyecto `payr` → **Alerts** → **Create Alert**.
2. Tipo: **Issue Alert** (no Metric Alert — Metric Alert es para performance, no para eventos de `captureMessage`).
3. **Environment**: `production` (crear una regla paralela para `preview` solo si querés testear en staging).
4. **When**: `A new issue is created` → NO, usar **The issue is seen more than [threshold] times in [window]**.
5. **If**:
   - Add filter → `The event's tags match...` → key `event_type` → value `<evento>` (ej. `wompi.timeout`).
6. **Then**:
   - Add action → **Send a Slack notification** → workspace → channel (ej. `#payments-alerts`).
   - Para severidad `critical`: agregar una segunda action → **Send an email to team members**.
7. **Rate limit**: dejar en `1 per hour` (default) para no saturar Slack durante un incidente activo — con 1 ping por hora ya sabés que sigue activo.
8. **Name**: usar convención `[${severidad}] ${evento}` — ej. `[critical] webhook.hmac_failure`. Facilita búsqueda en Sentry.
9. **Save**.

---

## Cómo testear cada regla (preview env) antes de piloto

Disparar el evento sintéticamente y confirmar que llega a Slack. Si una alerta nunca se validó, no existe — es solo configuración decorativa.

### `wompi.timeout` / `wompi.network_error`
```bash
# En Vercel preview env settings:
# Cambiar WOMPI_ENVIRONMENT de "sandbox" a "sandbox-fake" (dominio inexistente)
# → fetch falla DNS → network_error. Si resuelve pero no responde → timeout.
# Hacer un checkout en el preview. Verificar Sentry.
# REVERTIR env var después.
```

### `wompi.5xx`
Difícil de disparar contra sandbox real. Opción: mockear con una variable `WOMPI_FORCE_5XX=1` temporal dentro del wrapper — NO se hace, es prematuro. En su lugar: validar el código-path con un unit test en local (ver Verification del plan).

### `webhook.hmac_failure`
```bash
# POST directo al webhook con firma inválida
curl -X POST https://<preview-url>/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "x-event-checksum: deadbeef" \
  -d '{"event":"transaction.updated","data":{},"timestamp":'$(date +%s)',"signature":{"checksum":"bad","properties":[]}}'
# → logger.error("webhook.hmac_failure") → Sentry → Slack #security-alerts
```

### `payment.dead_letter`
```sql
-- En la DB de preview, seed un payment PENDING antiguo:
INSERT INTO payments (id, order_id, reference, amount_in_cents, status, created_at, ...)
VALUES (gen_random_uuid(), '<order-preview>', 'TEST-DEAD-LETTER', 1000, 'PENDING',
        NOW() - INTERVAL '7 hours', ...);

-- Esperar al próximo tick del cron */30 o disparar manualmente:
curl -H "Authorization: Bearer $CRON_SECRET" https://<preview>/api/cron/dead-letter-payments
-- → logger.error("payment.dead_letter") → Sentry → Slack
```

### `payment.reconcile.discrepancy`
Requiere que Wompi retorne un amount distinto al payment local. No es práctico de simular en preview. **Mitigación**: confiar en el unit test de la lógica + dejar la regla configurada. Si dispara alguna vez en prod, la alerta ya cumplió su función.

### `siigo.api.5xx`
Similar: depende de comportamiento de Siigo. Dejar configurada, validar post-integración Siigo real.

---

## Qué hacer cuando dispara cada alerta

- `wompi.timeout` / `wompi.5xx` / `wompi.network_error` → runbook [wompi-down.md](wompi-down.md)
- `payment.dead_letter*` → runbook [wompi-down.md §2.3](wompi-down.md) (pagos huérfanos al volver servicio)
- `webhook.hmac_failure` → investigar si es rotación de secret no propagada, o intento de forgery. Si >5 en 15min → desactivar webhook temporalmente (ver [double-charge-claim.md](double-charge-claim.md) §mitigación).
- `webhook.replay_rejected` / `webhook.invalid_timestamp` → benigno aislado (Wompi retry). Volumen alto → algo raro en su infra.
- `payment.reconcile.discrepancy` → CRÍTICO manual: indicio de tamper, bug de amount, o bug de encoding. Pausar reconcile-hot si hay >5, investigar uno a uno.
- `siigo.api.5xx` → runbook futuro (TODO) — por ahora, Siigo es opcional, fallo no bloquea cobros.

---

## Backlog (re-evaluar post-piloto)

Cada ítem tiene un **trigger** concreto. Sin el trigger, no se implementa — evitar sobre-ingeniería.

- **Retry intra-request con backoff en `wompiFetch`** — trigger: aparece un endpoint usuario-facing síncrono que llame Wompi (hoy no hay, los callsites actuales son cron + webhook donde el retry es el próximo tick del cron).
- **Circuit breaker Redis-backed** — trigger: Sentry muestra >50 `wompi.5xx` por día durante ≥3 días consecutivos. Hasta ese volumen, no hay datos para calibrar thresholds sin adivinar.
- **Alerts as-code (Terraform / Sentry API)** — trigger: >25 reglas configuradas manualmente. Con 10, la UI es suficiente.
- **Métrica custom `payment.error_rate`** — trigger: Sentry `captureMessage` resultan insuficientes para correlacionar error_rate con volumen. Requiere Sentry Performance o un Prometheus. Post-piloto.

---

## Checklist de rollout

- [ ] Configurar las 10 reglas en Sentry production
- [ ] Configurar las 3 reglas testeables en Sentry preview (`wompi.network_error`, `webhook.hmac_failure`, `payment.dead_letter`)
- [ ] Disparar cada test listado arriba — confirmar llegada a Slack
- [ ] Verificar que [wompi-down.md](wompi-down.md) §5 (Dependencias preventivas) ya referencia este runbook
- [ ] Agregar entrada al [README.md](README.md) de runbooks

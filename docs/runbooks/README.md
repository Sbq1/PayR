# Runbooks operacionales

**Propósito**: respuesta rápida a incidentes comunes durante el piloto. No son docs para leer casual — son cheat sheets para aplicar bajo presión.

## 📚 Índice por categoría

### 🔴 Críticos (dinero / downtime total)

| Runbook | Cuándo | SLA respuesta |
|---|---|---|
| [`double-charge-claim.md`](./double-charge-claim.md) | Comensal reclama doble cobro | < 1h confirmación / < 24h refund |
| [`db-restore.md`](./db-restore.md) | Data corruption, compromise, migración destructiva | < 30 min RTO |
| [`wompi-down.md`](./wompi-down.md) | Pagos fallan masivamente (Wompi issue) | < 15 min pausar flujo |
| [`uptime-alert.md`](./uptime-alert.md) | Sentry Uptime reporta sitio down | < 5 min triage |
| [`qr-rotate-single.md`](./qr-rotate-single.md) | QR físico expuesto (foto redes, lote viejo, etc.) | < 4 h rotar / < 24 h reemplazo |

### 🟡 Pendientes de escribir (known gaps)

- `webhook-hmac-mass-failure.md` — cuando Sentry alert "HMAC failure" dispara masivo (posible rotación de secret no propagada)
- `siigo-down.md` — Siigo API 5xx sostenido, POS no cierra mesas
- `qr-secret-rotation.md` — rotación global de `QR_SECRET` con ventana dual (14 días)
- `restaurant-subscription-cancelled.md` — qué hacer cuando un restaurante deja de pagar

### 📋 Operacional (no runbook de incidente)

- [`../pilot-day-1.md`](../pilot-day-1.md) — **checklist del Día 1 de piloto**. Qué monitorear, cómo responder, cómo cerrar el día. Leer 2x antes de abrir el primer piloto.

Prioridad post-piloto según recurrencia real.

---

## 🎯 Uso en incidente

1. **Identificá el síntoma** — no diagnóstico, solo qué ves/te dicen
2. **Abrí el runbook correspondiente** — busquen por "Cuándo" en el índice
3. **Seguí los pasos en orden** — no saltes secciones sin leer
4. **Comunicá temprano** — runbook tiene plantillas de WhatsApp
5. **Post-mortem obligatorio** si downtime > 30min o data loss > 0

---

## 📝 Convenciones

Cada runbook debería tener:
- **Severidad** (🔴 crítico / 🟡 warning / 🟢 info)
- **SLA respuesta** (tiempo objetivo de triage)
- **Síntomas** observables (lo que reporta el usuario)
- **Diagnóstico** con queries SQL ejecutables
- **Mitigación inmediata** (primeros 15 min)
- **Mitigación completa** (flujo total)
- **Comunicación** con plantillas
- **Post-mortem template**

Si vas a agregar un runbook nuevo → seguí la estructura de `double-charge-claim.md` (el más completo).

---

## 🔗 Alertas Sentry que linkean acá

Cuando Sentry dispara, el email debería mencionar el runbook correspondiente. Hoy no automatizamos eso (requiere custom template en Sentry). Por ahora, cheat sheet mental:

| Sentry alert | Runbook |
|---|---|
| 🔴 Webhook HMAC failure | `webhook-hmac-mass-failure.md` (TODO) |
| 🔴 Payment API exception | Ad-hoc (revisar stack trace) |
| 🔴 Reconcile discrepancy | `double-charge-claim.md` + escalar lead-dev |
| 🟡 Siigo API 5xx surge | `siigo-down.md` (TODO) |
| 🟡 Webhook processing errors | Ad-hoc |
| 🟡 Webhook replay rejected | Ad-hoc (posible tamper) |
| ✅ Uptime monitoring | `uptime-alert.md` |

---

## 🧪 Simulacros

El plan §9.2 exige simulacros trimestrales del `db-restore.md` en staging. Otros runbooks: simulacro anual opcional.

Último simulacro: **ninguno ejecutado aún** (pre-piloto).

---

## 📞 Contactos de escalada

**Source of truth**: [`../contacts.md`](../contacts.md) — un solo doc con todos los contactos
(Wompi, Siigo, Supabase, Vercel, Upstash, Resend, asesores legales, tributarista,
restaurantes piloto, on-call humano).

Si estás en un incidente y necesitás un teléfono **ya**, abrí `docs/contacts.md`.
Si el contacto no está ahí, es porque todavía no se llenó — hacelo apenas puedas
y dejá el doc actualizado para el próximo incidente.

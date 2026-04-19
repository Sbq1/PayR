# Runbook: Reclamo de doble cobro

**Severidad**: 🔴 Crítica — dinero del comensal.
**SLA de respuesta**: < 1 h (confirmación) / < 24 h (reembolso efectivo).

---

## Síntomas

El restaurante (o directamente el comensal vía WhatsApp/link del ticket) reporta:

- "Me cobraron dos veces la misma cuenta"
- "Pagué y me salió error, volví a pagar, ahora veo 2 cargos en el extracto"
- "La app me dijo rechazado pero el banco me debitó"

**Fuente autoritativa**: el estado de cuenta del banco del comensal. Nuestra DB es la contraparte para reconciliar.

---

## 1. Diagnóstico (primeros 15 min)

### 1.1 Identificar al comensal

Datos mínimos para encontrar sus pagos:
- Fecha del cobro (día + hora aproximada)
- Nombre del restaurante / slug
- Últimos 4 dígitos de la tarjeta (si tarjeta) o número Nequi/PSE

### 1.2 Buscar todos los pagos del comensal esa noche

```sql
-- Payments aprobados en una ventana de tiempo para un restaurante
SELECT
  p.reference,
  p.wompi_transaction_id,
  p.amount_in_cents,
  p.status,
  p.payment_method_type,
  p.refunded_amount,
  p.paid_at,
  p.created_at,
  o.id          AS order_id,
  o.status      AS order_status,
  o.table_id,
  t.label       AS table_label,
  r.slug        AS restaurant_slug
FROM payments p
JOIN orders o       ON o.id = p.order_id
JOIN tables t       ON t.id = o.table_id
JOIN restaurants r  ON r.id = o.restaurant_id
WHERE r.slug = '<SLUG>'
  AND p.created_at BETWEEN '<YYYY-MM-DD HH:MM>' AND '<YYYY-MM-DD HH:MM>'
  AND p.status IN ('APPROVED', 'PENDING', 'DECLINED', 'ERROR')
ORDER BY p.created_at ASC;
```

### 1.3 Clasificar los resultados

| Caso | SQL result | Interpretación |
|---|---|---|
| **A. 2 APPROVED mismo order_id** | 2 rows, diferente `reference`, mismo `order_id` | Nuestro bug: race condition de idempotency. Uno es el cobro legítimo, el otro a devolver. |
| **B. 2 APPROVED orders distintos misma mesa** | 2 rows, diferente `order_id` pero misma `table_id` y ventana < 30s | 2 comensales pagaron la misma mesa en paralelo. Uno cobró de más — a devolver. |
| **C. 1 APPROVED + 1 ERROR/DECLINED** | Nuestra DB dice 1 cobro pero banco dice 2 | **Mismatch con Wompi**. Ver 1.4. |
| **D. 1 APPROVED solo** | Solo 1 cobro registrado | El reclamo puede ser error del banco (preautorización × cobro). Verificar con Wompi antes de procesar. |

### 1.4 Caso C (mismatch): cruzar con Wompi

Panel Wompi → Transacciones → filtrar por fecha + monto + comensal.

Si Wompi muestra 2 APPROVED pero nuestra DB solo 1 → **nuestro webhook se perdió y el reconcile-hot cron no alcanzó a traerlo**. Aplicar manualmente:

```sql
-- Snapshot pre-fix (guardar para post-mortem)
SELECT p.*, o.status AS order_status
  FROM payments p JOIN orders o ON o.id = p.order_id
 WHERE p.reference = '<REF_DEL_COBRO_FANTASMA>';
```

Si no existe row en `payments`, hay un payment en Wompi sin contraparte local. Caso grave — escalar a `lead-dev` y NO tocar DB; usar refund vía Wompi sin registrar local.

### 1.5 Verificar webhook processing

```sql
-- ¿Llegó el webhook del pago fantasma?
SELECT *
  FROM processed_webhooks
 WHERE event_id LIKE '<WOMPI_TXN_ID>%'
 ORDER BY received_at DESC;
```

Si no hay row → webhook perdido (esperable con Wompi). El cron reconcile-hot debería haberlo capturado en ≤ 3.5 min. Si ya pasaron > 10 min sin row + payment sigue PENDING → hay un bug de cron, escalar.

---

## 2. Mitigación (60-90 min)

### 2.1 Identificar el refund a procesar

De la clasificación 1.3: **el cobro duplicado es el que NO cierra la orden legítimamente**. Típicamente el que tiene `paid_at` más tardío o `refunded_amount = 0` y su `order_id` ya tiene otro Payment APPROVED anterior.

### 2.2 Crear el refund en nuestra DB (antes de Wompi)

Por ahora el endpoint `/api/payment/refund` es **skeleton** (v1 del plan). No ejecuta Wompi automáticamente. Flujo:

**Opción A — vía Dashboard (recomendado)**:
1. Login con tu usuario del restaurante en el dashboard
2. Ir a **Pagos** (`/payments`)
3. Filtrar por estado `Aprobado` (o activar toggle "Solo colgados" si es un PENDING stuck)
4. Localizar la row por `reference` (columna Referencia) — ayuda comparar con el monto y la mesa del ticket
5. Click en el botón **Devolver** (solo aparece si `status=APPROVED` o `PARTIALLY_REFUNDED` y queda saldo)
6. En el modal:
   - **Monto a devolver (COP)**: por defecto viene el saldo restante (amount − refunded). Ajustar si es refund parcial.
   - **Motivo**: mínimo 5 caracteres. Ej: `"Doble cobro — mismo order_id, race de idempotency. Ticket #N"`.
7. Confirmar → el sistema crea el registro en `refunds` con `status=PENDING` y ajusta `payments.refunded_amount` en la misma transacción. Toast de éxito.
8. **Importante**: el dinero todavía NO volvió al comensal. Continuar con pasos 2.3 (Wompi) y 2.4 (Siigo nota crédito si aplica) para ejecutar el refund real.

Errores esperables en el modal:
- `409 REFUND_EXCEEDS_PAYMENT` — el monto ingresado supera el saldo disponible. Revisar la columna `Devuelto` y restar.
- `409 REFUND_DUPLICATE` — ya existe un refund con el mismo (payment, monto, motivo) en el día. Cambiar motivo o consultar si fue procesado.
- `409 IDEMPOTENCY_IN_FLIGHT` — otro operador está procesando el mismo refund. Esperar 60s y reintentar.

**Opción B — vía curl (fallback si el dashboard no está accesible)**:

```bash
# Staff session cookie requerida (sc-session). Obtener del navegador logueado.
curl -X POST https://<PROD_URL>/api/payment/refund \
  -H "Cookie: sc-session=<TU_JWT_DE_STAFF>" \
  -H "Idempotency-Key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "<PAYMENT_ID>",
    "amountInCents": <MONTO_EXACTO>,
    "reason": "Doble cobro — mismo order_id, race de idempotency. Ticket #<N>"
  }'
```

Respuestas esperadas:
- `200` + refund row → OK, seguir a 2.3
- `409 REFUND_EXCEEDS_PAYMENT` → monto mayor al disponible. Revisar `refunded_amount` actual.
- `404` → paymentId incorrecto.

### 2.3 Ejecutar el refund real en Wompi (manual v1)

1. Entrar a Panel Wompi → Transacciones → buscar por `wompi_transaction_id`
2. Botón "Reembolsar" → monto **exactamente igual** al del paso 2.2
3. Confirmar
4. Copiar el `wompi_refund_id` que devuelve Wompi

Actualizar nuestra DB con el ID devuelto:
```sql
UPDATE refunds
   SET wompi_refund_id = '<ID_WOMPI>',
       status          = 'APPROVED',
       processed_at    = NOW()
 WHERE id = '<REFUND_ID_DE_2.2>';
```

### 2.4 Nota crédito en Siigo (si aplica)

Si el payment original generó FE (`dian_doc_type = 'E_INVOICE'`), hay que emitir nota crédito manual:

1. Panel Siigo → Ventas → Facturas → buscar la FE del `siigo_invoice_id` del order
2. Acción "Emitir nota crédito" → monto del refund
3. Copiar `siigo_credit_note_id`

```sql
UPDATE refunds
   SET siigo_credit_note_id = '<NC_SIIGO>'
 WHERE id = '<REFUND_ID>';
```

Si `dian_doc_type = 'POS_EQUIVALENT'` no hace falta nota crédito — se regenera el tirilla sin el ítem.

### 2.5 Cerrar el loop en el order (si es caso B — 2 orders)

No aplica si es caso A (un solo order). Si fue caso B (2 orders en paralelo), el order "duplicado" que quedó `PAID` sin cena real:

```sql
-- Marcar como REFUNDED total
UPDATE orders
   SET status = 'REFUNDED', updated_at = NOW(), version = version + 1
 WHERE id = '<ORDER_ID_DUPLICADO>';
```

---

## 3. Comunicación

### 3.1 Al comensal (WhatsApp — dentro de 1 h de detectar)

```
Hola! Soy del equipo de PayR 👋

Confirmamos que efectivamente se generó un doble cobro en tu cuenta
del restaurante <NOMBRE>. Ya iniciamos la devolución del cargo
duplicado por COP $<MONTO>.

La devolución puede tardar 3-10 días hábiles en reflejarse en tu
banco según tu entidad bancaria. Te envío el comprobante apenas
Wompi lo procese (debería ser en las próximas 2 horas).

Mil perdones por el inconveniente — tus siguientes pagos ya quedan
protegidos, agregamos validaciones para prevenirlo.

Ref del refund: <REFUND_ID_PRIMEROS_8_CHARS>
```

### 3.2 Al restaurante (WhatsApp al dueño/admin — dentro de 2 h)

```
Hola <NOMBRE>,

Te escribimos para informarte que detectamos un doble cobro en la
mesa <NUM> el <FECHA> a las <HH:MM>. El comensal <NOMBRE_O_MESA>
fue cobrado dos veces por error técnico de nuestro lado.

Ya procesamos el reembolso del cargo duplicado ($<MONTO> COP) y el
comensal fue notificado directamente.

Tu contabilidad NO se ve afectada — solo 1 de los 2 cargos figura
como ingreso legítimo en tus reportes de Siigo.

Si el comensal te contacta: podés confirmar que PayR ya devolvió
el cargo y que llegará a su banco en 3-10 días.

Cualquier duda, respondeme acá.
```

### 3.3 Post-mortem interno

Crear issue en backlog (label: `incident`) con:
- Timeline (cuándo ocurrió, cuándo detectado, cuándo mitigado)
- Root cause (cuál de los 4 casos, qué capa falló)
- Acción preventiva (ej. "revisar logs de idempotency en P95 window")

**Si 2+ incidentes iguales en < 30 días → parar piloto hasta root-cause.**

---

## 4. Causas raíz conocidas

| Patrón | Causa | Prevención |
|---|---|---|
| **Race idempotency** | Cliente reenvió request antes de recibir response → backend no lockeó a tiempo | `withIdempotency` debería prevenir. Si reincide, bug en el lock. |
| **Webhook + cron colisión** | Webhook llega mientras cron reconcile-hot ya lo está procesando | Re-check-in-TX en `reconcilePayment` — idempotente por diseño |
| **Doble-tap en móvil** | Usuario toca botón 2x < 500ms | `isCreating` flag en UI + `Idempotency-Key` por intento |
| **Wompi nos cobra 2x** | Muy raro — ha pasado en sandbox | Wompi es source-of-truth. Reembolsar nosotros y abrir ticket con Wompi. |

---

## 5. Checklist post-incidente

- [ ] Refund procesado en Wompi + registrado en DB
- [ ] Nota crédito Siigo emitida (si FE)
- [ ] Comensal notificado por WhatsApp
- [ ] Restaurante notificado
- [ ] Issue de post-mortem creada con timeline
- [ ] Si root cause es nuestra → ticket de fix con prioridad P0

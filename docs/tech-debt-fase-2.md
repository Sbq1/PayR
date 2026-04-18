# Deuda técnica — Fase 2 (post-review)

Items detectados durante el code review cognitivo de Fase 2 que **no son
bloqueantes para piloto** pero vale la pena atender antes de escalar.

Ordenados por severidad estimada.

---

## 1. `tipDisclaimerTextVersion` sin whitelist

**Archivo:** [lib/validators/payment.schema.ts](../lib/validators/payment.schema.ts)

Hoy es `z.string().max(40).default("ley-2300-v1")`. Un cliente podría
mandar cualquier string arbitrario y se persiste en
`payments.tip_disclaimer_text_version` como evidencia legal.

**Fix sugerido:** `z.enum(["ley-2300-v1", ...])` con el set versionado
en `lib/constants/legal-texts.ts`.

**Riesgo:** bajo — la evidencia igual queda en DB con el valor que el
cliente mandó, pero si un abogado consulta y ve `"mi-string-random"`
la trazabilidad se quiebra.

---

## 2. Sin validación de `subscription_status` del restaurante

**Archivo:** [lib/auth/customer-session.ts](../lib/auth/customer-session.ts)

Hoy chequeamos `restaurants.is_active`. El plan §5 menciona un
`subscription_status` (`ACTIVE | PAST_DUE | CANCELLED | TRIAL`) que
**aún no está en el schema**. Si un restaurante deja de pagar y solo
apagamos `is_active` manualmente, hay ventana donde los QRs impresos
siguen aceptando pagos.

**Fix sugerido:** agregar col + chequear `ACTIVE | TRIAL` en
`requireCustomerSession` y `POST /api/session/start`.

**Riesgo:** medio — operacional, no de integridad de pagos. El dueño
cortado puede recibir dinero que luego debería devolverse.

---

## 3. `$executeRaw<number>` redundante en `refund.service.ts`

**Archivo:** [lib/services/refund.service.ts](../lib/services/refund.service.ts)

`$executeRaw` ya retorna `Promise<number>` (rows afectados); el
genérico explícito es ruido visual y ESLint no lo marca pero confunde
al lector.

**Fix sugerido:** quitar el `<number>` de todos los `$executeRaw`.

**Riesgo:** ninguno, solo legibilidad.

---

## 4. `canonicalize()` no maneja NaN / Infinity / ciclos

**Archivo:** [lib/utils/idempotency.ts:152-163](../lib/utils/idempotency.ts)

El hash del body usa `JSON.stringify` internamente. Casos borde:

- `NaN` / `Infinity` → `JSON.stringify` los convierte a `null`. Dos bodies
  `{amount: NaN}` y `{amount: null}` colisionan en el hash.
- Objetos cíclicos → `JSON.stringify` lanza, `withIdempotency` falla
  antes de insertar row. El cliente ve 500.

**Fix sugerido:** validar tipos antes de hashear (Zod ya rechaza
`NaN`/`Infinity` en nuestros schemas, pero la función es pública).

**Riesgo:** bajo — Zod protege los callers actuales; problema solo si
alguien expone `withIdempotency` sin validación previa.

---

## 5. Orden de validaciones en `createPayment` (status antes que tip)

**Archivo:** [lib/services/payment.service.ts](../lib/services/payment.service.ts)

Hoy validamos tip antes de status final. Si una orden está `REFUNDED`
y el cliente manda `tipAmount` excesivo, el error que devolvemos es
"Monto de propina excede el máximo permitido" en vez del más
informativo "Esta orden tiene un reembolso registrado".

**Fix sugerido:** invertir orden — status finales primero.

**Riesgo:** ninguno, solo UX de error.

---

## 6. Mensaje 409 engañoso en refund cuando el status cambió

**Archivo:** [app/api/payment/refund/route.ts](../app/api/payment/refund/route.ts)

Cuando el lock optimista de refund falla con `count=0`, siempre
devolvemos `REFUND_EXCEEDS_PAYMENT`. Pero el motivo real puede ser:

- Monto excede (caso honesto)
- Payment cambió de status (APPROVED → REFUNDED por otro manager)
- Payment no existe (ya eliminado)

**Fix sugerido:** hacer `findUnique` post-fail para diferenciar los 3
casos y devolver código apropiado (`REFUND_EXCEEDS_PAYMENT` vs
`PAYMENT_NOT_APPROVED` vs `PAYMENT_NOT_FOUND`).

**Riesgo:** bajo — el manager ve el dinero en el payment de todos modos,
solo se lleva una explicación imprecisa del fallo.

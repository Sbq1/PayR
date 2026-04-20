import { db } from "@/lib/db";
import { getPaymentAdapter } from "@/lib/adapters/payment";
import { getPosAdapter } from "@/lib/adapters/pos";
import { AppError, NotFoundError, PaymentError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import { getFiveUvtInCents } from "@/lib/services/tax.service";
import type { WompiWebhookEvent, WompiWidgetConfig } from "@/lib/adapters/payment/types";

type WompiTransaction = WompiWebhookEvent["data"]["transaction"];

const LOCK_TTL_MS = 4 * 60 * 1000; // 4min — cubre widget Wompi + margen.

/**
 * Crea un payment bajo lock optimista. Ver plan §3 (state machine) y §4
 * (flow end-to-end).
 *
 * Estructura post-review Fase 2 (evita saturar pool DB):
 *   1. Fail-fast de config (NEXT_PUBLIC_APP_URL obligatoria)
 *   2. Lectura + validaciones ownership/tip/status FUERA de TX
 *   3. Retry logic PAYING FUERA de TX — checkWompiTransactionStatus hace
 *      fetch HTTP hasta 5s; si vive dentro de db.$transaction mantiene
 *      lock DB durante ese tiempo y con 15 conexiones Supabase + 10 pagos
 *      concurrentes el pool se satura. Outcome se guarda en variables.
 *   4. Decisión de reuse vs. crear nuevo:
 *      - APPROVED          → throw "ya fue pagada"
 *      - PENDING + same    → reuse widget (si no too old)
 *      - PENDING + other   → throw "ya hay pago en proceso"
 *      - null + same       → reuse widget (si no too old)
 *      - null + other      → marcar viejo ERROR, crear nuevo
 *      - DECLINED/VOIDED/ERROR → marcar viejo, crear nuevo
 *      Guard de edad: si lastPayment.created_at > LOCK_TTL × 2 (8min),
 *      nunca reusar — marcar ERROR y permitir nuevo Payment.
 *   5. TX corta: update viejo (opcional) + lock optimista + crea Payment
 *      + actualiza mesa. Sin HTTP externo adentro.
 *   6. adapter.createTransaction fuera de TX (solo firma integrity, no HTTP).
 */
export async function createPayment(params: {
  orderId: string;
  slug: string;
  tableId: string;
  tipPercentage: number;
  tipAmount: number;
  acceptedTipDisclaimer: boolean;
  tipDisclaimerTextVersion: string;
  customerDocument?: {
    type: "CC" | "CE" | "NIT" | "PASSPORT";
    number: string;
  };
  customerEmail?: string;
  expectedVersion: number;
  sessionId: string;
}): Promise<{
  paymentId: string;
  reference: string;
  widgetConfig: WompiWidgetConfig;
  orderVersion: number;
}> {
  const {
    orderId,
    slug: claimedSlug,
    tableId: claimedTableId,
    tipPercentage,
    tipAmount,
    acceptedTipDisclaimer,
    tipDisclaimerTextVersion,
    customerDocument,
    customerEmail,
    expectedVersion,
    sessionId,
  } = params;

  // 0. Kill switch operacional. Setear `PAYMENTS_DISABLED=true` en Vercel env
  //    vars + redeploy cuando hay incidente (Wompi caído, data corruption en
  //    progreso de restore, etc.). Los runbooks `wompi-down.md §2.1` y
  //    `db-restore.md §1.3` referencian este flag. Flag es string-typed para
  //    evitar ambigüedad (Vercel guarda env vars como strings).
  if (process.env.PAYMENTS_DISABLED === "true") {
    throw new AppError(
      "Pagos temporalmente pausados. Paga al mesero o intenta en unos minutos.",
      503,
      "PAYMENTS_DISABLED"
    );
  }

  // 1. Fail-fast: sin NEXT_PUBLIC_APP_URL no podemos construir redirectUrl;
  //    mejor cortar antes de tocar DB que mandar al user a localhost en prod.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new AppError(
      "NEXT_PUBLIC_APP_URL no configurado",
      500,
      "CONFIG_ERROR"
    );
  }

  // 2. Lectura + validaciones fuera de TX (no bloquean pool).
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { restaurants: true },
  });
  if (!order) throw new NotFoundError("Orden");
  if (order.restaurants.slug !== claimedSlug) throw new NotFoundError("Orden");
  if (order.table_id !== claimedTableId) throw new NotFoundError("Orden");

  if (tipAmount > order.subtotal) {
    throw new PaymentError("Monto de propina excede el máximo permitido");
  }
  // Defensa en profundidad — Zod ya exige disclaimer si tip>0.
  if (tipAmount > 0 && !acceptedTipDisclaimer) {
    throw new PaymentError("Falta aceptación del aviso de propina (Ley 2300)");
  }

  if (order.status === "PAID") throw new PaymentError("Esta orden ya fue pagada");
  if (order.status === "CANCELLED") throw new PaymentError("Esta orden fue cancelada");
  if (order.status === "REFUNDED" || order.status === "PARTIALLY_REFUNDED") {
    throw new PaymentError("Esta orden tiene un reembolso registrado");
  }

  // 3. Retry logic FUERA de TX — si hubo intento previo en Wompi, no duplicar
  //    el cargo. El JWT comensal expira en 2h (requireCustomerSession rechaza
  //    antes de llegar acá), así que un "mismo sessionId" no viene del futuro
  //    lejano; el guard de edad cubre widgets abandonados pero dentro de 2h.
  let paymentToMarkId: string | null = null;
  // En este flow siempre seteamos DECLINED/VOIDED/ERROR (APPROVED/PENDING
  // se manejan antes con throw o reuse). El tipo amplio del return de
  // mapWompiStatus evita un cast; las ramas de abajo nunca producen APPROVED.
  let paymentToMarkStatus: ReturnType<typeof mapWompiStatus> = "ERROR";
  let reusablePayment:
    | { id: string; reference: string; amountInCents: number }
    | null = null;

  if (order.status === "PAYING") {
    const lastPayment = await db.payment.findFirst({
      where: { order_id: orderId, status: "PENDING" },
      orderBy: { created_at: "desc" },
    });
    if (lastPayment) {
      const wompiStatus = await checkWompiTransactionStatus(
        order.restaurants,
        lastPayment.reference
      );

      if (wompiStatus === "APPROVED") {
        throw new PaymentError("Esta orden ya fue pagada");
      }

      const sameSession = order.locked_by_session_id === sessionId;
      // Guard de edad: si el Payment tiene más de LOCK_TTL × 2 (8min),
      // aunque sea misma sess el widget cliente probablemente expiró.
      // Marcamos ERROR y creamos uno nuevo — riesgo residual de doble cobro
      // si Wompi aprueba después es bajo (widget Wompi timeouts ~5min).
      const tooOld =
        Date.now() - lastPayment.created_at.getTime() > LOCK_TTL_MS * 2;

      // Guard de monto (fix A1 post-audit): si el order.total actual difiere
      // del amount congelado del Payment previo (ej. POS sync agregó ítems
      // mid-flow), reusar cobraría el monto viejo → subpago al restaurante.
      // No reusar; crear Payment nuevo con el total correcto.
      const currentTotal = order.subtotal + order.tax + tipAmount;
      const amountMatches =
        Number(lastPayment.amount_in_cents) === currentTotal;

      const canReuse = sameSession && !tooOld && amountMatches;

      if (wompiStatus === "PENDING") {
        if (canReuse) {
          reusablePayment = {
            id: lastPayment.id,
            reference: lastPayment.reference,
            amountInCents: Number(lastPayment.amount_in_cents),
          };
        } else if (sameSession) {
          // Misma sess pero stale (tooOld o amount drift): marcar ERROR y
          // permitir nuevo Payment.
          paymentToMarkId = lastPayment.id;
          paymentToMarkStatus = "ERROR";
        } else {
          throw new PaymentError("Ya hay un pago en proceso para esta orden");
        }
      } else if (wompiStatus === null) {
        // Wompi no tiene la transacción — user abandonó pre-checkout, o
        // Wompi API cayó. Misma sess + reciente + mismo monto → reusar
        // reference existente es idempotente en Wompi (reusa el intent).
        if (canReuse) {
          reusablePayment = {
            id: lastPayment.id,
            reference: lastPayment.reference,
            amountInCents: Number(lastPayment.amount_in_cents),
          };
        } else {
          paymentToMarkId = lastPayment.id;
          paymentToMarkStatus = "ERROR";
        }
      } else {
        // DECLINED / VOIDED / ERROR → permitir retry tras marcar el viejo.
        paymentToMarkId = lastPayment.id;
        paymentToMarkStatus = mapWompiStatus(wompiStatus);
      }
    }
  }

  // 4. Reuse path: regenerar widget con misma reference y salir sin tocar DB.
  if (reusablePayment) {
    const adapter = getPaymentAdapter({
      posProvider: order.restaurants.pos_provider,
      wompiPublicKey: order.restaurants.wompi_public_key,
      wompiPrivateKey: order.restaurants.wompi_private_key,
      wompiEventsSecret: order.restaurants.wompi_events_secret,
      wompiIntegritySecret: order.restaurants.wompi_integrity_secret,
    });
    const redirectUrl = `${appUrl}/${order.restaurants.slug}/${order.table_id}/result?ref=${reusablePayment.reference}`;
    const widgetConfig = await adapter.createTransaction({
      amountInCents: reusablePayment.amountInCents,
      reference: reusablePayment.reference,
      redirectUrl,
      customerEmail,
    });
    return {
      paymentId: reusablePayment.id,
      reference: reusablePayment.reference,
      widgetConfig,
      orderVersion: order.version,
    };
  }

  // 4.5. Validación DIAN 5 UVT (solo para Payments nuevos; reuse ya pasó
  //      por acá en su creación original y no re-validamos).
  //
  //      MANDATORY: total ≥ 5 UVT exige customer_document. Sin doc → 422.
  //                 Con doc o total ≥ 5 UVT → dian_doc_type='E_INVOICE'.
  //      OPTIONAL/EXEMPT: dian_doc_type='POS_EQUIVALENT' siempre.
  //
  //      Lookup UVT fuera de TX (evita extender el lock de pool por una
  //      query de catálogo). Cacheamos el valor para no duplicar queries.
  const currentTotal = order.subtotal + order.tax + tipAmount;
  let dianDocType: "E_INVOICE" | "POS_EQUIVALENT" = "POS_EQUIVALENT";
  if (order.restaurants.fe_regime === "MANDATORY") {
    const fiveUvt = await getFiveUvtInCents();
    if (currentTotal >= fiveUvt && !customerDocument) {
      throw new AppError(
        "El pago supera 5 UVT. Se requiere documento de identificación del adquiriente para facturación electrónica.",
        422,
        "DOCUMENT_REQUIRED_5UVT"
      );
    }
    if (customerDocument || currentTotal >= fiveUvt) {
      dianDocType = "E_INVOICE";
    }
  }

  // 5. TX corta — solo operaciones DB.
  const { payment, tableId, restaurant, nextVersion } = await db.$transaction(
    async (tx) => {
      if (paymentToMarkId) {
        await tx.payment.update({
          where: { id: paymentToMarkId },
          data: { status: paymentToMarkStatus },
        });
      }

      const total = order.subtotal + order.tax + tipAmount;

      // Lock optimista. 3 branches permitidas en el OR:
      //   - orden PENDING con version match → nuevo lock
      //   - PAYING expirado → override del lock muerto
      //   - PAYING del mismo session → retry del propio comensal
      // count=0 → otra sesión ganó o status cambió a PAID/CANCELLED → 409.
      const lockResult = await tx.order.updateMany({
        where: {
          id: orderId,
          version: expectedVersion,
          OR: [
            { status: "PENDING" },
            {
              AND: [
                { status: "PAYING" },
                { lock_expires_at: { lt: new Date() } },
              ],
            },
            {
              AND: [
                { status: "PAYING" },
                { locked_by_session_id: sessionId },
              ],
            },
          ],
        },
        data: {
          status: "PAYING",
          version: { increment: 1 },
          locked_at: new Date(),
          lock_expires_at: new Date(Date.now() + LOCK_TTL_MS),
          locked_by_session_id: sessionId,
          tip_amount: tipAmount,
          tip_percentage: tipPercentage,
          total,
        },
      });

      if (lockResult.count === 0) {
        throw new AppError(
          "Otra sesión está procesando esta mesa. Volvé a cargar la cuenta.",
          409,
          "ORDER_VERSION_MISMATCH"
        );
      }

      const reference = `SC-${orderId.slice(-8)}-${Date.now()}`;
      const pmt = await tx.payment.create({
        data: {
          order_id: orderId,
          reference,
          amount_in_cents: total,
          currency: "COP",
          status: "PENDING",
          customer_email: customerEmail || null,
          tip_amount: tipAmount,
          tip_percentage: tipPercentage,
          tip_disclaimer_accepted_at: tipAmount > 0 ? new Date() : null,
          tip_disclaimer_text_version:
            tipAmount > 0 ? tipDisclaimerTextVersion : null,
          customer_document_type: customerDocument?.type ?? null,
          customer_document_number: customerDocument?.number ?? null,
          dian_doc_type: dianDocType,
        },
      });

      await tx.table.update({
        where: { id: order.table_id },
        data: { status: "PAYING" },
      });

      return {
        payment: pmt,
        tableId: order.table_id,
        restaurant: order.restaurants,
        nextVersion: expectedVersion + 1,
      };
    }
  );

  // 6. adapter.createTransaction fuera de TX (no hace HTTP; solo firma integrity).
  const reference = payment.reference;
  const adapter = getPaymentAdapter({
    posProvider: restaurant.pos_provider,
    wompiPublicKey: restaurant.wompi_public_key,
    wompiPrivateKey: restaurant.wompi_private_key,
    wompiEventsSecret: restaurant.wompi_events_secret,
    wompiIntegritySecret: restaurant.wompi_integrity_secret,
  });

  const redirectUrl = `${appUrl}/${restaurant.slug}/${tableId}/result?ref=${reference}`;

  const widgetConfig = await adapter.createTransaction({
    amountInCents: Number(payment.amount_in_cents),
    reference,
    redirectUrl,
    customerEmail,
  });

  return {
    paymentId: payment.id,
    reference,
    widgetConfig,
    orderVersion: nextVersion,
  };
}

/**
 * Procesa un webhook de Wompi:
 * 1. Busca el pago por referencia
 * 2. Valida firma HMAC
 * 3. Actualiza estado del pago
 * 4. Si APPROVED: marca orden como PAID y cierra mesa en POS
 */
export async function handlePaymentWebhook(
  event: WompiWebhookEvent
): Promise<void> {
  const { transaction } = event.data;

  // 1. Buscar pago por referencia
  const payment = await db.payment.findUnique({
    where: { reference: transaction.reference },
    include: {
      orders: {
        include: { restaurants: true },
      },
    },
  });

  if (!payment) {
    console.warn(`Webhook: payment not found for ref ${transaction.reference}`);
    return; // Retornamos 200 para que Wompi no reintente
  }

  // Idempotencia: si ya esta en estado final, ignorar
  if (["APPROVED", "DECLINED", "VOIDED"].includes(payment.status)) {
    return;
  }

  const restaurant = payment.orders.restaurants;

  // 2. Validar firma HMAC
  const adapter = getPaymentAdapter({
    posProvider: restaurant.pos_provider,
    wompiPublicKey: restaurant.wompi_public_key,
    wompiPrivateKey: restaurant.wompi_private_key,
    wompiEventsSecret: restaurant.wompi_events_secret,
    wompiIntegritySecret: restaurant.wompi_integrity_secret,
  });

  const isValid = adapter.verifyWebhookSignature(event);

  if (!isValid) {
    console.error(`Webhook: invalid signature for ref ${transaction.reference}`);
    throw new PaymentError("Firma de webhook invalida");
  }

  // 3. Verificar reference exact-match (defensa contra colisiones parciales)
  if (transaction.reference !== payment.reference) {
    console.error(
      `Webhook: reference mismatch. Expected ${payment.reference}, got ${transaction.reference}`
    );
    throw new PaymentError("Referencia de transaccion no coincide");
  }

  // 4. Verificar que el monto coincida
  if (transaction.amount_in_cents !== payment.amount_in_cents) {
    console.error(
      `Webhook: amount mismatch. Expected ${payment.amount_in_cents}, got ${transaction.amount_in_cents}`
    );
    throw new PaymentError("Monto de transaccion no coincide");
  }

  // 5. Verificar moneda (prevenir bypass multimoneda)
  if (transaction.currency !== "COP") {
    console.error(`Webhook: invalid currency ${transaction.currency}`);
    throw new PaymentError("Moneda de transaccion no permitida");
  }

  // 6. Actualizar estado del pago atómicamente con re-check dentro de la TX
  //    para prevenir race condition con /api/payment/verify corriendo en paralelo.
  const wompiStatus = transaction.status.toUpperCase();
  const mappedStatus = mapWompiStatus(wompiStatus);

  const applied = await db.$transaction(async (tx) => {
    const fresh = await tx.payment.findUnique({
      where: { id: payment.id },
      select: { status: true },
    });
    // Si otro thread ya llevó este payment a estado final, no re-aplicamos.
    if (!fresh || ["APPROVED", "DECLINED", "VOIDED"].includes(fresh.status)) {
      return false;
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        wompi_transaction_id: transaction.id,
        status: mappedStatus,
        payment_method_type: transaction.payment_method_type,
        customer_email: transaction.customer_email || payment.customer_email,
        wompi_response: JSON.parse(JSON.stringify(transaction)),
        paid_at: mappedStatus === "APPROVED" ? new Date() : null,
      },
    });

    if (mappedStatus === "APPROVED") {
      await tx.order.update({
        where: { id: payment.order_id },
        data: { status: "PAID" },
      });

      await tx.table.update({
        where: { id: payment.orders.table_id },
        data: { status: "AVAILABLE" },
      });
    }

    return true;
  });

  if (!applied) return; // otra TX ya llevó el payment a estado final

  // 7. Cierre en POS fuera de la transacción DB (no-op si es demo)
  if (mappedStatus === "APPROVED") {
    try {
      const order = payment.orders;
      if (order.siigo_invoice_id) {
        const posAdapter = getPosAdapter({
          posProvider: restaurant.pos_provider,
          siigoUsername: restaurant.siigo_username,
          siigoAccessKey: restaurant.siigo_access_key,
        });
        await posAdapter.closeTable({
          invoiceId: order.siigo_invoice_id,
          amount: payment.amount_in_cents,
          // dian_doc_type puede ser null en Payments pre-Fase 3 (rows
          // legacy) — default POS_EQUIVALENT mantiene comportamiento viejo.
          dianDocType:
            (payment.dian_doc_type as
              | "E_INVOICE"
              | "POS_EQUIVALENT"
              | null) ?? "POS_EQUIVALENT",
          customerDocument:
            payment.customer_document_type && payment.customer_document_number
              ? {
                  type: payment.customer_document_type,
                  number: payment.customer_document_number,
                }
              : undefined,
        });
      }
    } catch (error) {
      // Log pero no falla — el pago ya fue exitoso
      console.error("Error closing table in POS:", error);
    }
  }
}

/**
 * Consulta Wompi API para verificar el status real de una transacción.
 * Retorna el status de Wompi, o null si no existe transacción.
 */
async function checkWompiTransactionStatus(
  restaurant: { wompi_public_key: string | null },
  reference: string
): Promise<string | null> {
  if (!restaurant.wompi_public_key) return null;
  const txn = await fetchWompiTransactionByReference(
    restaurant.wompi_public_key,
    reference,
    5_000
  );
  return txn?.status ?? null;
}

/**
 * Consulta Wompi API y retorna el objeto transaction completo si existe.
 * Compartido entre `checkWompiTransactionStatus` (retry en createPayment) y
 * `reconcilePayment` (verify + cron de reconciliación).
 */
async function fetchWompiTransactionByReference(
  publicKey: string,
  reference: string,
  timeoutMs = 10_000
): Promise<WompiTransaction | null> {
  const env = (process.env.WOMPI_ENVIRONMENT || "sandbox")
    .replace(/\\n|\n/g, "")
    .trim();
  const baseUrl =
    env === "production"
      ? "https://production.wompi.co"
      : "https://sandbox.wompi.co";

  try {
    const res = await fetch(
      `${baseUrl}/v1/transactions?reference=${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${publicKey}` },
        signal: AbortSignal.timeout(timeoutMs),
      }
    );
    if (!res.ok) return null;
    const { data } = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0] as WompiTransaction;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Resultado de reconciliar un payment con Wompi.
 * El caller decide cómo mapear a HTTP status / métrica.
 */
export type ReconcileOutcome =
  | { status: "APPROVED"; applied: boolean; alreadyFinal?: boolean }
  | { status: "DECLINED" | "VOIDED" | "ERROR"; applied: boolean }
  | { status: "PENDING" }
  | { status: "NOT_FOUND" }
  | { status: "MISMATCH"; field: "reference" | "amount" | "currency" };

/**
 * Reconcilia un payment con Wompi por reference.
 *
 * Consulta Wompi API, valida reference/amount/currency exactos, y aplica
 * la transición de estado de forma atómica con re-check dentro de la TX
 * para prevenir race conditions con el webhook concurrente.
 *
 * Idempotente: si el payment ya está en estado final, retorna `alreadyFinal`.
 *
 * Usado por:
 * - `/api/payment/verify` (polling del cliente tras redirect Wompi)
 * - `/api/cron/reconcile-payments-*` (reconciliación server-side)
 */
export async function reconcilePayment(
  reference: string
): Promise<ReconcileOutcome> {
  const payment = await db.payment.findUnique({
    where: { reference },
    include: {
      orders: { include: { restaurants: true } },
    },
  });

  if (!payment) return { status: "NOT_FOUND" };

  if (payment.status === "APPROVED") {
    return { status: "APPROVED", applied: false, alreadyFinal: true };
  }
  if (
    payment.status === "DECLINED" ||
    payment.status === "VOIDED" ||
    payment.status === "ERROR"
  ) {
    return { status: payment.status, applied: false };
  }
  if (payment.status !== "PENDING") {
    return { status: "PENDING" };
  }

  const restaurant = payment.orders.restaurants;

  // Sin credenciales Wompi completas (modo demo) → nada que reconciliar.
  if (
    !restaurant.wompi_public_key ||
    !restaurant.wompi_private_key ||
    !restaurant.wompi_events_secret ||
    !restaurant.wompi_integrity_secret
  ) {
    return { status: "PENDING" };
  }

  const txn = await fetchWompiTransactionByReference(
    restaurant.wompi_public_key,
    reference
  );

  if (!txn) return { status: "PENDING" };

  // Validación estricta antes de aplicar transición.
  // Cada MISMATCH se loguea como `payment.reconcile.discrepancy` para
  // alerta Sentry (§8.1 del plan — crítico: indica tamper o bug de amount).
  if (txn.reference !== payment.reference) {
    logger.error("payment.reconcile.discrepancy", {
      field: "reference",
      paymentId: payment.id,
      expected: payment.reference,
      got: txn.reference,
    });
    return { status: "MISMATCH", field: "reference" };
  }
  if (txn.amount_in_cents !== payment.amount_in_cents) {
    logger.error("payment.reconcile.discrepancy", {
      field: "amount",
      paymentId: payment.id,
      expected: payment.amount_in_cents,
      got: txn.amount_in_cents,
    });
    return { status: "MISMATCH", field: "amount" };
  }
  if (txn.currency !== "COP") {
    logger.error("payment.reconcile.discrepancy", {
      field: "currency",
      paymentId: payment.id,
      got: txn.currency,
    });
    return { status: "MISMATCH", field: "currency" };
  }

  if (txn.status === "APPROVED") {
    const result = await db.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      if (!fresh || fresh.status !== "PENDING") {
        return { applied: false };
      }

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          wompi_transaction_id: txn.id,
          status: "APPROVED",
          payment_method_type: txn.payment_method_type,
          customer_email: txn.customer_email || payment.customer_email,
          paid_at: new Date(),
        },
      });

      await tx.order.update({
        where: { id: payment.order_id },
        data: { status: "PAID" },
      });

      await tx.table.update({
        where: { id: payment.orders.table_id },
        data: { status: "AVAILABLE" },
      });

      return { applied: true };
    });

    // Cerrar en POS fuera de la TX DB (I/O externo, no transaccional).
    if (result.applied && payment.orders.siigo_invoice_id) {
      try {
        const posAdapter = getPosAdapter({
          posProvider: restaurant.pos_provider,
          siigoUsername: restaurant.siigo_username,
          siigoAccessKey: restaurant.siigo_access_key,
        });
        await posAdapter.closeTable({
          invoiceId: payment.orders.siigo_invoice_id,
          amount: payment.amount_in_cents,
          dianDocType:
            (payment.dian_doc_type as
              | "E_INVOICE"
              | "POS_EQUIVALENT"
              | null) ?? "POS_EQUIVALENT",
          customerDocument:
            payment.customer_document_type && payment.customer_document_number
              ? {
                  type: payment.customer_document_type,
                  number: payment.customer_document_number,
                }
              : undefined,
        });
      } catch (error) {
        console.error("Error closing table in POS:", error);
      }
    }

    return { status: "APPROVED", applied: result.applied };
  }

  if (
    txn.status === "DECLINED" ||
    txn.status === "VOIDED" ||
    txn.status === "ERROR"
  ) {
    // Narrow el string del API externo al literal union aceptado por Prisma.
    const finalStatus: "DECLINED" | "VOIDED" | "ERROR" = txn.status;

    const applied = await db.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({
        where: { id: payment.id },
        select: { status: true },
      });
      if (!fresh || fresh.status !== "PENDING") return false;

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          wompi_transaction_id: txn.id,
          status: finalStatus,
          payment_method_type: txn.payment_method_type,
        },
      });
      return true;
    });

    return { status: finalStatus, applied };
  }

  // Wompi todavía en PENDING u otro estado no final.
  return { status: "PENDING" };
}

function mapWompiStatus(
  wompiStatus: string
): "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" {
  switch (wompiStatus) {
    case "APPROVED":
      return "APPROVED";
    case "DECLINED":
      return "DECLINED";
    case "VOIDED":
      return "VOIDED";
    case "ERROR":
      return "ERROR";
    default:
      return "PENDING";
  }
}

import * as Sentry from "@sentry/nextjs";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} no encontrado`, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class PosError extends AppError {
  constructor(message: string, public posProvider?: string) {
    super(`POS Error: ${message}`, 502, "POS_ERROR");
    this.name = "PosError";
  }
}

export class PaymentError extends AppError {
  constructor(message: string) {
    super(`Payment Error: ${message}`, 502, "PAYMENT_ERROR");
    this.name = "PaymentError";
  }
}

export class PlanLimitError extends AppError {
  constructor(feature: string) {
    super(
      `Tu plan no incluye ${feature}. Actualiza tu suscripcion.`,
      403,
      "PLAN_LIMIT"
    );
    this.name = "PlanLimitError";
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      Sentry.captureException(error);
    }
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  Sentry.captureException(error);
  console.error("Unhandled error:", error);
  return Response.json(
    { error: "Error interno del servidor" },
    { status: 500 }
  );
}

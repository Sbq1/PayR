/**
 * Configuracion del widget de Wompi para el frontend.
 */
export interface WompiWidgetConfig {
  publicKey: string;
  currency: string;
  amountInCents: number;
  reference: string;
  signatureIntegrity: string;
  redirectUrl: string;
  customerEmail?: string;
}

/**
 * Resultado de crear una transaccion.
 */
export interface CreateTransactionResult {
  paymentId: string;
  reference: string;
  amountInCents: number;
  widgetConfig: WompiWidgetConfig;
}

/**
 * Evento de webhook de Wompi.
 */
export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      created_at: string;
      amount_in_cents: number;
      reference: string;
      customer_email: string;
      currency: string;
      payment_method_type: string;
      payment_method: Record<string, unknown>;
      status: string;
      status_message: string | null;
    };
  };
  sent_at: string;
  timestamp: number;
  signature: {
    properties: string[];
    checksum: string;
  };
  environment: string;
}

/**
 * Credenciales Wompi de un restaurante.
 */
export interface WompiCredentials {
  publicKey: string;
  privateKey: string;
  eventsSecret: string;
  integritySecret: string;
}

/**
 * Interfaz que todo adaptador de pagos debe implementar.
 */
export interface IPaymentAdapter {
  /**
   * Prepara una transaccion y retorna la config para el widget.
   */
  createTransaction(params: {
    amountInCents: number;
    reference: string;
    redirectUrl: string;
    customerEmail?: string;
  }): Promise<WompiWidgetConfig>;

  /**
   * Valida la firma HMAC del webhook.
   * Retorna true si la firma es valida.
   */
  verifyWebhookSignature(event: WompiWebhookEvent): boolean;
}

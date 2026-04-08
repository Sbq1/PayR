import { decrypt } from "@/lib/utils/crypto";
import { PaymentError } from "@/lib/utils/errors";
import { DemoPaymentAdapter } from "./demo.adapter";
import { WompiAdapter } from "./wompi.adapter";
import type { IPaymentAdapter } from "./types";

interface RestaurantPaymentConfig {
  posProvider?: string;
  wompiPublicKey: string | null;
  wompiPrivateKey: string | null;
  wompiEventsSecret: string | null;
  wompiIntegritySecret: string | null;
}

/**
 * Factory: retorna el adaptador de pagos correcto.
 * Si el restaurante es demo o no tiene credenciales, usa DemoPaymentAdapter.
 */
export function getPaymentAdapter(
  restaurant: RestaurantPaymentConfig
): IPaymentAdapter {
  // Si tiene credenciales de Wompi, usar Wompi real (incluso en modo demo POS)
  if (
    restaurant.wompiPublicKey &&
    restaurant.wompiPrivateKey &&
    restaurant.wompiEventsSecret &&
    restaurant.wompiIntegritySecret
  ) {
    return new WompiAdapter({
      publicKey: restaurant.wompiPublicKey,
      privateKey: decrypt(restaurant.wompiPrivateKey),
      eventsSecret: decrypt(restaurant.wompiEventsSecret),
      integritySecret: decrypt(restaurant.wompiIntegritySecret),
    });
  }

  // Sin credenciales Wompi: modo demo si POS es demo, error si no
  if (restaurant.posProvider === "demo") {
    return new DemoPaymentAdapter();
  }

  throw new PaymentError(
    "Credenciales de Wompi no configuradas para este restaurante"
  );
}

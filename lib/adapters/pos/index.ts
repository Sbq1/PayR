import { decrypt } from "@/lib/utils/crypto";
import { PosError } from "@/lib/utils/errors";
import { DemoAdapter } from "./demo.adapter";
import { SiigoAdapter } from "./siigo.adapter";
import type { IPosAdapter } from "./types";

interface RestaurantPosConfig {
  posProvider: string;
  siigoUsername: string | null;
  siigoAccessKey: string | null;
}

/**
 * Factory: retorna el adaptador POS correcto segun el proveedor del restaurante.
 * Desencripta las credenciales almacenadas en BD.
 */
export function getPosAdapter(restaurant: RestaurantPosConfig): IPosAdapter {
  switch (restaurant.posProvider) {
    case "demo":
      return new DemoAdapter();

    case "siigo": {
      if (!restaurant.siigoUsername || !restaurant.siigoAccessKey) {
        throw new PosError(
          "Credenciales de Siigo no configuradas para este restaurante",
          "siigo"
        );
      }

      return new SiigoAdapter({
        username: decrypt(restaurant.siigoUsername),
        accessKey: decrypt(restaurant.siigoAccessKey),
      });
    }

    default:
      throw new PosError(
        `Proveedor POS "${restaurant.posProvider}" no soportado`,
        restaurant.posProvider
      );
  }
}

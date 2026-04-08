import { db } from "@/lib/db";
import { AppError } from "@/lib/utils/errors";

/**
 * Verifica que el restaurante existe y pertenece al usuario.
 * Lanza AppError si no existe (404) o no es del usuario (403).
 */
export async function verifyOwnership(restaurantId: string, userId: string) {
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    include: { subscription_plans: true },
  });
  if (!restaurant) {
    throw new AppError("Restaurante no encontrado", 404, "NOT_FOUND");
  }
  if (restaurant.owner_id !== userId) {
    throw new AppError("No autorizado", 403, "FORBIDDEN");
  }
  return restaurant;
}

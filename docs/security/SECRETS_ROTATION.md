# Secrets Rotation Policy — PayR

Procedimientos operativos para rotar cada secret. Este documento es la referencia autoritativa: si un procedimiento cambia, actualizar acá primero.

## Resumen por secret

| Secret | Scope | Frecuencia | Impacto usuarios | Downtime requerido |
|---|---|---|---|---|
| `ENCRYPTION_KEY` | App-global (cifra creds en DB) | Cada 6 meses | Ninguno (transparente) | ~5 min (deploy dual-key) |
| `AUTH_SECRET` | App-global (firma JWT sesión) | Cada 3 meses | Invalida todas las sesiones | 0 (usuarios re-loguean) |
| DB password | Supabase | Cada 3 meses o post-incidente | Ninguno | ~1 min (reconnect) |
| `SENTRY_AUTH_TOKEN` | CI | Cada 6 meses | Ninguno | 0 |
| Wompi keys (merchant) | Por restaurante | Cuando el cliente las rote | Depende | Re-config del cliente |
| Siigo access keys (merchant) | Por restaurante | Cuando el cliente las rote | Depende | Re-config del cliente |

---

## 1. `ENCRYPTION_KEY` (AES-256 para credenciales de merchants)

**Qué protege**: `restaurants.siigo_username`, `restaurants.siigo_access_key`, `restaurants.wompi_private_key`, `restaurants.wompi_events_secret`, `restaurants.wompi_integrity_secret`.

**Frecuencia**: cada 6 meses, o inmediato si hay sospecha de compromiso del env.

### Procedimiento (zero-downtime, dual-key rotation)

1. **Generar nueva key**:
   ```bash
   openssl rand -hex 32
   ```

2. **Re-encrypt offline** (script `scripts/rotate-encryption-key.ts` existente):
   - Leer cada row de `restaurants` con secrets.
   - Decrypt con `ENCRYPTION_KEY_OLD`.
   - Encrypt con `ENCRYPTION_KEY_NEW`.
   - Update en una TX por row.
   - Verificar conteo de filas procesadas vs `SELECT COUNT(*) FROM restaurants WHERE siigo_access_key IS NOT NULL`.

3. **Swap env vars en Vercel**:
   - `ENCRYPTION_KEY` ← nueva key.
   - Redeploy.

4. **Verificación post-deploy**:
   - Login en un restaurante de test, verificar que decrypt funciona (endpoint `/api/restaurant/[id]` devuelve `hasSiigoCredentials: true`).
   - Ejecutar un pago sandbox end-to-end.

5. **Retirar la key vieja** del vault después de 24h sin incidentes.

**Importante**: el script ya existe en `scripts/rotate-encryption-key.ts`. Leer antes de ejecutar.

---

## 2. `AUTH_SECRET` (firma JWT de sesión)

**Qué protege**: cookies de sesión (cualquier JWT emitido por `lib/auth.ts`).

**Frecuencia**: cada 3 meses. Inmediato si se sospecha leak.

### Procedimiento

1. **Generar**:
   ```bash
   openssl rand -base64 48
   ```

2. **Swap en Vercel** y redeploy.

3. **Impacto**: **todas las sesiones activas se invalidan**. Los usuarios verán pantalla de login en su próxima request autenticada. No hay downtime de servicio, solo un "re-login" masivo.

4. **Plan comunicación** (opcional): avisar a clientes grandes con 24h de antelación si es una rotación programada.

---

## 3. Database password (Supabase)

**Frecuencia**: cada 3 meses, o inmediato post-incidente.

### Procedimiento

1. En Supabase dashboard → Settings → Database → Reset password.
2. Actualizar `DATABASE_URL` en Vercel (all environments).
3. Redeploy.
4. Verificar `/api/health` devuelve `{ status: "ok", db: "connected" }`.

---

## 4. `SENTRY_AUTH_TOKEN`

**Frecuencia**: cada 6 meses.

### Procedimiento

1. Revocar token en Sentry → Settings → Auth Tokens.
2. Generar nuevo token con scope `project:releases`.
3. Actualizar `SENTRY_AUTH_TOKEN` en Vercel (build env).
4. Trigger redeploy para validar.

---

## 5. Wompi keys del merchant

**Responsabilidad**: del dueño del restaurante.

### Procedimiento

1. El cliente regenera keys en el dashboard de Wompi.
2. Entra a PayR → Configuración → Wompi.
3. Pega las 4 keys nuevas (`pub_`, `prv_`, `events_secret`, `integrity_secret`).
4. PayR las cifra con `ENCRYPTION_KEY` antes de persistir (validado en `app/api/restaurant/[id]/route.ts` PUT).
5. Verificar con `/api/restaurant/[id]/test-payment` (live check contra Wompi).

**Downtime**: mientras se actualizan, los pagos pueden fallar con HMAC inválido. Recomendar al cliente hacerlo fuera de horario pico.

---

## 6. Siigo access keys del merchant

**Responsabilidad**: del dueño del restaurante.

### Procedimiento

1. Regenerar access key en Siigo.
2. PayR → Configuración → POS Siigo.
3. Verificar con `/api/restaurant/[id]/test-pos`.
4. Se cifra con `ENCRYPTION_KEY` al persistir.

---

## Post-incidente

Si sospechamos compromiso de **cualquier** secret, la prioridad es:

1. **Inmediato**: rotar el secret comprometido.
2. **Dentro de 24h**: rotar todos los secrets relacionados del mismo "blast radius" (ej: si se filtra `ENCRYPTION_KEY`, también rotar `AUTH_SECRET` por si acaso).
3. **Dentro de 72h**: forzar logout global (rotar `AUTH_SECRET`).
4. **Auditoría**: revisar logs de Sentry + Supabase de los últimos 30 días buscando acceso anómalo.
5. **Post-mortem** escrito, archivado en `docs/security/incidents/YYYY-MM-DD-<slug>.md`.

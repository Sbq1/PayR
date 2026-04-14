# Terminal B — Auth & Sessions Hardening

## Misión

Hardening del sistema de autenticación y sesiones de PayR para nivel producción confiable B2B financiero.

## Working directory

`/Users/samuelbastidas/Documents/PayR-sec-auth` (worktree, branch `sec/auth-hardening`)

## Stack relevante (NO modificar fundamentals)

- Auth custom: `jose` (JWT) + `bcryptjs` (hashing)
- Session: cookie httpOnly, signed JWT
- Session helper: `lib/auth.ts`
- Login/register endpoints: `app/api/auth/login`, `app/api/auth/register`
- Login UI: `app/(auth)/login/page.tsx`, register: `app/(auth)/register/page.tsx`
- Layout auth: `app/(auth)/layout.tsx`
- Middleware: `proxy.ts` (root level) — verifica JWT signature

## Tareas

### 1. Brute force protection en login (CRÍTICO)

**Problema actual**: el endpoint `/api/auth/login` no tiene rate limit ni lockout. Atacante puede probar miles de passwords sin friction.

**Implementar**:
- Rate limit en `/api/auth/login` por **email** (no solo IP — IPs cambian, emails no): 5 intentos / 10 min
- Si supera el límite → lockout temporal de 15 min
- Mensaje genérico de error siempre: "Credenciales inválidas" (NO revelar si el email existe)
- Loggear intentos fallidos en tabla `auth_events` (ver tarea 4)

**Archivos**:
- `app/api/auth/login/route.ts`
- Posiblemente helper en `lib/utils/rate-limit.ts` (ya existe Upstash, reusar pattern)

### 2. Password reset flow completo (HIGH)

**Problema actual**: el botón "¿Olvidaste tu clave?" en `/login` está deshabilitado con tooltip "Próximamente".

**Implementar**:
- Schema nuevo en `prisma/schema.prisma`:
  ```prisma
  model PasswordResetToken {
    token       String   @id
    user_id     String
    expires_at  DateTime @db.Timestamptz(6)
    used_at     DateTime? @db.Timestamptz(6)
    created_at  DateTime @default(now()) @db.Timestamptz(6)
    user        User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

    @@index([user_id])
    @@map("password_reset_tokens")
  }
  ```
  - Migration via Supabase MCP (`mcp__claude_ai_Supabase__apply_migration`)
- Endpoint `POST /api/auth/forgot-password`:
  - Body: `{ email }`
  - Si user existe → genera token (32 bytes hex), guarda en DB con expires_at = now + 1h
  - **Siempre retorna 200 genérico**: "Si el email existe, recibirás un link" (no leak)
  - Por ahora: console.log el link para testing (Resend/SendGrid integration = TODO documentado)
  - Rate limit: 3 requests / hora por email
- Endpoint `POST /api/auth/reset-password`:
  - Body: `{ token, newPassword }`
  - Valida token: existe, no expirado, no usado
  - Hash nuevo password (bcrypt 12 rounds)
  - Actualiza `users.password_hash`
  - Marca token como `used_at = now()`
  - Invalida sesiones existentes del user (opcional pero recomendado)
- UI:
  - `app/(auth)/forgot-password/page.tsx` — form con email input
  - `app/(auth)/reset-password/[token]/page.tsx` — form con new password + confirmation
  - Linkear desde `/login` (quitar el "Próximamente" del actual)

### 3. Session expiration policy (MEDIUM)

**Problema actual**: el JWT no tiene política clara de expiración + refresh. Probablemente usa exp default.

**Implementar**:
- Verificar TTL actual en `lib/auth.ts` (donde se firma el JWT)
- Decidir política: **30 días** con refresh silencioso al hit (recomendado para B2B)
- Implementar refresh:
  - Endpoint `POST /api/auth/refresh` que toma cookie actual y emite uno nuevo
  - Llamado automático antes de expirar (middleware o hook client)
- Logout endpoint: invalidar (estrategia más simple: borrar cookie + session_version field en User; al firmar JWT, incluir version, al verificar comparar)

### 4. Audit log de eventos auth (MEDIUM)

**Implementar**:
- Schema nuevo:
  ```prisma
  model AuthEvent {
    id          String   @id @default(dbgenerated("(gen_random_uuid())::text"))
    user_id     String?  // null si event_type es failed_login con email no existente
    email       String?  // útil para tracking failed attempts
    event_type  AuthEventType
    ip          String?
    user_agent  String?
    metadata    Json?    // detalles extra contextuales
    created_at  DateTime @default(now()) @db.Timestamptz(6)
    user        User?    @relation(fields: [user_id], references: [id], onDelete: SetNull)

    @@index([user_id, created_at])
    @@index([email, created_at])
    @@index([event_type, created_at])
    @@map("auth_events")
  }

  enum AuthEventType {
    LOGIN_SUCCESS
    LOGIN_FAILED
    LOGOUT
    PASSWORD_CHANGED
    PASSWORD_RESET_REQUESTED
    PASSWORD_RESET_COMPLETED
    SESSION_REFRESHED
  }
  ```
- Helper `lib/utils/auth-events.ts`:
  ```ts
  export async function logAuthEvent(params: { userId?, email?, eventType, ip, userAgent, metadata? }) { ... }
  ```
- Llamar desde:
  - login success/fail
  - logout
  - password change
  - password reset (request + complete)
  - session refresh
- Endpoint `GET /api/auth/audit` (solo el usuario ve los suyos): paginated, filterable por event_type
- UI opcional: página `/settings/security` mostrando últimos 10 eventos

### 5. Cookie security audit (LOW)

**Verificar y aplicar**:
- Cookie de sesión: `httpOnly`, `secure` (en prod), `sameSite=lax`, `path=/`
- Cookie de refresh (si se implementa): mismas flags + `expires` correcto
- Verificar que `proxy.ts` rechaza requests sin cookie válida en rutas protegidas

## Constraints — NO TOCAR

- `/app/(customer)/` — checkout customer (Terminal C territory)
- `/app/api/restaurant/` — endpoints restaurant (Terminal C)
- `/app/api/payment/` — webhook Wompi (Terminal C)
- `/lib/adapters/` — Wompi/Siigo
- Wompi/Siigo encryption (Terminal C audit)
- next.config.ts headers (Terminal C lo refina)

## Sí tocar (tu scope)

- `app/(auth)/**`
- `app/api/auth/**`
- `lib/auth.ts`
- `lib/utils/rate-limit.ts` (solo agregar limiters nuevos, no romper existentes)
- `proxy.ts` (si necesitás invalidación de sesión)
- `prisma/schema.prisma` (solo tablas auth: PasswordResetToken, AuthEvent, AuthEventType)
- `lib/utils/auth-events.ts` (nuevo)

## Migrations

Usar Supabase MCP:
```
mcp__claude_ai_Supabase__apply_migration
project_id: lqzavblwjfonjhkieckb
name: auth_hardening_<feature>
query: <SQL DDL>
```

## Verificación antes de entregar

Checklist obligatorio:
- [ ] `npx tsc --noEmit` limpio (sin errores nuevos)
- [ ] `npm run lint` limpio (solo warning preexistente de `register/route.ts:65`)
- [ ] Manual: 5 logins fallidos → bloqueo + mensaje genérico
- [ ] Manual: forgot password flow end-to-end (token genera, link funciona, password cambia)
- [ ] Manual: reset password con token expirado → rechaza
- [ ] Manual: reset password con token usado → rechaza
- [ ] Migrations aplicadas en Supabase (verificar con `mcp__claude_ai_Supabase__list_migrations`)
- [ ] Audit log captura eventos (probar uno y query la tabla)

## PR final

Cuando termines:
1. `git add -u && git commit -m "feat(auth): hardening - brute force + password reset + audit log"`
2. `git push origin sec/auth-hardening`
3. **NO hacer merge a main** — el orquestador (Terminal A) review + merge
4. Avisarle al orquestador: "Terminal B terminó, branch sec/auth-hardening ready for review"

## Skills relevantes (cargar via Skill tool si no están)

- `senior-engineer` (workflow plan→OK→implement)
- `post-edit-verify` (verificación mecánica)
- `code-review` (auto-review antes de PR)
- `edge-cases`
- `change-minimal`

## Outputs esperados

1. Código funcional para los 4 features (brute force, password reset, sessions, audit log)
2. Migrations aplicadas
3. Branch `sec/auth-hardening` con commits ordenados
4. Manual testing pasado
5. Reporte al orquestador con summary de cambios

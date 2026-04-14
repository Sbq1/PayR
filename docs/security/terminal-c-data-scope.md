# Terminal C — Data, Endpoints, Webhook & Compliance Hardening

## Misión

Hardening de endpoints (rate limit + validation + ownership), seguridad de webhooks Wompi, encryption audit, headers y compliance Colombia.

## Working directory

`/Users/samuelbastidas/Documents/PayR-sec-data` (worktree, branch `sec/data-hardening`)

## Stack relevante (NO modificar fundamentals)

- Endpoints: `app/api/restaurant/**`, `app/api/payment/**`
- Wompi adapter: `lib/adapters/payment/wompi.adapter.ts`
- Siigo adapter: `lib/adapters/pos/siigo.adapter.ts`
- Encryption: `lib/utils/crypto.ts` (AES-256)
- Rate limit: `lib/utils/rate-limit.ts` (Upstash Redis)
- Errors: `lib/utils/errors.ts`
- Webhook handler: `app/api/payment/webhook/route.ts`
- HMAC verification: `lib/utils/hmac.ts`
- Headers: `next.config.ts` (CSP, X-Frame-Options, etc)

## Tareas

### 1. Auditoría endpoint-por-endpoint (CRÍTICO PRIMERO)

**Crear**: `docs/security/ENDPOINT_AUDIT.md`

Tabla con TODOS los endpoints en `app/api/`:

| Endpoint | Method | Auth check | Ownership | Rate limit | Validation (Zod) | Encrypted creds | Status |
|---|---|---|---|---|---|---|---|
| `/api/restaurant/[id]` | PUT | ✅ | ✅ | ✅ 10/h | ✅ | ✅ | OK |
| `/api/restaurant/[id]/orders` | GET | ? | ? | ? | ? | N/A | TODO |

Para CADA endpoint marcar gaps con prioridad (🔴 crítico / 🟡 alto / 🟢 medio). 

**Comando para listar todos**:
```bash
find app/api -name "route.ts" | sort
```

Luego completar la tabla manualmente leyendo cada archivo.

### 2. Rate limit completion (HIGH)

Cualquier endpoint que muta datos, llama APIs externas, o consume compute pesado **debe tener rate limit**. Patrón:
```ts
import { rateLimit, rateLimitResponse } from "@/lib/utils/rate-limit";

const limiter = rateLimit("nombre-unique", { interval: 60_000, limit: 30 });

// en handler:
const rl = await limiter.check(`user:${session.user.id}`);
if (!rl.success) return rateLimitResponse(rl.resetAt);
```

Para cada endpoint en el AUDIT que tenga gap de rate limit, implementar.

### 3. Webhook idempotency + replay protection (HIGH)

**Problema actual**: `/api/payment/webhook` verifica HMAC pero no idempotency. Si Wompi reenvía un evento (network retry), se procesa dos veces (duplicate Payment row, double transition de estado).

**Implementar**:
- Schema nuevo:
  ```prisma
  model ProcessedWebhook {
    event_id     String   @id  // event.id de Wompi
    event_type   String
    received_at  DateTime @default(now()) @db.Timestamptz(6)
    processed_at DateTime?
    metadata     Json?

    @@index([received_at])
    @@map("processed_webhooks")
  }
  ```
- En el webhook handler:
  1. Verificar HMAC (ya implementado)
  2. **Verificar timestamp del evento**: si > 5 min antiguo → reject 400 (replay attack)
  3. **Buscar event_id en `processed_webhooks`**:
     - Si existe → return 200 sin re-procesar (idempotency)
     - Si no → INSERT row con received_at, procesar, UPDATE processed_at al terminar
- Cleanup: cron / scheduled function que borra events > 30 días (opcional, doc TODO)

### 4. Encryption audit (MEDIUM)

**Verificar** en `prisma/schema.prisma` qué campos son secrets y CONFIRMAR que se encriptan ANTES de guardar (no plain text):

| Campo | Cifrado actualmente? | Cifrado debería? |
|---|---|---|
| `siigo_username` | ✅ (encrypt) | ✅ |
| `siigo_access_key` | ✅ | ✅ |
| `wompi_public_key` | ❌ (es público) | ❌ OK |
| `wompi_private_key` | ✅ | ✅ |
| `wompi_events_secret` | ✅ | ✅ |
| `wompi_integrity_secret` | ✅ | ✅ |
| `password_hash` | ✅ (bcrypt, no AES) | ✅ |

Verificar grep de `encrypt(` en endpoints PUT que tocan estos campos. Si alguno NO usa encrypt → fix.

**Documentar** rotation policy:
- Crear `docs/security/SECRETS_ROTATION.md`:
  - ENCRYPTION_KEY: rotación cada 6 meses (procedure: re-encrypt all DB rows con nueva key, deploy, swap env)
  - DB password: cada 3 meses (lección de incidente reciente)
  - AUTH_SECRET: cada 3 meses (invalida todas las sesiones, plan downtime)
  - Wompi/Siigo keys del cliente: rotation manual del cliente

### 5. Headers + cookies security (MEDIUM)

**Verificar y refinar `next.config.ts`**:
- CSP actual:
  ```
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.wompi.co https://checkout.wompi.co
  ```
  - **Reto**: eliminar `'unsafe-inline'` y `'unsafe-eval'` si es posible (Next.js requiere `unsafe-eval` en dev, pero NO en prod)
  - Implementar nonce-based CSP para scripts inline si los hay
- Agregar:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`
- Verificar cookies de auth (Terminal B las gestiona, vos solo verificás flags):
  - `httpOnly` ✅
  - `secure` ✅ en prod
  - `sameSite=lax`

### 6. Compliance Colombia (HIGH)

**Crear páginas legales**:

#### `app/(legal)/privacy/page.tsx`
Cubre Habeas Data (Ley 1581 de 2012, Decreto 1377 de 2013):
- Quién es el responsable del tratamiento (PayR / Smart Checkout)
- Qué datos colectamos (email, password hash, datos del restaurant, datos de transacciones)
- Para qué los usamos (procesar pagos, enviar facturas, soporte)
- Con quién compartimos (Wompi, Siigo, hosting Vercel/Supabase)
- Cuánto los retenemos
- Derechos del titular (conocer, actualizar, rectificar, suprimir)
- Cómo ejercer derechos: hola@smartcheckout.co
- Política de cookies

Template inicial: usar [Termly.io](https://termly.io) o GetTerms.io para generar. Ajustar a Colombia. Markdown render.

#### `app/(legal)/terms/page.tsx`
Términos de servicio (Estatuto del Consumidor, Ley 1480 de 2011):
- Aceptación de términos
- Descripción del servicio
- Cuenta y responsabilidades del usuario
- Pricing y facturación
- Limitación de responsabilidad
- Terminación de cuenta
- Cambios a los términos
- Ley aplicable (Colombia)
- Resolución de conflictos

#### `app/(legal)/cookies/page.tsx`
Política de cookies — qué cookies usamos, por qué, cómo deshabilitarlas.

#### Cookie consent banner
- Componente `app/_components/CookieConsent.tsx` (client component)
- Persiste en localStorage
- Solo mostrar primera visita
- Link a `/cookies`

#### Update footer links
- `app/components/landing/Footer.tsx` y `app/(dashboard)/.../Footer.tsx` (si existe)
- Reemplazar `href="#"` por `/privacy`, `/terms`, `/cookies`

## Constraints — NO TOCAR

- `/app/(auth)/` — login/register/layout (Terminal B)
- `/app/api/auth/` — endpoints auth (Terminal B)
- `/lib/auth.ts` (Terminal B)
- `proxy.ts` (Terminal B)
- Nuevas tablas auth en schema (PasswordResetToken, AuthEvent) — Terminal B
- NO romper el flow de pago Wompi/Siigo existente

## Sí tocar

- `app/api/restaurant/**`
- `app/api/payment/**`
- `app/(legal)/**` (NEW)
- `app/(customer)/**` (revisar pero no rediseñar)
- `lib/adapters/**` (solo auditing, no rediseño)
- `lib/utils/crypto.ts`, `lib/utils/rate-limit.ts`, `lib/utils/hmac.ts`
- `next.config.ts` (headers)
- `prisma/schema.prisma` (solo: ProcessedWebhook)
- `docs/security/**`

## Migrations

Usar Supabase MCP:
```
mcp__claude_ai_Supabase__apply_migration
project_id: lqzavblwjfonjhkieckb
name: data_hardening_<feature>
query: <SQL DDL>
```

## Verificación antes de entregar

Checklist:
- [ ] `npx tsc --noEmit` limpio
- [ ] `npm run lint` limpio (solo warning preexistente)
- [ ] `docs/security/ENDPOINT_AUDIT.md` completo (todos los endpoints)
- [ ] Manual: webhook duplicado Wompi → segundo retorna 200 sin reprocesar
- [ ] Manual: webhook con timestamp > 5min antiguo → 400
- [ ] Manual: visitar `/privacy` y `/terms` cargan correctamente
- [ ] Manual: cookie consent aparece en primera visita, no después
- [ ] Headers verify: `curl -I https://smart-checkout-omega.vercel.app | grep -i security`
- [ ] Encryption audit: cero secrets sin cifrar en DB query exploratoria

## PR final

Cuando termines:
1. `git add -u && git commit -m "feat(security): endpoint audit + webhook idempotency + compliance Colombia"`
2. `git push origin sec/data-hardening`
3. **NO mergear a main** — orquestador (Terminal A) review + merge
4. Avisar: "Terminal C terminó, branch sec/data-hardening ready for review"

## Skills relevantes

- `senior-engineer` (plan→OK→implement)
- `security-audit` (auditing sistemático)
- `webhook-security` (HMAC + idempotency + replay)
- `change-minimal`
- `post-edit-verify`

## Outputs esperados

1. ENDPOINT_AUDIT.md completo
2. Rate limit completo en endpoints sensibles
3. Webhook idempotency + replay protection en `/api/payment/webhook`
4. Encryption audit doc
5. SECRETS_ROTATION.md
6. Páginas legales (privacy, terms, cookies) + cookie consent
7. Headers refinados en next.config.ts
8. Branch `sec/data-hardening` con commits ordenados
9. Reporte al orquestador

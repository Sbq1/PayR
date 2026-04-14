# Endpoint Audit — Terminal C

Snapshot: `sec/data-hardening` @ discovery (pre-fixes).

Scope: todos los `route.ts` bajo `app/api/` **excepto** `/api/auth/**` (Terminal B).

Leyenda:
- ✅ presente / correcto
- ❌ ausente
- N/A no aplica
- 🔴 crítico / 🟡 alto / 🟢 medio / 🔵 info

Ownership: ✅ si el handler llama `verifyOwnership(restaurantId, session.user.id)` **o** equivalente (`session.user.restaurantId === restaurantId`).

---

## 1. Tabla resumen

| # | Endpoint | Method | Auth | Ownership | Rate limit | Zod | Encrypted creds | Gaps |
|---|---|---|---|---|---|---|---|---|
| 1 | `/api/health` | GET | N/A | N/A | ❌ | N/A | N/A | 🟢 público, sin limit (SSRF amplification si hace DB query) |
| 2 | `/api/bill` | GET | N/A (público) | N/A | ✅ 30/min IP | ✅ | N/A | — (público por diseño del QR) |
| 3 | `/api/payment/create` | POST | N/A (público) | lógico vía slug+tableId | ✅ 10/min IP | ✅ | N/A | — |
| 4 | `/api/payment/verify` | POST | N/A (público) | por reference | ❌ | ✅ | N/A | 🔴 sin rate limit + llamada a Wompi API por request |
| 5 | `/api/payment/demo-complete` | POST | N/A (público) | gate: restaurante sin creds Wompi | ❌ | ✅ | N/A | 🟡 sin rate limit (mutación de estado) |
| 6 | `/api/payment/webhook` | POST | HMAC | N/A | ❌ | ✅ (JSON.parse) | N/A | 🔴 falta idempotency (event replay → doble-procesado) + falta validación de timestamp (replay attack >5min) |
| 7 | `/api/restaurant/[id]` | GET | ✅ | ❌ (solo findUnique, no compara owner_id) | ❌ | N/A | N/A | 🔴 **IDOR**: cualquier user autenticado puede leer cualquier restaurante |
| 8 | `/api/restaurant/[id]` | PUT | ✅ | ✅ (vía session.user.restaurantId) | ✅ 10/h user | ✅ | ✅ encrypt() en siigo + wompi_private/events/integrity | — |
| 9 | `/api/restaurant/[id]/kpi` | GET | ✅ | ✅ (verifyOwnership) | ❌ | N/A | N/A | 🟡 queries pesadas sin limit |
| 10 | `/api/restaurant/[id]/orders` | GET | ✅ | ✅ | ✅ 60/min IP | ✅ | N/A | 🔵 rate limit por IP, mejor por user |
| 11 | `/api/restaurant/[id]/orders` | PATCH | ✅ | ✅ | ✅ 30/min IP | ✅ | N/A | 🔵 mismo |
| 12 | `/api/restaurant/[id]/orders/export` | GET | ✅ | ✅ | ✅ 5/min IP | ✅ | N/A | — |
| 13 | `/api/restaurant/[id]/qr` | GET | ✅ | ✅ | ❌ | N/A | N/A | 🟡 genera imágenes (compute-pesado) sin limit |
| 14 | `/api/restaurant/[id]/qr` | POST | ✅ | ✅ | ✅ 20/min IP | ✅ | N/A | — |
| 15 | `/api/restaurant/[id]/qr/config` | GET | ✅ | ✅ | ✅ 60/min IP | N/A | N/A | — |
| 16 | `/api/restaurant/[id]/qr/config` | PATCH | ✅ | ✅ | ✅ 10/min IP | ✅ | N/A | — |
| 17 | `/api/restaurant/[id]/qr/logo` | POST | ✅ | ✅ | ✅ 5/min user | ✅ (image-validate) | N/A | — |
| 18 | `/api/restaurant/[id]/qr/logo` | GET | ✅ | ✅ | ✅ 30/min IP | N/A | N/A | — |
| 19 | `/api/restaurant/[id]/qr/logo` | DELETE | ✅ | ✅ | ✅ 10/min IP | N/A | N/A | — |
| 20 | `/api/restaurant/[id]/qr/preview` | POST | ✅ | ✅ | ✅ 30/min IP | ✅ | N/A | — |
| 21 | `/api/restaurant/[id]/qr/table/[tableId]/printable` | GET | ✅ | ✅ | ✅ 20/min IP | N/A | N/A | — |
| 22 | `/api/restaurant/[id]/tables` | GET | ✅ | ✅ | ❌ | N/A | N/A | 🟢 cheap query, low-risk |
| 23 | `/api/restaurant/[id]/tables` | POST | ✅ | ✅ | ✅ 30/min IP | ✅ | N/A | — |
| 24 | `/api/restaurant/[id]/tables` | PUT | ✅ | ✅ | ✅ 30/min IP | ✅ | N/A | — |
| 25 | `/api/restaurant/[id]/tables` | DELETE | ✅ | ✅ | ✅ 30/min IP | ❌ (solo query param) | N/A | 🔵 validar `tableId` con zod |
| 26 | `/api/restaurant/[id]/test-payment` | POST | ✅ | ✅ (session.user.restaurantId) | ✅ 10/h user | ✅ | N/A (no persist) | — |
| 27 | `/api/restaurant/[id]/test-pos` | POST | ✅ | ✅ (session.user.restaurantId) | ❌ | ❌ (sin zod) | N/A (no persist) | 🔴 sin rate limit + sin zod → llama Siigo API sin protección (abuse) |
| 28 | `/api/restaurant/[id]/upsells` | GET | ✅ | ✅ | ❌ | N/A | N/A | 🟢 cheap |
| 29 | `/api/restaurant/[id]/upsells` | POST | ✅ | ✅ | ❌ | ✅ | N/A | 🟡 mutación sin limit |

---

## 2. Hallazgos priorizados

### 🔴 Crítico

**C-1. IDOR en `GET /api/restaurant/[id]`** (endpoint #7)
El handler hace `db.restaurant.findUnique({ where: { id } })` sin validar `owner_id === session.user.id`. Un usuario autenticado puede leer restaurantes ajenos: nombre, slug, plan, flags `hasSiigoCredentials`/`hasWompiCredentials`, color palette. No expone las credenciales, pero sí metadata sensible de la competencia.
**Fix**: usar `verifyOwnership(restaurantId, session.user.id)` antes de `findUnique`.

**C-2. Webhook sin idempotency** (endpoint #6)
`/api/payment/webhook` verifica HMAC pero si Wompi reenvía el mismo evento (retry por timeout/network), el handler lo reprocesa. Actualmente el `handlePaymentWebhook` tiene un guard suave (`if status is final → return`) pero:
- No previene double-processing si llegan en paralelo antes del primer UPDATE
- No hay registro persistente del `event_id` procesado
- No invalida replay attacks con timestamps antiguos
**Fix**: tabla `ProcessedWebhook(event_id PK)` + check de timestamp ±5min.

**C-3. `POST /api/payment/verify` sin rate limit** (endpoint #4)
Hace `fetch` a Wompi API por cada request. Un atacante puede:
- Amplificar hacia Wompi (generar 1000s de requests a su infra)
- Gastar cuota/rate limits de Wompi por restaurante
- Sondear existencia de `reference` (404 vs otras respuestas)
**Fix**: rate limit por IP, ej. 20/min.

**C-4. `POST /api/restaurant/[id]/test-pos` sin rate limit ni zod** (endpoint #27)
Llama `SiigoAdapter.authenticate()` (network externa) con body sin validación. Un user autenticado puede spam-atacar Siigo disfrazado como PayR.
**Fix**: rate limit user 10/h (mismo patrón que test-payment) + zod schema para body.

### 🟡 Alto

**A-1. Rate limit faltante en endpoints de mutación** (#5, #9, #13, #29)
- `/api/payment/demo-complete` POST (mutación de Payment)
- `/api/restaurant/[id]/kpi` GET (query pesado)
- `/api/restaurant/[id]/qr` GET (genera imágenes)
- `/api/restaurant/[id]/upsells` POST (insert sin limit)

**A-2. Compliance Colombia ausente**
- No hay `/privacy`, `/terms`, `/cookies`
- Footer links apuntan a `#` (Footer.tsx:95-97)
- No hay cookie consent banner

**A-3. Headers de seguridad incompletos** (`next.config.ts`)
Faltan:
- `Strict-Transport-Security` (HSTS)
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-origin`
CSP tiene `'unsafe-inline'` y `'unsafe-eval'` — bajar a nonce si es viable (ver §5 del plan).

### 🟢 Medio

**M-1. Rate limit por IP vs por user**
Endpoints de usuario autenticado (orders GET/PATCH, qr-logo GET, tables POST/PUT/DELETE, qr-preview, qr-config, etc.) usan `getClientIp` como key. NAT/corporate proxies hacen key collision. **Mejor**: `user:${session.user.id}` cuando ya hay sesión.

**M-2. `DELETE /tables` sin zod**
Sólo valida existencia del param. Bajo riesgo pero inconsistente con el resto.

**M-3. `/api/health` sin rate limit**
Cada request hace `SELECT 1` en DB. Amplificación trivial, low severity.

### 🔵 Info

- `generateWompiChecksum` usa comparación de strings JS (`===`) — no es constant-time. En el contexto de SHA256 no es prácticamente explotable (timing sidechannel sobre hash comparison en TLS es muy ruidoso) pero conviene `timingSafeEqual` para defensa en profundidad.

---

## 3. Encryption audit

| Campo | Plain/Hashed/AES | Esperado | Estado |
|---|---|---|---|
| `users.password_hash` | bcryptjs | bcrypt | ✅ |
| `restaurants.siigo_username` | AES-256-GCM | AES | ✅ (encrypt() en PUT) |
| `restaurants.siigo_access_key` | AES-256-GCM | AES | ✅ |
| `restaurants.wompi_public_key` | plain | plain (es público) | ✅ |
| `restaurants.wompi_private_key` | AES-256-GCM | AES | ✅ |
| `restaurants.wompi_events_secret` | AES-256-GCM | AES | ✅ |
| `restaurants.wompi_integrity_secret` | AES-256-GCM | AES | ✅ |

**Grep verificación**: `encrypt(` aparece en `app/api/restaurant/[id]/route.ts:141-148` para los 5 campos sensibles. `test-pos` y `test-payment` **no persisten** credenciales, solo validan → no requieren encrypt.

**Cero secrets sin cifrar en DB.** ✅

---

## 4. Hallazgos secundarios (nota, no implementar ahora)

- `Payment.wompi_response: Json?` puede contener `customer_email` y `payment_method` del usuario. No está cifrado — aceptable porque no es un "secret" del merchant sino PII del comprador. Revisar política de retención (GDPR-like) a futuro.
- `checkWompiTransactionStatus` en `payment.service.ts:303` y `/api/payment/verify` usan `WOMPI_ENVIRONMENT` global en lugar del entorno implícito en la key del restaurante (pub_test_/pub_prod_). Ya existe el helper correcto en `test-payment/route.ts` (`getWompiBaseUrl`). Pequeño inconsistency, no es hardening crítico de este scope.

---

## 5. Headers actuales vs target

**next.config.ts actual**:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
CSP: (con unsafe-inline + unsafe-eval)
```

**Target post-hardening**:
- HSTS `max-age=63072000; includeSubDomains; preload`
- COOP `same-origin`
- CORP `same-origin`
- CSP: mantener unsafe-inline solo en `style-src` (Tailwind runtime + Next.js styles injection). Remover `unsafe-eval` del script-src en prod (no es necesario para la app, solo dev). Intentar migración a nonce-based para scripts inline → si rompe, quedarse con `unsafe-inline` documentado.


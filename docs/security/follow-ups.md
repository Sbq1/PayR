# Follow-ups — Terminal C

Acciones manuales que quedan pendientes tras el hardening, para ejecutar antes de lanzar a producción comercial.

## Placeholders legales pendientes

Las páginas `/privacy`, `/terms` y `/cookies` existen y son legibles, pero contienen los siguientes placeholders literales que el equipo **debe reemplazar antes de vender**:

- `[NOMBRE LEGAL DE LA EMPRESA]` — ej. "Smart Checkout S.A.S."
- `[NIT]` — ej. "901.234.567-8"
- `[DIRECCIÓN FÍSICA]` — dirección legal en Colombia
- `[NOMBRE DEL REPRESENTANTE LEGAL]`

Email de contacto ya confirmado: `hola@smartcheckout.co`.
Jurisdicción default: Bogotá D.C., Colombia.

**Archivos a editar** (grep `NOMBRE LEGAL DE LA EMPRESA`):

- `app/(legal)/privacy/page.tsx`
- `app/(legal)/terms/page.tsx`
- `app/(legal)/cookies/page.tsx`

## CSP — migración a nonce-based

`script-src` mantiene `'unsafe-inline'` porque Next.js App Router inyecta scripts inline para hydration. La migración a nonce-based requiere:

1. Emitir nonce por request en un `Middleware` (o `proxy.ts`) con `crypto.randomUUID()`.
2. Propagar el nonce al header CSP y a los `<script>` inyectados por Next.
3. Next 15+ soporta esto nativamente vía `headers()` API — verificar compat con Next 16.2.

Mientras tanto, `'unsafe-eval'` ya fue removido en prod (solo en dev para HMR).

## Cleanup de `processed_webhooks`

La tabla crece monótonamente. Opciones:

- Cron semanal que borre rows con `received_at < NOW() - INTERVAL '30 days'`.
- Vercel Cron Job o Supabase scheduled function.

SQL:
```sql
DELETE FROM processed_webhooks WHERE received_at < NOW() - INTERVAL '30 days';
```

Como punto de referencia, a 1000 eventos/día son ~30k filas/mes — no urgente pero conveniente.

## Consentimiento de cookies — GTM/Analytics

Actualmente el banner solo marca "aceptado" y no hay scripts condicionados. Si en el futuro se agregan Google Analytics, Meta Pixel, Hotjar, etc., se debe:

1. Cambiar el banner a 2-opción (aceptar / rechazar).
2. Guardar categoría en `localStorage` (`necessary-only` / `all`).
3. Cargar scripts de analítica condicionalmente.
4. Actualizar `/cookies` para listar las nuevas cookies.

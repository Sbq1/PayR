# Smart Checkout (PayR)

POS-integrated QR payment system for restaurants. MVP deployed and working.

## Stack

- Next.js 16.2.2 + TypeScript + Tailwind v4 + framer-motion
- shadcn/ui + Tremor (charts) + Zustand + Zod
- Prisma 7 + @prisma/adapter-pg + Supabase PostgreSQL
- Auth: custom JWT via jose + bcryptjs (NO next-auth)
- proxy.ts for auth middleware (Next.js 16 pattern, no middleware.ts)
- @upstash/ratelimit + @upstash/redis (distributed rate limiting)
- @sentry/nextjs (error tracking + session replay)
- Wompi (payment gateway — sandbox active)

## Project Structure

```
src/app/(auth)/        — login, register
src/app/(customer)/    — public checkout flow ([slug]/[tableId])
src/app/(dashboard)/   — restaurant admin panel
src/app/api/           — auth, bill, health, payment, restaurant
src/lib/               — adapters, auth, db, hooks, services, stores, utils, validators
src/components/        — bill, payment, restaurant, shared, ui, upsell
prisma/schema.prisma   — User, Restaurant, Table, QrCode, Order, OrderItem, Payment, UpsellProduct, SubscriptionPlan
proxy.ts               — JWT signature verification (root level)
```

## Commands

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run lint     # ESLint
```

## Rules

### Security (CRITICAL)
- Every protected endpoint MUST have auth + ownership check:
  ```
  const session = await auth();
  if (!session?.user) return 401;
  await verifyOwnership(restaurantId, session.user.id);
  ```
- Never skip ownership verification when creating or modifying endpoints
- Webhook endpoints must validate HMAC signature
- Never expose secrets in client code or URL params

### Design
- Estilo "Fluid Merchant" inspirado en Stitch: superficies con profundidad, tipografía editorial
- Gradientes sutiles permitidos (primary → primary-container, indigo → violet)
- Glassmorphism permitido para overlays flotantes (backdrop-blur + opacity)
- Sombras ambientales de dispersión amplia (0 20px 40px rgba(..., 0.05))
- Palette: Primary `#4648d4`, Secondary `#6b38d4`, Tertiary `#9e00b5`, surfaces `#f9f9ff`
- Fonts: Manrope (headlines, bold/extrabold) + Inter (body/labels, medium 500)
- Bordes definidos por background shifts y sombras, no líneas 1px (excepto a11y)
- Corners: `rounded-xl` a `rounded-3xl` según contexto
- Texto negro: usar `#141b2b` (on-background), nunca `#000000`
- No dark mode unless explicitly requested
- Dashboard admin: mantiene estilo minimal (gray-900 buttons, border-gray-200)

### Code Quality
- Extract shared logic immediately — no duplicating utilities, hooks, or constants
- Before deleting any CSS/code, grep the entire project for usages
- Verify build passes before considering work done

### Workflow
- Skip EnterPlanMode for small/medium changes — go direct
- Don't invent fake data, testimonials, or metrics
- Don't add features beyond what was asked
- Keep responses concise — no trailing summaries
- Language: Spanish for all communication

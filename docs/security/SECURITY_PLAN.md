# PayR — Security Hardening Plan

> **Estado**: en ejecución activa
> **Última actualización**: 2026-04-14
> **Orquestador**: Terminal A (main)
> **Workers**: Terminal B (auth) + Terminal C (data + compliance)

## Contexto

PayR es SaaS B2B financiero (procesa pagos vía Wompi para restaurantes en Colombia). Antes de lanzar a venta pública, hardening completo de seguridad en 12 dominios.

## Criterios de "DONE" para lanzar

Hardening está completo cuando TODOS estos checks pasan:

### 🔴 Crítico (bloqueante para launch)
- [ ] Brute force protection en login (Terminal B)
- [ ] Password reset funcional end-to-end (Terminal B)
- [ ] Webhook idempotency + replay protection (Terminal C)
- [ ] Privacy Policy + Terms publicados con contenido real Colombia (Terminal C)
- [ ] Cero secrets sin cifrar en DB (Terminal C audit)
- [ ] Endpoint audit completo + gaps cerrados (Terminal C)
- [ ] Test end-to-end de pago real con plata real (Vos, post-merge)

### 🟡 Alto (recomendado para launch)
- [ ] Audit log de eventos auth (Terminal B)
- [ ] Session expiration policy + refresh (Terminal B)
- [ ] Rate limit completo en endpoints sensibles (Terminal C)
- [ ] Headers CSP refinados + HSTS (Terminal C)
- [ ] Cookie consent banner (Terminal C)
- [ ] SECRETS_ROTATION.md documentado (Terminal C)

### 🟢 Medio (post-launch ok)
- [ ] 2FA opcional (TOTP) — roadmap post-MVP
- [ ] Custom domain + SSL (cuando compres dominio)
- [ ] Audit log accesible para el dueño desde UI (Terminal B feature opcional)
- [ ] Dependabot configurado en GitHub
- [ ] npm audit programado en CI

## Timeline estimado

| Día | Terminal B | Terminal C | Terminal A |
|---|---|---|---|
| 1-2 | Discovery + plan auth + brute force | Discovery + ENDPOINT_AUDIT.md | Code review docs |
| 3-4 | Password reset flow | Webhook idempotency + encryption audit | Estar disponible |
| 5 | Audit log + session policy | Headers + cookie consent | Estar disponible |
| 6 | Verificación + push | Compliance pages (privacy/terms) | Estar disponible |
| 7 | (review feedback) | Verificación + push | Review B + C, merge a main |
| 8 | (cleanup branch) | (cleanup branch) | Deploy + smoke test + cleanup worktrees |

**Total**: ~1 semana focused dev en paralelo.

## Workflow de coordinación

### Cómo trabajan B y C
1. Cada uno en su worktree (`PayR-sec-auth`, `PayR-sec-data`)
2. Plan presentado al orquestador (Terminal A) antes de implementar
3. Commits frecuentes en su branch (`sec/auth-hardening`, `sec/data-hardening`)
4. Push a su branch
5. Avisan cuando terminan: "Branch `sec/X` listo for review"

### Cómo mergea Terminal A (orquestador)
1. Recibe aviso de "ready for review"
2. Pull del branch + cognitive review
3. Si hay issues → comenta y pide ajustes
4. Si está OK → merge a main:
   ```bash
   git checkout main
   git merge --no-ff origin/sec/auth-hardening
   git merge --no-ff origin/sec/data-hardening
   git push origin main
   ```
5. Resuelve conflicts si aparecen (esperamos que NO porque scopes son disjuntos)
6. Deploy a prod
7. Smoke test post-deploy

### Conflict zones (si alguno toca esto, advertir al otro)

| Archivo | Owner | Por qué |
|---|---|---|
| `prisma/schema.prisma` | Ambos modifican (B: PasswordResetToken/AuthEvent; C: ProcessedWebhook) | **Riesgo medio**: van a aparecer ambas tablas, merge debería ser additive |
| `lib/utils/rate-limit.ts` | Ambos pueden agregar limiters | **Bajo riesgo**: solo agregar consts nuevas |
| `next.config.ts` | C principalmente | B no toca |
| `proxy.ts` | B (si necesita session invalidation) | C no toca |

**Estrategia anti-conflict**: cada uno commit el schema change con migration name único. Al mergear, las migrations se aplican secuencialmente (Prisma maneja).

## Migrations — protocolo

**SIEMPRE via Supabase MCP** (no `prisma migrate dev` local):
```
mcp__claude_ai_Supabase__apply_migration
project_id: lqzavblwjfonjhkieckb
name: <prefix>_<feature>_<descripcion>
query: <SQL DDL>
```

Naming convention:
- B: `auth_<feature>_<desc>` (ej. `auth_password_reset_table`, `auth_events_table`)
- C: `data_<feature>_<desc>` (ej. `data_processed_webhooks_table`)

Después de cada migration, regenerar Prisma client:
```bash
npx prisma generate
```

## Comunicación entre terminales

**No hay comunicación directa** entre B y C (son procesos independientes). Toda coordinación va via Terminal A (orquestador).

Si B o C tienen una pregunta de scope, dudas, o detectan algo del scope del otro:
1. Documentarlo en su worktree con un comentario `// TODO(orquestador): ...`
2. Avisar al user (que avisa al orquestador)
3. Orquestador decide

## Scope creep — qué hacer

Si B o C identifican algo importante que NO está en su scope:
- **NO lo implementen sin consultar**
- Documentarlo en `docs/security/follow-ups.md` (yo lo creo si surge)
- Esperar decisión del orquestador

## Skills a definir (después del hardening)

Una vez que B y C terminen, el orquestador refina y exporta lecciones aprendidas a:
- `~/.claude/skills/security-audit/SKILL.md`
- `~/.claude/skills/auth-hardening/SKILL.md`
- `~/.claude/skills/webhook-security/SKILL.md`
- `~/.claude/skills/secrets-management/SKILL.md`
- `~/.claude/skills/compliance-colombia/SKILL.md`

Estos skills son reusables para futuras sesiones / proyectos.

## Post-merge checklist (Terminal A)

Cuando todo esté mergeado:
- [ ] `npx tsc --noEmit` limpio
- [ ] `npm run lint` limpio
- [ ] Migrations aplicadas (verificar `mcp__claude_ai_Supabase__list_migrations`)
- [ ] Deploy a prod (`vercel --prod`)
- [ ] Smoke tests:
  - [ ] Login funciona
  - [ ] Login con 5 fallos → bloqueo
  - [ ] Forgot password → email simulado en console
  - [ ] Reset password completo
  - [ ] Webhook duplicado → ignorado
  - [ ] /privacy y /terms cargan
  - [ ] Cookie consent aparece primera visita
- [ ] Update README.md con nota de "Security hardening completo"
- [ ] Cleanup worktrees: `git worktree remove ../PayR-sec-auth ../PayR-sec-data`
- [ ] Cleanup branches remotas: `git push origin --delete sec/auth-hardening sec/data-hardening`

## Después del hardening — siguientes pasos

1. **Probar end-to-end con plata real** (vos + Wompi PROD)
2. **Configurar email para soporte** (vos)
3. **Setup analytics** (vos + yo)
4. **Lanzar en beta cerrada** con 2-3 restaurantes piloto
5. **Iterar features** según feedback real

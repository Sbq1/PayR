# Runbook: Restore de DB desde PITR

**Severidad**: 🔴🔴 Catastrófica — downtime total + potencial data loss.
**RTO objetivo**: < 30 min (tiempo hasta app volver a operar).
**RPO objetivo**: ≤ 2 min (granularidad PITR Supabase).
**Simulacro**: trimestral en staging (ver §6).

---

## Cuándo ejecutar este runbook

Solo cuando confirmás **uno o más** de los siguientes:

- 🔴 **Data corruption**: borrado masivo accidental (DROP TABLE, DELETE sin WHERE, migración que borró columnas con datos)
- 🔴 **Ransomware / compromise**: credenciales DB leak + modificaciones sospechosas en las últimas N horas
- 🔴 **Migración destructiva con backfill malo**: aplicada a prod, backfill calculó mal, ya hay comensales afectados
- 🔴 **Supabase incident acknowledged**: status.supabase.com dice que tu proyecto fue afectado por un incidente de storage

**NO ejecutar** si:
- La DB responde pero está lenta (runbook de performance, no de restore)
- Un query retorna resultado raro (bug de app, no de DB)
- Solo un registro específico está mal (fixeable con UPDATE manual)

Restaurar = downtime garantizado. Solo si el costo de NO restaurar > downtime.

---

## Pre-requisito — PITR habilitado

**Verificar AHORA** (antes de necesitarlo):

1. Supabase Dashboard → tu proyecto `smart-checkout-prod`
2. **Database** → **Backups** (sidebar)
3. Deberías ver:
   - **Physical backups**: diarios, retención 7+ días
   - **Point-in-Time Recovery (PITR)**: habilitado con retención 7-30 días

Si dice **"PITR disabled"** o **"Upgrade to Pro required"**:

> ⚠️ **Pará todo y activalo AHORA**. PITR no es algo que se activa en la crisis — necesita 24-48h para tener ventana de recovery real. Sin PITR, el mejor RPO es el último daily backup (pérdida de hasta 24h de data).

Plan Pro cuesta $25/mo. Un incidente sin PITR cuesta >$25 en minutos de pérdidas + confianza.

---

## 1. Decisión en los primeros 15 min

### 1.1 Confirmar el alcance

Antes de tocar nada, capturar snapshot del daño actual:

```sql
-- Ejecutar en Supabase SQL editor (PROD) y guardar output en ticket
SELECT
  'orders_today' AS metric, COUNT(*)::text AS value
  FROM orders WHERE created_at::date = NOW()::date
UNION ALL SELECT 'payments_today', COUNT(*)::text FROM payments WHERE created_at::date = NOW()::date
UNION ALL SELECT 'payments_approved_today', COUNT(*)::text FROM payments WHERE status='APPROVED' AND paid_at::date = NOW()::date
UNION ALL SELECT 'refunds_today', COUNT(*)::text FROM refunds WHERE created_at::date = NOW()::date
UNION ALL SELECT 'restaurants_active', COUNT(*)::text FROM restaurants WHERE is_active=true
UNION ALL SELECT 'sessions_active', COUNT(*)::text FROM sessions WHERE revoked_at IS NULL AND expires_at > NOW();
```

### 1.2 Decidir el target timestamp

PITR restaura a un **momento específico**. Hay que decidir **cuándo**.

- Si hay cron log del incidente → timestamp justo antes
- Si no, conservador: **5 min antes del primer síntoma reportado**
- Zona horaria: UTC obligatorio (Supabase usa UTC internamente)

Ejemplo: si el primer "doble cobro" llegó a WhatsApp 14:32 UTC-5, restaurá a **19:27 UTC**.

### 1.3 Pausar tráfico entrante

**Antes** de restaurar, bloquear nuevos pagos para no generar más inconsistencia:

**Opción rápida** — env var en Vercel:
```
PAYMENTS_DISABLED=true
```
(TODO: pre-cablear en `payment.service.ts::createPayment` — ver runbook `wompi-down.md` §2.1)

**Si el flag no existe** — despliegue de emergencia con banner "Servicio en mantenimiento, volvemos en 30min" y botón de pagar deshabilitado.

### 1.4 Comunicar (paralelo al restore)

Al momento de decidir restore → WhatsApp a todos los restaurantes activos:

```
URGENTE — PayR

Estamos restaurando la base de datos por un incidente técnico.
Los pagos por QR están temporalmente pausados.

Duración estimada: 30-45 minutos.
Alternativa: cobrá por datáfono / efectivo mientras tanto.

Te avisamos acá apenas volvamos. Disculpá la molestia.
```

---

## 2. Ejecutar restore (15-30 min)

### 2.1 Opción A — Restore en nuevo proyecto (RECOMENDADO)

**Por qué**: no perdés el estado actual. Podés diffear la DB corrompida vs la restaurada y seleccionar qué migrar. Cero riesgo de "restauré mal y ahora no hay cómo volver".

1. Supabase Dashboard → proyecto actual → **Database → Backups → Point in Time Recovery**
2. **Restore to a new project**
3. Target: el timestamp UTC que decidiste en 1.2
4. New project name: `smart-checkout-restore-{fecha}`
5. **Confirmar** → Supabase empieza restore (típico: 10-20 min para DB <10 GB)

Mientras corre:
- ⏱ Anotá hora de inicio
- ✅ Pega link del nuevo proyecto al ticket

### 2.2 Opción B — Restore in-place (solo si no hay alternativa)

Sobrescribe el proyecto actual. **Data perdida entre timestamp_restore y NOW() es irrecuperable.**

Usar SOLO si:
- Opción A no disponible (plan limitado)
- La corrupción es tan severa que la DB actual es inútil
- Tenés snapshot pre-restore en mano (export SQL completo descargado)

Pasos:
1. **Export actual como seguro** (aun corrupto): Dashboard → Database → Backups → "Download snapshot"
2. Point in Time Recovery → **Restore to this project** → confirmar timestamp UTC
3. Esperar completion notification

---

## 3. Validación post-restore (10 min)

### 3.1 Sanity queries

Ejecutar en el proyecto restaurado:

```sql
-- Comparar con baseline de 1.1. Esperamos números similares pero
-- SIN las entradas corruptas post-timestamp.
SELECT
  'orders_total' AS metric, COUNT(*) AS value FROM orders
UNION ALL SELECT 'payments_approved_total', COUNT(*) FROM payments WHERE status='APPROVED'
UNION ALL SELECT 'restaurants_active', COUNT(*) FROM restaurants WHERE is_active=true
UNION ALL SELECT 'sessions_valid', COUNT(*) FROM sessions WHERE revoked_at IS NULL
UNION ALL SELECT 'refunds_pending', COUNT(*) FROM refunds WHERE status='PENDING';
```

### 3.2 Verificar integridad referencial

```sql
-- Orphaned payments (order_id que no existe)
SELECT p.id FROM payments p
 LEFT JOIN orders o ON o.id = p.order_id
 WHERE o.id IS NULL;

-- Orders PAID sin payment APPROVED (inconsistencia post-restore)
SELECT o.id FROM orders o
 WHERE o.status='PAID'
   AND NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='APPROVED');
```

Si cualquiera devuelve rows → **NO conectar la app aún**. Escalar a debugging manual antes.

### 3.3 Smoke test contra la DB restaurada

Con el proyecto restaurado, apuntar temporal:

```bash
# En Vercel, cambiar DATABASE_URL y DIRECT_URL al nuevo proyecto
# Redeploy
# Correr:
npx tsx --env-file=.env.production.local scripts/smoke-test.ts
```

✅ Esperar 12/12 PASS antes de reabrir tráfico público.

---

## 4. Switch de tráfico (5 min)

### 4.1 Actualizar DATABASE_URL / DIRECT_URL en Vercel

1. Supabase nuevo proyecto → Project Settings → Database → Connection string
2. Copiá los dos (pooled + direct)
3. Vercel → Settings → Environment Variables → editar `DATABASE_URL` y `DIRECT_URL` en Production
4. **Redeploy** — sin esto, los env vars no aplican

### 4.2 Verificar prod live

```bash
curl https://smart-checkout-omega.vercel.app/api/health
# Esperar 200 { "db": "ok" }
```

### 4.3 Habilitar pagos

```
PAYMENTS_DISABLED=false
# o remover el env var completamente
```

Redeploy (trigger mínimo: empty commit).

### 4.4 Monitor las siguientes 2 horas

Sentry feed + logs en vivo. Esperar:
- Payments nuevos que llegan sin errores
- Webhooks procesando normal
- Cron reconcile-hot corriendo sin alertas

---

## 5. Comunicación post-restore

### 5.1 Al universo de restaurantes (WhatsApp)

```
PayR — Actualización

Servicio restaurado ✅. Los pagos por QR están funcionando
nuevamente.

⚠️ Si tenés algún cobro entre {ts_restore} y {ts_reopen} UTC que
no ves reflejado en tu dashboard, avisanos — tenemos herramientas
para reconciliarlo.

Perdón por la molestia, escribí un post-mortem completo
en 48h con las mejoras que implementamos.
```

### 5.2 A comensales impactados

**Solo si tenés contacto directo** (poco común — mayoría solo tienen el ticket).

Via restaurante: "Si un comensal viene con ticket y no figura como pagado en nuestro sistema, escaneá el QR + pídele que muestre el extracto bancario. Nosotros reconciliamos al final del día."

### 5.3 Status page pública

```
[Resolved] Incidente en base de datos — {fecha, hora UTC}
Duración: {X} minutos
Impacto: pagos QR no disponibles durante el incidente.
Post-mortem completo: <link> (48h)
```

---

## 6. Post-mortem obligatorio (≤48 h)

Archivo: `docs/post-mortems/{YYYY-MM-DD}-db-restore.md`

Secciones:
- **Timeline UTC** — cada acción con timestamp
- **Root cause** — qué disparó la restauración
- **Impacto** — # restaurantes, # pagos en hold, COP $ en disputa
- **Detección** — cómo lo detectamos (Sentry, comensal, manual)
- **Respuesta** — qué funcionó, qué no
- **Acciones preventivas** con owner + deadline:
  - ¿Falta PITR en otros ambientes?
  - ¿Migraciones deberían requerir aprobación doble?
  - ¿Backups offsite adicionales?
- **Lecciones aprendidas**

Compartido internamente + resumen ejecutivo al dueño del restaurante piloto.

---

## 7. Simulacro trimestral (preventivo)

**Obligatorio en staging**, una vez cada trimestre:

1. Crear proyecto Supabase `smart-checkout-staging-restore-test`
2. Poblarlo con seed de ~100 restaurantes + 10k payments (o dump anonimizado de prod)
3. Correr `DELETE FROM payments WHERE 1=1` intencional
4. Ejecutar este runbook completo contra staging
5. Medir:
   - Tiempo total real vs RTO 30 min
   - Tiempo de detección vs simulado
   - ¿Todos los pasos documentados funcionaron?
6. Actualizar runbook con gaps encontrados

Si tiempo real > 45 min → oportunidad de optimizar scripts/automatización.

---

## Cheat sheet de emergencia (copy-paste)

```bash
# 1. Pausar tráfico
vercel env add PAYMENTS_DISABLED production  # pega "true"
# redeploy automático o manual

# 2. Snapshot pre-restore
# Supabase → Backups → "Download current snapshot"

# 3. PITR a nuevo proyecto
# Supabase Dashboard → Database → Backups → Point in Time Recovery
# → Restore to new project → target UTC timestamp

# 4. Switch DB en Vercel
# env vars DATABASE_URL + DIRECT_URL al nuevo proyecto
# redeploy

# 5. Smoke
npx tsx --env-file=.env.production.local scripts/smoke-test.ts

# 6. Re-abrir tráfico
vercel env rm PAYMENTS_DISABLED production
# redeploy

# 7. Comunicar recovery
# WhatsApp broadcast a restaurantes
# Status page update
```

---

## Dependencias preventivas (TODO antes del piloto)

- [ ] **PITR habilitado en Supabase prod** — verificar en Database → Backups
- [ ] **Feature flag `PAYMENTS_DISABLED`** pre-cableado en código
- [ ] **Export SQL diario ingestado a S3** (backup offsite — defensa extra contra compromise del Supabase account)
- [ ] **Script `backup-audit.ts`** que semanalmente chequea que PITR sigue activo (alerta si alguien lo desactivó)
- [ ] **Simulacro trimestral realizado** al menos 1 vez antes del piloto

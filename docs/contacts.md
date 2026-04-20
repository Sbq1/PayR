# Contactos de escalada — Source of truth

**Propósito**: cuándo algo arde, acá está a quién llamar. Single source of truth
para no duplicar datos en cada runbook.

**Última actualización**: [TU-FECHA]  
**Responsable de mantener**: [TU-NOMBRE]

> ⚠️ **Antes del piloto Día 1** este doc debe estar 100% lleno. Los runbooks
> apuntan acá — si está vacío, en un incidente estás buscando teléfonos en
> emails mientras pierdes dinero.

---

## 🔴 Proveedores críticos (bloquean pagos si caen)

### Wompi (procesador de pagos)
- **Soporte técnico email**: `[soporte@wompi.co ?]`
- **Soporte cuenta (comercial)**: `[???]`
- **Status page**: https://status.wompi.co/
- **Docs**: https://docs.wompi.co/
- **Account manager** (si tenés uno): `[nombre, teléfono, email]`
- **Cuándo contactar**:
  - Webhooks perdidos masivos (> 10% en 1h)
  - API timeouts o 5xx sostenidos
  - Credenciales sandbox/prod issues
  - Disputas de transacciones
- **SLA esperado**: [horas según tu plan con ellos]

### Siigo (POS + facturación DIAN)
- **Soporte técnico**: `[???]`
- **Soporte cuenta**: `[???]`
- **Status page**: `[tiene?]`
- **Docs API**: https://siigoapi.docs.apiary.io/
- **Partner manager** (si tenés uno): `[nombre, teléfono]`
- **Cuándo contactar**:
  - POS no cierra mesas automáticamente después de pago
  - Credenciales expiradas del restaurante
  - Error emitiendo factura electrónica
  - Límite de consumo DIAN agotado
- **SLA esperado**: [horas]

### Supabase (base de datos + auth)
- **Support email**: support@supabase.io
- **Discord** (respuesta rápida): https://discord.supabase.com/
- **Status page**: https://status.supabase.com/
- **Docs**: https://supabase.com/docs
- **Dashboard**: https://supabase.com/dashboard/projects
- **Cuándo contactar**:
  - PITR no funciona o no restaura bien
  - DB caída o pooler saturado
  - Storage issues
- **SLA**: 24h en plan Free, ~8h en Pro

### Vercel (hosting + CDN)
- **Support**: https://vercel.com/help
- **Status page**: https://www.vercel-status.com/
- **Dashboard**: https://vercel.com/samuelbastidasbq111-9078s-projects/smart-checkout
- **Docs**: https://vercel.com/docs
- **Cuándo contactar**:
  - Deploys fallan persistentes (no por nuestro código)
  - DNS / custom domain issues
  - Edge network down en Colombia
- **SLA**: Discord community para Hobby, ~24h en Pro

### Upstash (Redis para rate limiting)
- **Support**: `support@upstash.com`
- **Status**: https://status.upstash.com/
- **Dashboard**: https://console.upstash.com/
- **Cuándo contactar**:
  - Redis cae → rate limits fallan open o closed según config
  - Latencia alta del pooler
- **Nota**: nuestro fail-open en `/api/payment/webhook` mitiga downs cortos

### Resend (emails transaccionales)
- **Support**: `support@resend.com`
- **Dashboard**: https://resend.com/dashboard
- **Cuándo contactar**:
  - Reset password emails no llegan
  - Bounce rate alto

---

## 🟡 Proveedores secundarios

### Sentry (error tracking)
- **Dashboard**: https://starupsjs.sentry.io/
- **Docs**: https://docs.sentry.io/
- **Cuándo contactar**: rara vez. Si alertas no disparan, revisar config nosotros primero.

### GitHub (repo + Actions)
- **Repo**: https://github.com/Sbq1/PayR
- **Support**: https://support.github.com/
- **Cuándo contactar**: Actions quotas, rate limits API

---

## 👥 Interno — on-call humano

### Escalada técnica (bugs, incidentes)
| Nivel | Nombre | Teléfono | Cuándo |
|---|---|---|---|
| L1 | [TU-NOMBRE] | [TU-TEL] | Primero por defecto |
| L2 | `[???]` | `[???]` | Si L1 no resuelve en X horas / está durmiendo |
| L3 / Crisis | `[???]` | `[???]` | Solo incidentes crítica — reconcile discrepancy, data loss |

### Asesoría externa
| Rol | Nombre | Teléfono/Email | Cuándo |
|---|---|---|---|
| Asesor legal (Ley 2300, habeas data) | `[???]` | `[???]` | Reclamo formal de comensal, demanda |
| Tributarista DIAN / FE | `[???]` | `[???]` | Duda sobre documento emitido, configuración fe_regime |
| Contador del restaurante piloto #1 | `[???]` | `[???]` | Reconciliación mensual con sus libros |

---

## 🏪 Restaurantes piloto — contactos directos

Por cada restaurante activo, mantener ficha:

### Restaurante #1
- **Nombre comercial**: `[???]`
- **Slug PayR**: `[???]`
- **Dueño / admin**: `[nombre]`
- **WhatsApp directo**: `[+57 ???]`
- **Email**: `[???]`
- **Horario operación**: `[???]`
- **Método de cobro alternativo** (cuando PayR cae): Datafono / efectivo / [otro]
- **Notas**: `[???]`

### Restaurante #2
- (repetir template)

### Restaurante #3
- (repetir template)

---

## 📋 Checklist de mantención

- [ ] Actualizar este doc cada vez que cambie un contacto
- [ ] Verificar cada 3 meses que los teléfonos/emails siguen activos (1 WhatsApp rápido)
- [ ] Cuando entre un restaurante nuevo al piloto, agregar su ficha antes del Día 1
- [ ] Cuando salga un restaurante, mover su ficha a un archivo `contacts-archive.md`

---

## 🔗 Runbooks que apuntan a este doc

- [`runbooks/README.md`](./runbooks/README.md) §📞 Contactos de escalada
- [`pilot-day-1.md`](./pilot-day-1.md) §📞 Contactos rápidos
- [`runbooks/wompi-down.md`](./runbooks/wompi-down.md) §1.1 status check
- [`runbooks/db-restore.md`](./runbooks/db-restore.md) §Pre-requisito
- Cualquier runbook nuevo que escribas debería linkear a este doc
  en vez de duplicar contactos.

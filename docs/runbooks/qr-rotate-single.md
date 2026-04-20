# Runbook: Rotar QR de una sola mesa

**Severidad**: 🟡 Warning — un QR expuesto permite pagos fraudulentos limitados a esa mesa, pero NO es un compromiso del sistema.
**SLA respuesta**: < 4 h (rotar + imprimir) / < 24 h (reemplazar físicamente).
**Usar este runbook si**: se rota UNA mesa, no todo el sistema. Para rotación global de `QR_SECRET` ver `qr-secret-rotation.md` (post-piloto).

---

## Cuándo ejecutar

El QR físico de una mesa quedó expuesto públicamente. Ejemplos reales de piloto:

- 📸 **Foto en Instagram**: cliente subió selfie de la mesa, el QR está legible y quedó indexado
- 📰 **Review de blog gastronómico**: hicieron reseña con foto, QR visible
- 🖨️ **Lote de QRs viejos**: cambiaron el diseño del QR, los 50 viejos en stock de impresión quedaron circulando
- 🧑‍💼 **Mesero despedido con acceso al stock de QRs**: se llevó QRs impresos

El impacto es acotado:
- Atacante puede escanear y ABRIR la pantalla de pago de **esa mesa** → pero el monto se calcula desde Siigo por mesa, así que solo puede pagar **la cuenta real abierta de esa mesa**
- No es exfiltración de data. No es IDOR. El worst-case es que alguien pague la cuenta sin ser comensal (raro, voluntario)
- Pero si eso pasara, el restaurante lo marca como "cuenta cerrada" por error y reabre manual

**El verdadero valor de rotar**: higiene operacional + si el atacante **combina** el QR leak con otra vulnerabilidad futura, ya no sirve.

---

## 1. Diagnóstico rápido (5 min)

### 1.1 Identificar la mesa

Necesitás el `tableId` (UUID) de la mesa comprometida. Fuentes:
- Si tenés el QR (la URL): `https://<prod>/<slug>/<tableId>?qrToken=...&qrVersion=N`. El `tableId` es el segundo segmento.
- Si solo tenés "Mesa 5 del restaurante X":
```sql
SELECT t.id AS table_id, t.table_number, t.label, r.slug, r.name AS restaurant_name
  FROM tables t
  JOIN restaurants r ON r.id = t.restaurant_id
 WHERE r.slug = '<SLUG>' AND t.table_number = <NUM>;
```

### 1.2 Ver estado actual del QR

```sql
SELECT id, table_id, url, token_version, rotated_at, is_active
  FROM qr_codes
 WHERE table_id = '<TABLE_ID>';
```

Guardá el `token_version` actual (ej. `1`) para el paso de invalidación.

---

## 2. Rotar el token (2 min)

### 2.1 Incrementar `token_version` en DB

```sql
UPDATE qr_codes
   SET token_version = token_version + 1,
       rotated_at    = NOW()
 WHERE table_id = '<TABLE_ID>'
RETURNING token_version;
```

**Efecto inmediato**:
- El QR físico (que codifica versión `1`) sigue siendo escaneable con el celular → abre la URL
- Pero `POST /api/session/start` valida `qrVersion === qr_codes.token_version` en DB
- Como ahora la DB dice `2` pero el QR manda `1` → **401 QR_INVALID**
- El comensal ve: "QR no válido, pide al mesero un QR actualizado"

### 2.2 Verificar

```sql
-- Debe mostrar token_version incrementado + rotated_at reciente
SELECT token_version, rotated_at
  FROM qr_codes
 WHERE table_id = '<TABLE_ID>';
```

### 2.3 Test funcional

Intentá escanear el QR viejo con tu propio celular (o usar una URL simulada):
```
https://smart-checkout-omega.vercel.app/<SLUG>/<TABLE_ID>?qrToken=<TOKEN_VIEJO>&qrVersion=1
```

Debe redirigir a una página de error "QR no válido". Si no → el token_version no se rotó bien.

---

## 3. Generar QR nuevo (10 min)

### 3.1 Regenerar la URL firmada

Tenés 2 opciones:

**Opción A — Vía dashboard** (si el flow de generación está expuesto):
1. Login como OWNER
2. `/qr-codes` → buscar la mesa
3. "Regenerar QR" → descarga PNG nuevo

**Opción B — Vía script** (fallback):
```bash
# Correr desde raíz del repo con .env.production.local cargado
npx tsx --env-file=.env.production.local scripts/generate-single-qr.ts <TABLE_ID>
```

Output esperado: un PNG + la URL firmada (`qrToken` y `qrVersion` actualizados).

> ⚠️ TODO: el script `generate-single-qr.ts` no existe aún. Cuando lo escribas, seguí el patrón de `generate-signed-qr-batch.ts` (referenciado en plan §11). Hasta entonces, usar Opción A o generar manualmente llamando a `signQrToken(tableId, nuevoVersion)` desde un node REPL.

### 3.2 Verificar el QR nuevo funciona

Escanealo con el celular. Debería:
1. Abrir la URL de checkout
2. `/api/session/start` retorna 200 con JWT válido
3. Se carga la cuenta

Si falla → revisar que `NEXT_PUBLIC_APP_URL` apunta a prod en el entorno de generación + que el script use el mismo `QR_SECRET` que Vercel.

---

## 4. Reemplazo físico (variable)

### 4.1 Imprimir

Imprimí el PNG en la misma calidad/tamaño que el QR original. Asegurate de incluir:
- Logo del restaurante (si lo tenía)
- Número de mesa visible
- Leyenda opcional: "Escaneá para pagar"

### 4.2 Coordinar con el restaurante

WhatsApp al dueño:

```
Hola <NOMBRE>,

Necesitamos reemplazar el QR de la mesa <NUM>. Te explico:
detectamos que el QR anterior quedó expuesto (ej: foto en redes).
No hay cobros fraudulentos todavía — es prevención.

Te envío el QR nuevo por este chat. Pasos:
1. Imprimí el PDF (o te lo imprimimos nosotros)
2. Remové el QR actual de la mesa <NUM>
3. Pegá el nuevo en el mismo lugar

Hasta que lo reemplaces, si un comensal escanea el viejo verá
"QR no válido, pide al mesero uno nuevo". No podrá pagar por QR
en esa mesa hasta que tengas el físico nuevo.

Cualquier duda acá.
```

### 4.3 Tiempo hasta reemplazo físico

- Mismo día ideal: rotación de secret alineada con reemplazo en < 24h
- Si no: el QR viejo sigue "muerto" (devuelve 401), comensales cobran con datafono
- No dejar > 72h sin reemplazar — afecta UX y NPS del restaurante

---

## 5. Comunicación

### 5.1 Al restaurante

Ver plantilla §4.2 arriba.

### 5.2 A comensales

No aplica. No contactamos directamente.

### 5.3 Status page pública

No requiere aviso público — es rotación preventiva, no incidente de servicio.

---

## 6. Post-incidente

### 6.1 Registrar en log de rotaciones

Archivo: `docs/qr-rotations.log` (crear si no existe)

```
2026-04-19  SC-smoke-test-payr  mesa-999  reason=foto_instagram  rotated_by=samuel
```

Útil para auditoría y para detectar patrones (si una mesa rota 3 veces en 1 mes, hay un problema persistente).

### 6.2 Evaluar causa raíz

- Foto pública: quizás el restaurante publica en IG sin revisar fotos. Sugerir política interna.
- Lote de QRs viejos: revisar qué pasó en la transición de diseño. Desechar stock viejo físicamente.
- Ex-mesero con acceso: revisar controles de stock (los QRs no deberían estar en lugar accesible).

---

## 7. Cuándo escalar a rotación global (`qr-secret-rotation.md`)

**NO uses este runbook** si:
- Se rotan ≥ 5 mesas en un mismo incidente → escalar
- El `QR_SECRET` mismo (env var en Vercel) fue filtrado → rotación global inmediata
- Un ex-dev con acceso a Vercel env vars se fue → rotación global de todos los secrets
- Detectás intentos masivos de generar QRs válidos en Sentry → rotación global

Rotación global tiene runbook propio (post-piloto): ventana dual de 14 días + regenerar PDFs de todas las mesas + coordinar con todos los restaurantes.

---

## 8. Cheat sheet de emergencia

```sql
-- Rotar token_version de una mesa
UPDATE qr_codes
   SET token_version = token_version + 1, rotated_at = NOW()
 WHERE table_id = '<TABLE_ID>'
RETURNING *;
```

```bash
# Regenerar QR (cuando el script exista)
npx tsx --env-file=.env.production.local scripts/generate-single-qr.ts <TABLE_ID>
```

Imprimir → WhatsApp al restaurante → registrar en `docs/qr-rotations.log`.

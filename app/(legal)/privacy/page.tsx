import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad — PayR",
  description:
    "Política de tratamiento de datos personales de PayR (Smart Checkout), conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "14 de abril de 2026";

export default function PrivacyPage() {
  return (
    <>
      <h1>Política de Privacidad</h1>
      <p className="text-[#78716c] text-sm">Última actualización: {LAST_UPDATED}</p>

      <p>
        Esta Política describe cómo <strong>[NOMBRE LEGAL DE LA EMPRESA]</strong> (en
        adelante, &quot;PayR&quot; o &quot;nosotros&quot;), con NIT <strong>[NIT]</strong>, domicilio en{" "}
        <strong>[DIRECCIÓN FÍSICA]</strong>, Bogotá D.C., Colombia, trata los datos
        personales de sus usuarios en cumplimiento de la Ley 1581 de 2012, el Decreto
        1377 de 2013 y demás normas aplicables en materia de protección de datos
        personales en Colombia (régimen de <em>Habeas Data</em>).
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <ul>
        <li>Razón social: <strong>[NOMBRE LEGAL DE LA EMPRESA]</strong></li>
        <li>NIT: <strong>[NIT]</strong></li>
        <li>Dirección: <strong>[DIRECCIÓN FÍSICA]</strong>, Bogotá D.C., Colombia</li>
        <li>Representante legal: <strong>[NOMBRE DEL REPRESENTANTE LEGAL]</strong></li>
        <li>Correo de contacto para ejercer derechos: <a href="mailto:hola@smartcheckout.co">hola@smartcheckout.co</a></li>
      </ul>

      <h2>2. Datos que recolectamos</h2>
      <p>Según el tipo de usuario, recolectamos los siguientes datos:</p>
      <h3>Titulares del restaurante (clientes de PayR)</h3>
      <ul>
        <li>Nombre, correo electrónico y contraseña (almacenada como hash bcrypt).</li>
        <li>Nombre comercial, slug, logo y configuración visual del restaurante.</li>
        <li>Credenciales de integración con Wompi y Siigo, cifradas con AES-256-GCM.</li>
        <li>Información sobre mesas, órdenes, pagos, productos y métricas operativas.</li>
      </ul>
      <h3>Comensales (usuarios finales del QR)</h3>
      <ul>
        <li>Dirección de correo electrónico (opcional, para envío de comprobante).</li>
        <li>Datos de la transacción procesados por Wompi (monto, método de pago, estado).</li>
        <li>Datos técnicos (IP, navegador) con fines de seguridad y rate limiting.</li>
      </ul>

      <h2>3. Finalidades del tratamiento</h2>
      <ul>
        <li>Prestar el servicio de cobro QR y liquidación con el POS del restaurante.</li>
        <li>Procesar pagos a través de la pasarela Wompi.</li>
        <li>Emitir facturas electrónicas a través de Siigo.</li>
        <li>Brindar soporte técnico y comercial.</li>
        <li>Cumplir obligaciones legales, contables y tributarias en Colombia.</li>
        <li>Mejorar el servicio mediante métricas agregadas y anónimas.</li>
        <li>Prevenir fraude y proteger la seguridad de la plataforma.</li>
      </ul>

      <h2>4. Terceros con quienes compartimos datos</h2>
      <p>PayR comparte datos únicamente con los siguientes encargados del tratamiento:</p>
      <ul>
        <li><strong>Wompi</strong> (Bancolombia S.A.) — procesamiento de pagos.</li>
        <li><strong>Siigo</strong> — emisión de facturación electrónica.</li>
        <li><strong>Supabase</strong> — almacenamiento de base de datos.</li>
        <li><strong>Vercel</strong> — alojamiento de la aplicación.</li>
        <li><strong>Sentry</strong> — monitoreo de errores (no incluye datos sensibles).</li>
      </ul>
      <p>
        No vendemos, alquilamos ni cedemos datos personales a terceros con fines
        publicitarios.
      </p>

      <h2>5. Retención de datos</h2>
      <ul>
        <li>Datos contables y de facturación: conservados por el término legal de 10 años (Art. 28 CCo).</li>
        <li>Datos de cuenta del restaurante: mientras exista la relación contractual y hasta 5 años después de su terminación.</li>
        <li>Datos técnicos (logs de seguridad): máximo 12 meses.</li>
      </ul>

      <h2>6. Derechos del titular</h2>
      <p>Como titular de los datos, usted tiene derecho a:</p>
      <ul>
        <li>Conocer, actualizar y rectificar sus datos personales.</li>
        <li>Solicitar prueba de la autorización otorgada.</li>
        <li>Ser informado sobre el uso dado a sus datos.</li>
        <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
        <li>Revocar la autorización y/o solicitar la supresión de los datos cuando no se respete el régimen de protección de datos.</li>
        <li>Acceder en forma gratuita a sus datos personales que hayan sido objeto de tratamiento.</li>
      </ul>

      <h2>7. Cómo ejercer sus derechos</h2>
      <p>
        Envíenos una solicitud al correo{" "}
        <a href="mailto:hola@smartcheckout.co">hola@smartcheckout.co</a> indicando
        nombre completo, número de identificación, contacto y descripción clara de la
        petición. Responderemos dentro de los términos legales (máximo 15 días hábiles
        para consultas y 15 días hábiles para reclamos, prorrogables).
      </p>

      <h2>8. Seguridad de la información</h2>
      <p>
        Implementamos medidas técnicas y organizativas razonables para proteger los
        datos personales: cifrado AES-256-GCM en credenciales sensibles, hash bcrypt
        para contraseñas, conexiones TLS, rate limiting, verificación HMAC en webhooks
        y control de acceso basado en ownership.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Utilizamos cookies propias estrictamente necesarias para el funcionamiento del
        servicio (sesión, preferencias). Consulte nuestra{" "}
        <Link href="/cookies">Política de Cookies</Link> para más detalle.
      </p>

      <h2>10. Cambios a esta política</h2>
      <p>
        Podemos modificar esta Política en cualquier momento. Publicaremos la nueva
        versión en esta página con la fecha de actualización. Los cambios sustanciales
        serán notificados a los usuarios registrados por correo electrónico.
      </p>

      <h2>11. Jurisdicción</h2>
      <p>
        Esta Política se rige por las leyes de la República de Colombia. Cualquier
        controversia será resuelta ante los jueces de Bogotá D.C.
      </p>
    </>
  );
}

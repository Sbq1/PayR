import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Cookies — PayR",
  description:
    "Política de uso de cookies y tecnologías similares en la plataforma PayR.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "14 de abril de 2026";

export default function CookiesPage() {
  return (
    <>
      <h1>Política de Cookies</h1>
      <p className="text-[#78716c] text-sm">Última actualización: {LAST_UPDATED}</p>

      <p>
        <strong>[NOMBRE LEGAL DE LA EMPRESA]</strong> utiliza cookies y tecnologías
        similares en la plataforma PayR únicamente con fines técnicos necesarios para
        la prestación del servicio.
      </p>

      <h2>1. ¿Qué es una cookie?</h2>
      <p>
        Una cookie es un pequeño archivo de texto que un sitio web guarda en su
        navegador para recordar preferencias o autenticar sesiones.
      </p>

      <h2>2. Cookies que utilizamos</h2>
      <h3>Estrictamente necesarias</h3>
      <ul>
        <li>
          <strong>Sesión de autenticación</strong>: cookie JWT con flags{" "}
          <code>httpOnly</code>, <code>secure</code> (en producción) y{" "}
          <code>sameSite=lax</code>. Permite mantener su sesión iniciada.
        </li>
        <li>
          <strong>Consentimiento de cookies</strong>: almacenamos en{" "}
          <code>localStorage</code> una marca que indica que ya aceptó esta política,
          para no mostrar el banner en cada visita.
        </li>
      </ul>

      <h3>Analíticas y de terceros</h3>
      <p>
        Actualmente <strong>no utilizamos</strong> cookies analíticas ni publicitarias
        (Google Analytics, Meta Pixel, etc.). Si en el futuro las implementamos, esta
        política será actualizada y le solicitaremos consentimiento expreso.
      </p>

      <h2>3. Cookies de terceros embebidos</h2>
      <p>
        Durante un pago, el widget de <strong>Wompi</strong> puede establecer cookies
        propias en su dominio (<code>checkout.wompi.co</code>). Estas cookies están
        sujetas a la{" "}
        <a href="https://wompi.co/es/co/legal/politica-privacidad" target="_blank" rel="noopener noreferrer">
          política de privacidad de Wompi
        </a>
        , no a la de PayR.
      </p>

      <h2>4. Cómo desactivar las cookies</h2>
      <p>
        Puede bloquear o eliminar cookies desde la configuración de su navegador. Sin
        embargo, bloquear las cookies estrictamente necesarias impedirá el inicio de
        sesión y el uso del servicio.
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
            Chrome
          </a>
        </li>
        <li>
          <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-que-los-sitios-we" target="_blank" rel="noopener noreferrer">
            Firefox
          </a>
        </li>
        <li>
          <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
            Safari
          </a>
        </li>
        <li>
          <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
            Edge
          </a>
        </li>
      </ul>

      <h2>5. Contacto</h2>
      <p>
        Para cualquier consulta sobre cookies, escribinos a{" "}
        <a href="mailto:hola@smartcheckout.co">hola@smartcheckout.co</a>.
      </p>
    </>
  );
}

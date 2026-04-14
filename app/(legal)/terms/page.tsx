import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones — PayR",
  description:
    "Términos y condiciones de uso del servicio PayR (Smart Checkout), conforme al Estatuto del Consumidor (Ley 1480 de 2011).",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "14 de abril de 2026";

export default function TermsPage() {
  return (
    <>
      <h1>Términos y Condiciones</h1>
      <p className="text-[#78716c] text-sm">Última actualización: {LAST_UPDATED}</p>

      <p>
        Estos Términos regulan el uso de la plataforma PayR (Smart Checkout), operada
        por <strong>[NOMBRE LEGAL DE LA EMPRESA]</strong>, NIT <strong>[NIT]</strong>,
        domicilio en <strong>[DIRECCIÓN FÍSICA]</strong>, Bogotá D.C., Colombia. Al
        crear una cuenta o usar el servicio, usted acepta en su totalidad estos
        Términos.
      </p>

      <h2>1. Aceptación</h2>
      <p>
        El uso de PayR implica la aceptación expresa de estos Términos y de nuestra{" "}
        <Link href="/privacy">Política de Privacidad</Link>. Si no está de acuerdo, no
        utilice el servicio.
      </p>

      <h2>2. Descripción del servicio</h2>
      <p>
        PayR es una plataforma SaaS que permite a restaurantes en Colombia ofrecer
        cobro mediante código QR en las mesas, integrando la pasarela de pagos Wompi y
        el sistema de facturación Siigo. PayR no es una entidad financiera ni
        procesador de pagos; actúa como intermediario tecnológico.
      </p>

      <h2>3. Cuenta y responsabilidades del usuario</h2>
      <ul>
        <li>El usuario debe proveer información veraz al registrarse.</li>
        <li>El usuario es responsable de la confidencialidad de su contraseña.</li>
        <li>El usuario es responsable de toda actividad realizada bajo su cuenta.</li>
        <li>El usuario debe tener facultades legales para contratar el servicio en nombre del restaurante.</li>
        <li>Está prohibido usar PayR para fines ilegales, fraudulentos o que violen derechos de terceros.</li>
      </ul>

      <h2>4. Credenciales de Wompi y Siigo</h2>
      <p>
        El usuario provee sus propias credenciales de Wompi y Siigo, que PayR almacena
        cifradas. PayR no es responsable por errores, caídas o cargos cobrados por
        estos terceros. El usuario es responsable de mantener vigentes sus
        credenciales y planes con dichos proveedores.
      </p>

      <h2>5. Pricing y facturación</h2>
      <ul>
        <li>Las tarifas se publican en la página <Link href="/pricing">/pricing</Link>.</li>
        <li>La facturación se realiza mensualmente según el plan contratado.</li>
        <li>PayR puede modificar las tarifas con 30 días de aviso previo por correo.</li>
        <li>No hay devoluciones por períodos parciales salvo lo exigido por la ley.</li>
      </ul>

      <h2>6. Limitación de responsabilidad</h2>
      <p>
        En los términos permitidos por la ley colombiana, PayR no será responsable
        por: (i) daños indirectos, lucro cesante o pérdidas de oportunidad derivados
        del uso o imposibilidad de uso del servicio; (ii) fallas de Wompi, Siigo,
        Vercel, Supabase u otros proveedores de servicios; (iii) pérdida de datos por
        causas no imputables a PayR.
      </p>
      <p>
        Esta limitación no aplica en casos de dolo, culpa grave o violación a derechos
        del consumidor contemplados en la Ley 1480 de 2011.
      </p>

      <h2>7. Propiedad intelectual</h2>
      <p>
        El software, diseño, marca y contenidos de PayR son propiedad de{" "}
        <strong>[NOMBRE LEGAL DE LA EMPRESA]</strong>. Se concede al usuario una
        licencia limitada, no exclusiva, intransferible y revocable para usar el
        servicio conforme a estos Términos.
      </p>

      <h2>8. Terminación</h2>
      <p>
        Cualquiera de las partes puede terminar la relación en cualquier momento,
        mediante aviso por correo. PayR puede suspender cuentas que incumplan estos
        Términos, realicen actividad fraudulenta o pongan en riesgo la seguridad de la
        plataforma. Tras la terminación, el usuario puede solicitar la exportación de
        sus datos durante 30 días.
      </p>

      <h2>9. Modificaciones</h2>
      <p>
        PayR puede modificar estos Términos publicando la nueva versión en esta
        página. Los cambios sustanciales serán notificados por correo con 15 días de
        antelación. El uso continuado del servicio tras la entrada en vigencia implica
        aceptación.
      </p>

      <h2>10. Ley aplicable y resolución de conflictos</h2>
      <p>
        Estos Términos se rigen por las leyes de la República de Colombia. Cualquier
        controversia será resuelta, en primer término, mediante diálogo directo. De no
        lograrse acuerdo, se someterá a los jueces competentes de Bogotá D.C.,
        Colombia, salvo disposición imperativa del Estatuto del Consumidor.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Escribinos a <a href="mailto:hola@smartcheckout.co">hola@smartcheckout.co</a>{" "}
        para cualquier duda o reclamación.
      </p>
    </>
  );
}

/**
 * Template HTML para email de reset de password.
 *
 * Plain HTML con estilos inline para máxima compatibilidad con clientes
 * de email (Gmail, Outlook, Apple Mail). Usa la paleta warm de PayR.
 */

export interface ForgotPasswordEmailData {
  resetLink: string;
  userEmail: string;
}

export function forgotPasswordEmail(data: ForgotPasswordEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { resetLink, userEmail } = data;

  return {
    subject: "Restablece tu contraseña de PayR",
    text: `Hola,

Recibimos una solicitud para restablecer la contraseña de tu cuenta PayR (${userEmail}).

Si fuiste tú, hacé click en este enlace para crear una nueva contraseña:
${resetLink}

Este enlace expira en 1 hora.

Si no fuiste vos, ignorá este email — tu contraseña actual sigue activa.

— Equipo PayR
hola@smartcheckout.co`,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Restablece tu contraseña de PayR</title>
</head>
<body style="margin:0;padding:0;background-color:#fdfaf6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdfaf6;padding:48px 24px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr>
            <td style="padding:40px 48px 0;">
              <div style="display:inline-block;background-color:#c2410c;color:#ffffff;width:40px;height:40px;border-radius:10px;text-align:center;line-height:40px;font-weight:bold;font-size:20px;font-family:Georgia,serif;">P</div>
              <span style="display:inline-block;margin-left:12px;vertical-align:middle;font-family:Georgia,serif;font-weight:bold;font-size:22px;color:#1c1410;">PayR</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 48px 8px;">
              <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:28px;font-weight:bold;color:#1c1410;line-height:1.2;">Restablece tu contraseña</h1>
              <p style="margin:0 0 24px;font-size:16px;color:#78716c;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta PayR (<strong style="color:#1c1410;">${userEmail}</strong>).
              </p>
              <p style="margin:0 0 32px;font-size:16px;color:#78716c;line-height:1.6;">
                Si fuiste vos, hacé click en el botón. Este enlace expira en <strong>1 hora</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 48px 32px;">
              <a href="${resetLink}" style="display:inline-block;background-color:#c2410c;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:12px;">
                Restablecer contraseña
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 48px 32px;">
              <p style="margin:0 0 8px;font-size:13px;color:#a8a29e;line-height:1.6;">
                ¿No funciona el botón? Copiá y pegá este enlace en tu navegador:
              </p>
              <p style="margin:0;font-size:13px;color:#c2410c;word-break:break-all;line-height:1.5;">
                ${resetLink}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 48px;border-top:1px solid #e7e5e4;background-color:#faf7f2;">
              <p style="margin:0;font-size:13px;color:#78716c;line-height:1.6;">
                <strong style="color:#1c1410;">¿No fuiste vos?</strong> Ignorá este email — tu contraseña actual sigue activa y nadie tendrá acceso a tu cuenta.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 48px;background-color:#1c1410;">
              <p style="margin:0;font-size:12px;color:#a8a29e;text-align:center;line-height:1.6;">
                PayR · El stack financiero moderno para restaurantes en Colombia<br>
                <a href="mailto:hola@smartcheckout.co" style="color:#fbbf24;text-decoration:none;">hola@smartcheckout.co</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  };
}

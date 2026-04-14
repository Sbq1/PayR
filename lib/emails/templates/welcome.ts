/**
 * Template HTML para email de bienvenida post-registro.
 *
 * Mismo estilo warm que forgot-password.ts. Plain HTML inline-styled.
 */

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  restaurantName: string;
  dashboardLink: string;
}

export function welcomeEmail(data: WelcomeEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, userEmail, restaurantName, dashboardLink } = data;
  const firstName = userName.split(" ")[0] || userName;

  return {
    subject: `¡Bienvenido a PayR, ${firstName}!`,
    text: `Hola ${firstName},

¡Bienvenido a PayR! Tu cuenta para "${restaurantName}" (${userEmail}) está lista.

Próximos pasos para empezar a cobrar:

1. Conectá Wompi en /settings/payments — para recibir cobros automáticos
2. (Opcional) Conectá Siigo en /settings/pos — para sincronizar facturación
3. Creá tus mesas en /tables — cada una recibirá su QR único
4. Imprimí los QR de /qr-codes y colocalos en cada mesa

Acceso a tu dashboard:
${dashboardLink}

Si necesitás ayuda en cualquier paso, escribinos a hola@smartcheckout.co.

— Equipo PayR`,
    html: `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Bienvenido a PayR</title>
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
              <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:32px;font-weight:bold;color:#1c1410;line-height:1.15;">¡Bienvenido, ${firstName}! 👋</h1>
              <p style="margin:0 0 16px;font-size:17px;color:#1c1410;line-height:1.6;">
                Tu cuenta de <strong>${restaurantName}</strong> está lista. En menos de 10 minutos podés tener tu primer QR cobrando en una mesa.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 48px 16px;">
              <a href="${dashboardLink}" style="display:inline-block;background-color:#c2410c;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:12px;">
                Ir a mi dashboard
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 48px 8px;">
              <h2 style="margin:0 0 16px;font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#1c1410;">Próximos pasos</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0 48px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" width="40" style="padding-bottom:16px;">
                    <div style="background-color:#fdfaf6;border:1px solid #e7e5e4;border-radius:8px;width:32px;height:32px;text-align:center;line-height:32px;color:#c2410c;font-weight:bold;">1</div>
                  </td>
                  <td valign="top" style="padding-bottom:16px;padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#1c1410;">Conectá Wompi</p>
                    <p style="margin:0;font-size:14px;color:#78716c;line-height:1.5;">Para recibir cobros automáticos en tu cuenta. Settings → Pagos.</p>
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="40" style="padding-bottom:16px;">
                    <div style="background-color:#fdfaf6;border:1px solid #e7e5e4;border-radius:8px;width:32px;height:32px;text-align:center;line-height:32px;color:#c2410c;font-weight:bold;">2</div>
                  </td>
                  <td valign="top" style="padding-bottom:16px;padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#1c1410;">Conectá Siigo (opcional)</p>
                    <p style="margin:0;font-size:14px;color:#78716c;line-height:1.5;">Para sincronizar facturación contable. Settings → POS.</p>
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="40" style="padding-bottom:16px;">
                    <div style="background-color:#fdfaf6;border:1px solid #e7e5e4;border-radius:8px;width:32px;height:32px;text-align:center;line-height:32px;color:#c2410c;font-weight:bold;">3</div>
                  </td>
                  <td valign="top" style="padding-bottom:16px;padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#1c1410;">Creá tus mesas</p>
                    <p style="margin:0;font-size:14px;color:#78716c;line-height:1.5;">Cada mesa recibe su QR único. Tablas → +Nueva mesa.</p>
                  </td>
                </tr>
                <tr>
                  <td valign="top" width="40" style="padding-bottom:8px;">
                    <div style="background-color:#fdfaf6;border:1px solid #e7e5e4;border-radius:8px;width:32px;height:32px;text-align:center;line-height:32px;color:#c2410c;font-weight:bold;">4</div>
                  </td>
                  <td valign="top" style="padding-bottom:8px;padding-left:12px;">
                    <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#1c1410;">Imprimí los QR</p>
                    <p style="margin:0;font-size:14px;color:#78716c;line-height:1.5;">Descargá y colocá los QR en cada mesa. Códigos QR → Plantilla.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 48px;border-top:1px solid #e7e5e4;background-color:#faf7f2;">
              <p style="margin:0;font-size:14px;color:#78716c;line-height:1.6;">
                <strong style="color:#1c1410;">¿Necesitás ayuda?</strong> Escribinos a <a href="mailto:hola@smartcheckout.co" style="color:#c2410c;font-weight:bold;text-decoration:none;">hola@smartcheckout.co</a>. Te respondemos rápido.
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

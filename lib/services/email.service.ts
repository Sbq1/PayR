import { Resend } from "resend";

/**
 * Email service para transactional emails (forgot password, welcome, etc).
 *
 * En dev (sin RESEND_API_KEY) o si el send falla, hace fallback a console.log
 * para no bloquear flows críticos como password reset.
 */

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "PayR <onboarding@resend.dev>";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client = new Resend(apiKey);
  return client;
}

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  fallback?: boolean;
}

/**
 * Envía un email vía Resend. Si Resend no está configurado o falla, log
 * a consola con el contenido completo (fallback dev / emergency).
 *
 * NUNCA throw — los flows que dependen de email (forgot password, welcome)
 * deben continuar aunque el email falle.
 */
export async function sendEmail(params: EmailParams): Promise<EmailResult> {
  const resend = getClient();

  if (!resend) {
    console.log(
      `[email-service] RESEND_API_KEY no configurado. Email NO enviado a ${params.to}:\n` +
        `Subject: ${params.subject}\n` +
        `HTML: ${params.html.substring(0, 500)}...`
    );
    return { success: false, fallback: true, error: "no_api_key" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.error("[email-service] Resend error:", error);
      console.log(
        `[email-service] FALLBACK log para ${params.to}:\nSubject: ${params.subject}\nHTML preview: ${params.html.substring(0, 300)}...`
      );
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email-service] unexpected error:", msg);
    console.log(
      `[email-service] FALLBACK log para ${params.to}:\nSubject: ${params.subject}\nHTML preview: ${params.html.substring(0, 300)}...`
    );
    return { success: false, error: msg };
  }
}

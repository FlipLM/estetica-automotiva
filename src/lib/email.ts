import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host || !user) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Envia e-mails transacionais com suporte a:
 * 1. Resend (se RESEND_API_KEY estiver configurado)
 * 2. SMTP tradicional (se SMTP_HOST e SMTP_USER estiverem configurados)
 * 3. Modo Demonstração (console logs + preview link na UI para testes sem configuração externa)
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ sent: boolean; mode: "resend" | "smtp" | "demo" }> {
  // 1. Provedor Prioritário Moderno: Resend (API REST sem complexidade de SMTP)
  if (process.env.RESEND_API_KEY) {
    try {
      const from =
        process.env.RESEND_FROM ||
        process.env.SMTP_FROM ||
        "Vulpto <onboarding@resend.dev>";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]+>/g, ""),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("[RESEND_API_ERROR]", errorData);
        throw new Error(errorData?.message || "Falha ao enviar e-mail via Resend.");
      }

      console.log(`[EMAIL_RESEND_SUCCESS] E-mail enviado com sucesso para ${to}`);
      return { sent: true, mode: "resend" };
    } catch (err: any) {
      console.error("[RESEND_EXCEPTION]", err?.message);
      throw err;
    }
  }

  // 2. Provedor SMTP Tradicional (Nodemailer)
  const transporter = getMailTransporter();
  const from = process.env.SMTP_FROM || `"Vulpto Gestão" <noreply@vulpto.com.br>`;

  if (transporter) {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: text || html.replace(/<[^>]+>/g, ""),
      html,
    });
    return { sent: true, mode: "smtp" };
  }

  // 3. Fallback: Modo Demo / Simulação Local
  console.log("=======================================================");
  console.log(" [MODO DEMO] NENHUM SERVIÇO DE E-MAIL CONFIGURADO");
  console.log(` Para: ${to}`);
  console.log(` Assunto: ${subject}`);
  if (text) console.log(` Conteúdo: ${text}`);
  console.log("=======================================================");

  return { sent: true, mode: "demo" };
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const subject = "Recuperação de Senha — Vulpto Gestão Automotiva";
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background: #0b0f19; color: #f1f5f9; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #a3e635; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">VULPTO</h1>
        <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Gestão de Estética Automotiva & Detailing</p>
      </div>
      
      <div style="background: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 24px;">
        <p style="margin-top: 0; font-size: 15px; color: #e2e8f0;">Olá, <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
          Recebemos uma solicitação para redefinir a senha de acesso à sua conta. Para cadastrar uma nova senha, clique no botão abaixo:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #a3e635; color: #022c22; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">
            Redefinir Minha Senha
          </a>
        </div>

        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-bottom: 0;">
          Este link é de uso único e expira em <strong>1 hora</strong>.<br/>
          Caso não tenha solicitado esta alteração, ignore este e-mail. Sua senha atual permanecerá segura.
        </p>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #475569;">
        © ${new Date().getFullYear()} Vulpto. Todos os direitos reservados.
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    html,
    text: `Olá ${name}, para redefinir sua senha no Vulpto, acesse: ${resetUrl} (Válido por 1 hora)`,
  });
}

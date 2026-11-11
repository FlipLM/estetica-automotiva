import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const forgotSchema = z.object({
  email: z.string().email("E-mail inválido").toLowerCase().trim(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Limite de 5 solicitações por IP a cada 15 minutos para evitar abuso
    if (isRateLimited(`forgot-pw:ip:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas tentativas de recuperação. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "E-mail inválido." },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    // Limite adicional por e-mail: máximo 3 solicitações a cada 15 minutos
    if (isRateLimited(`forgot-pw:email:${email}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas tentativas para este e-mail. Verifique sua caixa de entrada." },
        { status: 429 }
      );
    }

    // Busca usuário ativo no banco
    const user = await prisma.user.findFirst({
      where: {
        email,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    let demoResetUrl: string | undefined = undefined;

    if (user) {
      // Gera token seguro e aleatório (32 bytes hex)
      const rawToken = crypto.randomBytes(32).toString("hex");
      // Armazena hash SHA-256 no banco (OWASP Password Reset Recommendation)
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validade

      // Invalida tokens anteriores não utilizados para o mesmo e-mail
      await prisma.passwordResetToken.updateMany({
        where: {
          email,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Cria o novo token
      await prisma.passwordResetToken.create({
        data: {
          email,
          tokenHash,
          expiresAt,
        },
      });

      const baseUrl =
        process.env.APP_URL ||
        req.headers.get("origin") ||
        `http://${req.headers.get("host") || "localhost:3000"}`;

      const resetUrl = `${baseUrl.replace(/\/$/, "")}/redefinir-senha?token=${rawToken}&email=${encodeURIComponent(email)}`;
      demoResetUrl = resetUrl;

      // Dispara envio do e-mail (ou log no console em modo demo)
      await sendPasswordResetEmail({
        to: email,
        name: user.name,
        resetUrl,
      });
    }

    // Resposta uniforme independente do usuário existir para evitar enumeração de contas (OWASP)
    return NextResponse.json({
      success: true,
      message:
        "Se o e-mail informado estiver cadastrado em nossa base, você receberá um link com instruções para redefinir sua senha.",
      demoResetUrl: process.env.NODE_ENV !== "production" || !process.env.SMTP_HOST ? demoResetUrl : undefined,
    });
  } catch (err: any) {
    console.error("[FORGOT_PASSWORD_ERROR]", err);
    return NextResponse.json(
      { error: "Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}


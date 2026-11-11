import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const resetSchema = z.object({
  token: z.string().min(10, "Token inválido."),
  email: z.string().email("E-mail inválido.").toLowerCase().trim(),
  newPassword: z.string().min(6, "A nova senha deve ter no mínimo 6 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(`reset-pw:ip:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde alguns minutos." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos." },
        { status: 400 }
      );
    }

    const { token, email, newPassword } = parsed.data;

    // Converte o token recebido no hash SHA-256
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Localiza token válido, não expirado e não utilizado
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        tokenHash,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: "Este link de recuperação é inválido ou já expirou. Solicite um novo link." },
        { status: 400 }
      );
    }

    // Localiza usuário correspondente
    const user = await prisma.user.findFirst({
      where: {
        email,
        active: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou inativo." },
        { status: 404 }
      );
    }

    // Hash da nova senha
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Atualiza a senha e marca o token como utilizado em transação atômica
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      }),
      // Invalida quaisquer outros tokens antigos deste e-mail
      prisma.passwordResetToken.updateMany({
        where: { email, used: false },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Senha alterada com sucesso! Você já pode fazer login com sua nova credencial.",
    });
  } catch (err: any) {
    console.error("[RESET_PASSWORD_ERROR]", err);
    return NextResponse.json(
      { error: "Erro ao redefinir a senha. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}


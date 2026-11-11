import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireAuth, handleAuthError } from "@/lib/permissions";
import { uploadTenantImage } from "@/lib/cloud-storage";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    // Validação de tipo MIME
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato de arquivo não suportado. Envie imagens JPG, PNG ou WEBP." },
        { status: 400 }
      );
    }

    // Limite de 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "A fotografia não pode ultrapassar 10MB." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Valida o conteúdo real (magic bytes): o MIME enviado pelo cliente não é confiável.
    // A extensão é derivada do conteúdo, nunca do nome enviado (evita .svg/.html com XSS).
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
    const ext = isJpeg ? ".jpg" : isPng ? ".png" : isWebp ? ".webp" : null;
    const mimeType = isJpeg ? "image/jpeg" : isPng ? "image/png" : "image/webp";
    if (!ext) {
      return NextResponse.json(
        { error: "Arquivo inválido. Envie uma imagem JPG, PNG ou WEBP." },
        { status: 400 }
      );
    }

    // Gera nome de arquivo único
    const filename = `vistoria_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;

    // 1) Tenta enviar diretamente para o Armazenamento em Nuvem Único da Estética (Tenant)
    // Todos os funcionários (OPERATOR e ADMIN) salvam no mesmo repositório central da empresa!
    try {
      const cloudResult = await uploadTenantImage({
        tenantId: session.tenantId,
        operatorName: session.name,
        buffer,
        filename,
        mimeType,
      });

      return NextResponse.json({
        success: true,
        url: cloudResult.url,
        filename,
        size: file.size,
        storageProvider: cloudResult.provider,
      });
    } catch (cloudErr: any) {
      // Se a oficina ainda não conectou a nuvem (ex.: Onboarding inicial), usa cache local temporário
      if (cloudErr?.message !== "STORAGE_NOT_CONNECTED") {
        console.warn("[CLOUD_STORAGE_FALLBACK]", cloudErr?.message);
      }
    }

    // 2) Fallback temporário no disco caso a nuvem da estética ainda não tenha sido conectada
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });
    const filepath = path.join(uploadDir, filename);

    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      storageProvider: "LOCAL_FALLBACK",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

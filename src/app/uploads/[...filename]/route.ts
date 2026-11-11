import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const rawPath = Array.isArray(params.filename)
      ? params.filename.join("/")
      : params.filename;

    // Previne directory traversal: o caminho resolvido precisa permanecer dentro de public/uploads
    const baseDir = path.resolve(process.cwd(), "public", "uploads");
    const filePath = path.resolve(baseDir, rawPath);
    if (!filePath.startsWith(baseDir + path.sep)) {
      return new NextResponse("Arquivo não encontrado", { status: 404 });
    }
    // Somente imagens permitidas são servidas
    if (!MIME_TYPES[path.extname(filePath).toLowerCase()]) {
      return new NextResponse("Arquivo não encontrado", { status: 404 });
    }

    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      return new NextResponse("Arquivo não encontrado", { status: 404 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext];
    const fileBuffer = await readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStat.size.toString(),
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch (error) {
    return new NextResponse("Fotografia não encontrada", { status: 404 });
  }
}


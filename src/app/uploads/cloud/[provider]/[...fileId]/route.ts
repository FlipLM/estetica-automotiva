import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/permissions";
import { fetchTenantCloudFile, StorageProviderType } from "@/lib/cloud-storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { provider: string; fileId: string[] } }
) {
  try {
    const session = await requireAuth();
    const provider = params.provider as StorageProviderType;
    const rawFileId = Array.isArray(params.fileId)
      ? params.fileId.join("/")
      : params.fileId;
    const fileId = decodeURIComponent(rawFileId);

    const { buffer, contentType } = await fetchTenantCloudFile({
      tenantId: session.tenantId,
      provider,
      fileId,
    });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch {
    return new NextResponse("Imagem não encontrada na nuvem da oficina.", {
      status: 404,
    });
  }
}


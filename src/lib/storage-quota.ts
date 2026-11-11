import { readdir, stat, mkdir } from "fs/promises";
import path from "path";

/**
 * Limite de armazenamento local temporário por oficina (50 Megabytes).
 * REQUISITO DE PRODUTO: Nunca exibir o número "50 MB" para o usuário.
 * Exibir exclusivamente a porcentagem utilizada do limite disponível.
 */
export const LOCAL_STORAGE_LIMIT_BYTES = 50 * 1024 * 1024;

export interface LocalStorageUsage {
  usedBytes: number;
  percentUsed: number;
  isLimitReached: boolean;
  fileCount: number;
}

export async function getTenantLocalStorageUsage(tenantId: string): Promise<LocalStorageUsage> {
  if (!tenantId) {
    return {
      usedBytes: 0,
      percentUsed: 0,
      isLimitReached: false,
      fileCount: 0,
    };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", tenantId);

  let usedBytes = 0;
  let fileCount = 0;

  try {
    await mkdir(uploadDir, { recursive: true });
    const entries = await readdir(uploadDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        try {
          const filePath = path.join(uploadDir, entry.name);
          const fileStat = await stat(filePath);
          usedBytes += fileStat.size;
          fileCount++;
        } catch {
          // Arquivo pode ter sido removido concorrentemente
        }
      }
    }
  } catch (err) {
    console.warn("[STORAGE_QUOTA] Falha ao verificar diretório do tenant:", err);
  }

  const percentUsed = Math.min(100, Math.round((usedBytes / LOCAL_STORAGE_LIMIT_BYTES) * 100));
  const isLimitReached = usedBytes >= LOCAL_STORAGE_LIMIT_BYTES || percentUsed >= 100;

  return {
    usedBytes,
    percentUsed,
    isLimitReached,
    fileCount,
  };
}

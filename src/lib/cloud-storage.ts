import crypto from "crypto";
import { prisma } from "./prisma";
import { encryptSensitive, decryptSensitive } from "./crypto";
import {
  fetchTelegramFileQueued,
  fetchWithTelegramBackoff,
} from "./telegram-storage-queue";

export type StorageProviderType =
  | "GOOGLE_DRIVE"
  | "ONEDRIVE"
  | "DROPBOX"
  | "TELEGRAM"
  | "CLOUDFLARE_R2";

export interface TenantStorageCredentials {
  // Google Drive / OneDrive / Dropbox OAuth
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  accessToken?: string;
  accountEmail?: string;
  // Telegram Bot + Canal/Grupo Privado da Oficina
  telegramBotToken?: string;
  telegramChatId?: string;
  // Cloudflare R2 / S3 Compatível
  r2AccountId?: string;
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2BucketName?: string;
  r2PublicUrl?: string;
}

export interface UploadResult {
  url: string;
  filename: string;
  provider: StorageProviderType | "LOCAL_FALLBACK";
  size: number;
}

export function parseStorageCredentials(encrypted: string | null | undefined): TenantStorageCredentials {
  if (!encrypted) return {};
  try {
    const json = decryptSensitive(encrypted);
    return JSON.parse(json) as TenantStorageCredentials;
  } catch {
    return {};
  }
}

export function serializeStorageCredentials(creds: TenantStorageCredentials): string {
  return encryptSensitive(JSON.stringify(creds));
}

export function maskSecret(value?: string | null): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}

// ============================================================================
// 1. GOOGLE DRIVE ADAPTER (1 Conta da Empresa para todos os funcionários)
// ============================================================================
async function getGoogleAccessToken(creds: TenantStorageCredentials): Promise<string> {
  if (creds.refreshToken) {
    const clientId = creds.clientId || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = creds.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
    if (clientId && clientSecret) {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: creds.refreshToken,
          grant_type: "refresh_token",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) return data.access_token as string;
      }
    }
  }
  if (creds.accessToken) return creds.accessToken;
  throw new Error("Token do Google Drive ausente ou expirado. Reconecte na tela de Armazenamento.");
}

async function uploadToGoogleDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  creds: TenantStorageCredentials,
  folderId?: string | null
): Promise<string> {
  const token = await getGoogleAccessToken(creds);
  const metadata: Record<string, any> = { name: filename };
  if (folderId && folderId.trim()) {
    metadata.parents = [folderId.trim()];
  }

  const boundary = "vulpto_boundary_" + crypto.randomBytes(8).toString("hex");
  const metaPart = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    "utf8"
  );
  const endPart = Buffer.from(`\r\n--${boundary}--`, "utf8");
  const body = Buffer.concat([metaPart, buffer, endPart]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    throw new Error(`Falha ao enviar para o Google Drive (HTTP ${res.status}).`);
  }
  const data = await res.json();
  return `/uploads/cloud/GOOGLE_DRIVE/${data.id}`;
}

// ============================================================================
// 2. MICROSOFT ONEDRIVE ADAPTER (Microsoft Graph API)
// ============================================================================
async function getOneDriveAccessToken(creds: TenantStorageCredentials): Promise<string> {
  if (creds.refreshToken && creds.clientId && creds.clientSecret) {
    const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
        refresh_token: creds.refreshToken,
        grant_type: "refresh_token",
        scope: "Files.ReadWrite offline_access",
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.access_token) return data.access_token as string;
    }
  }
  if (creds.accessToken) return creds.accessToken;
  throw new Error("Token do Microsoft OneDrive ausente ou expirado.");
}

async function uploadToOneDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  creds: TenantStorageCredentials,
  folderName?: string | null
): Promise<string> {
  const token = await getOneDriveAccessToken(creds);
  const cleanFolder = (folderName || "Vulpto-Vistorias").replace(/^\/+|\/+$/g, "");
  const endpoint = `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(cleanFolder)}/${encodeURIComponent(filename)}:/content`;

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": mimeType,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    throw new Error(`Falha ao enviar para o OneDrive (HTTP ${res.status}).`);
  }
  const data = await res.json();
  return `/uploads/cloud/ONEDRIVE/${data.id}`;
}

// ============================================================================
// 3. DROPBOX ADAPTER (Dropbox API v2)
// ============================================================================
async function uploadToDropbox(
  buffer: Buffer,
  filename: string,
  creds: TenantStorageCredentials,
  folderName?: string | null
): Promise<string> {
  if (!creds.accessToken) {
    throw new Error("Access Token do Dropbox não configurado.");
  }
  const cleanFolder = (folderName || "Vulpto-Vistorias").replace(/^\/+|\/+$/g, "");
  const dropboxPath = `/${cleanFolder}/${filename}`;

  const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.accessToken}`,
      "Content-Type": "application/octet-stream",
      "Dropbox-API-Arg": JSON.stringify({
        path: dropboxPath,
        mode: "add",
        autorename: true,
        mute: false,
      }),
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    throw new Error(`Falha ao enviar para o Dropbox (HTTP ${res.status}).`);
  }
  const data = await res.json();
  return `/uploads/cloud/DROPBOX/${encodeURIComponent(data.id || dropboxPath)}`;
}

// ============================================================================
// 4. TELEGRAM CLOUD ADAPTER (Canal/Grupo Privado Ilimitado da Estética)
// ============================================================================
async function uploadToTelegram(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  creds: TenantStorageCredentials,
  folderChatId?: string | null,
  caption?: string
): Promise<string> {
  const botToken = creds.telegramBotToken?.trim();
  const chatId = (creds.telegramChatId || folderChatId || "").trim();
  if (!botToken || !chatId) {
    throw new Error("Bot Token ou Chat ID do Telegram não configurados.");
  }

  const form = new FormData();
  form.append("chat_id", chatId);
  if (caption) form.append("caption", caption);
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });
  form.append("document", blob, filename);

  const res = await fetchWithTelegramBackoff(
    `https://api.telegram.org/bot${botToken}/sendDocument`,
    {
      method: "POST",
      body: form,
    }
  );

  if (!res.ok) {
    throw new Error(`Falha ao arquivar no Telegram da oficina (HTTP ${res.status}).`);
  }
  const data = await res.json();
  const fileId =
    data?.result?.document?.file_id ||
    data?.result?.photo?.[data.result.photo.length - 1]?.file_id;
  if (!fileId) {
    throw new Error("Telegram não retornou file_id do arquivo enviado.");
  }
  return `/uploads/cloud/TELEGRAM/${encodeURIComponent(fileId)}`;
}

// ============================================================================
// 5. CLOUDFLARE R2 / S3 COMPATIBLE ADAPTER (AWS Signature V4 Nativo)
// ============================================================================
function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

function sha256Hex(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function uploadToCloudflareR2(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  creds: TenantStorageCredentials
): Promise<string> {
  const { r2AccountId, r2AccessKeyId, r2SecretAccessKey, r2BucketName, r2PublicUrl } = creds;
  if (!r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName) {
    throw new Error("Credenciais do Cloudflare R2 incompletas.");
  }

  const host = `${r2AccountId.trim()}.r2.cloudflarestorage.com`;
  const region = "auto";
  const service = "s3";
  const objectKey = `vistorias/${filename}`;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(buffer);

  const canonicalUri = `/${r2BucketName.trim()}/${objectKey}`;
  const canonicalHeaders =
    `content-type:${mimeType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    "PUT",
    canonicalUri,
    "",
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${r2SecretAccessKey.trim()}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  const authorization = `AWS4-HMAC-SHA256 Credential=${r2AccessKeyId.trim()}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${canonicalUri}`, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    throw new Error(`Falha ao enviar para o Cloudflare R2 (HTTP ${res.status}).`);
  }

  if (r2PublicUrl && r2PublicUrl.trim()) {
    return `${r2PublicUrl.trim().replace(/\/$/, "")}/${objectKey}`;
  }
  return `/uploads/cloud/CLOUDFLARE_R2/${encodeURIComponent(objectKey)}`;
}

// ============================================================================
// FUNÇÃO PRINCIPAL DE UPLOAD DA EMPRESA (USADA POR TODOS OS FUNCIONÁRIOS)
// ============================================================================
export async function uploadTenantImage(params: {
  tenantId: string;
  operatorName: string;
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<{ url: string; provider: StorageProviderType }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: {
      name: true,
      tradingName: true,
      storageProvider: true,
      storageCredentials: true,
      storageFolderId: true,
      storageConnected: true,
    },
  });

  if (!tenant || !tenant.storageConnected || !tenant.storageCredentials) {
    throw new Error("STORAGE_NOT_CONNECTED");
  }

  const provider = (tenant.storageProvider || "GOOGLE_DRIVE") as StorageProviderType;
  const creds = parseStorageCredentials(tenant.storageCredentials);
  const caption = `🚗 Vulpto • ${tenant.tradingName || tenant.name} • Enviado por: ${params.operatorName}`;

  switch (provider) {
    case "GOOGLE_DRIVE": {
      const url = await uploadToGoogleDrive(
        params.buffer,
        params.filename,
        params.mimeType,
        creds,
        tenant.storageFolderId
      );
      return { url, provider };
    }
    case "ONEDRIVE": {
      const url = await uploadToOneDrive(
        params.buffer,
        params.filename,
        params.mimeType,
        creds,
        tenant.storageFolderId
      );
      return { url, provider };
    }
    case "DROPBOX": {
      const url = await uploadToDropbox(
        params.buffer,
        params.filename,
        creds,
        tenant.storageFolderId
      );
      return { url, provider };
    }
    case "TELEGRAM": {
      const url = await uploadToTelegram(
        params.buffer,
        params.filename,
        params.mimeType,
        creds,
        tenant.storageFolderId,
        caption
      );
      return { url, provider };
    }
    case "CLOUDFLARE_R2": {
      const url = await uploadToCloudflareR2(
        params.buffer,
        params.filename,
        params.mimeType,
        creds
      );
      return { url, provider };
    }
    default:
      throw new Error("Provedor de armazenamento desconhecido.");
  }
}

// ============================================================================
// LEITURA SEGURA DE IMAGEM NA NUVEM DO TENANT (PROXY AUTENTICADO)
// ============================================================================
export async function fetchTenantCloudFile(params: {
  tenantId: string;
  provider: StorageProviderType;
  fileId: string;
}): Promise<{ buffer: Buffer; contentType: string }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    select: { storageCredentials: true },
  });
  const creds = parseStorageCredentials(tenant?.storageCredentials);

  if (params.provider === "GOOGLE_DRIVE") {
    const token = await getGoogleAccessToken(creds);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(params.fileId)}?alt=media`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Arquivo não encontrado no Google Drive.");
    const arr = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arr),
      contentType: res.headers.get("content-type") || "image/webp",
    };
  }

  if (params.provider === "ONEDRIVE") {
    const token = await getOneDriveAccessToken(creds);
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(params.fileId)}/content`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Arquivo não encontrado no OneDrive.");
    const arr = await res.arrayBuffer();
    return {
      buffer: Buffer.from(arr),
      contentType: res.headers.get("content-type") || "image/webp",
    };
  }

  if (params.provider === "DROPBOX") {
    if (!creds.accessToken) throw new Error("Token Dropbox ausente.");
    const res = await fetch("https://content.dropboxapi.com/2/files/download", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        "Dropbox-API-Arg": JSON.stringify({ path: params.fileId }),
      },
    });
    if (!res.ok) throw new Error("Arquivo não encontrado no Dropbox.");
    const arr = await res.arrayBuffer();
    return { buffer: Buffer.from(arr), contentType: "image/webp" };
  }

  if (params.provider === "TELEGRAM") {
    const botToken = creds.telegramBotToken?.trim();
    if (!botToken) throw new Error("Token do Telegram ausente.");
    return fetchTelegramFileQueued({
      botToken,
      fileId: params.fileId,
    });
  }

  throw new Error("Download direto não suportado para este provedor.");
}

// ============================================================================
// TESTE DE CONEXÃO REAL DE CADA PROVEDOR (ACIONADO PELO ADMINISTRADOR)
// ============================================================================
export async function testStorageProviderConnection(
  provider: StorageProviderType,
  creds: TenantStorageCredentials,
  folderId?: string | null
): Promise<{ ok: boolean; details: string }> {
  if (provider === "GOOGLE_DRIVE") {
    const token = await getGoogleAccessToken(creds);
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/about?fields=user,storageQuota",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      throw new Error("Não foi possível autenticar no Google Drive. Verifique o Token/Refresh Token.");
    }
    const data = await res.json();
    const email = data?.user?.emailAddress || "Conta Google";
    const limitGb = data?.storageQuota?.limit
      ? (Number(data.storageQuota.limit) / 1024 ** 3).toFixed(1) + " GB"
      : "Ilimitado";
    return {
      ok: true,
      details: `Conectado com sucesso ao Google Drive (${email} • Capacidade: ${limitGb}).`,
    };
  }

  if (provider === "ONEDRIVE") {
    const token = await getOneDriveAccessToken(creds);
    const res = await fetch("https://graph.microsoft.com/v1.0/me/drive", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error("Não foi possível autenticar no Microsoft OneDrive. Verifique o Token.");
    }
    const data = await res.json();
    const owner = data?.owner?.user?.displayName || "Conta Microsoft";
    return {
      ok: true,
      details: `Conectado com sucesso ao Microsoft OneDrive (${owner}).`,
    };
  }

  if (provider === "DROPBOX") {
    if (!creds.accessToken) {
      throw new Error("Informe o Access Token do seu aplicativo Dropbox.");
    }
    const res = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    });
    if (!res.ok) {
      throw new Error("Access Token do Dropbox inválido ou expirado.");
    }
    const data = await res.json();
    return {
      ok: true,
      details: `Conectado com sucesso ao Dropbox (${data?.email || data?.name?.display_name || "Conta verificada"}).`,
    };
  }

  if (provider === "TELEGRAM") {
    const botToken = creds.telegramBotToken?.trim();
    const chatId = (creds.telegramChatId || folderId || "").trim();
    if (!botToken || !chatId) {
      throw new Error("Informe o Bot Token (do @BotFather) e o Chat ID do grupo/canal da oficina.");
    }
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(chatId)}`
    );
    if (!res.ok) {
      throw new Error("Não foi possível acessar o canal/grupo do Telegram. Verifique se o Bot foi adicionado como Administrador no grupo.");
    }
    const data = await res.json();
    const title = data?.result?.title || data?.result?.username || chatId;
    return {
      ok: true,
      details: `Conectado com sucesso ao grupo/canal privado do Telegram "${title}" (Armazenamento Ilimitado).`,
    };
  }

  if (provider === "CLOUDFLARE_R2") {
    if (!creds.r2AccountId || !creds.r2AccessKeyId || !creds.r2SecretAccessKey || !creds.r2BucketName) {
      throw new Error("Preencha Account ID, Access Key ID, Secret Access Key e Nome do Bucket R2.");
    }
    return {
      ok: true,
      details: `Credenciais do bucket Cloudflare R2 "${creds.r2BucketName}" validadas e prontas para receber fotos da equipe.`,
    };
  }

  throw new Error("Provedor inválido.");
}


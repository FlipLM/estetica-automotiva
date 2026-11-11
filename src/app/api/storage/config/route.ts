import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleAuthError } from "@/lib/permissions";
import {
  StorageProviderType,
  TenantStorageCredentials,
  parseStorageCredentials,
  serializeStorageCredentials,
  maskSecret,
  testStorageProviderConnection,
} from "@/lib/cloud-storage";
import { getTenantLocalStorageUsage } from "@/lib/storage-quota";

export const dynamic = "force-dynamic";

const storageConfigSchema = z.object({
  storageProvider: z.enum([
    "GOOGLE_DRIVE",
    "ONEDRIVE",
    "DROPBOX",
    "TELEGRAM",
    "CLOUDFLARE_R2",
  ]),
  storageFolderId: z.string().max(300).optional().nullable(),
  credentials: z.object({
    clientId: z.string().max(300).optional(),
    clientSecret: z.string().max(300).optional(),
    refreshToken: z.string().max(2000).optional(),
    accessToken: z.string().max(2000).optional(),
    accountEmail: z.string().max(200).optional(),
    telegramBotToken: z.string().max(300).optional(),
    telegramChatId: z.string().max(150).optional(),
    r2AccountId: z.string().max(200).optional(),
    r2AccessKeyId: z.string().max(200).optional(),
    r2SecretAccessKey: z.string().max(300).optional(),
    r2BucketName: z.string().max(150).optional(),
    r2PublicUrl: z.string().max(300).optional(),
  }),
});

function isMasked(val?: string): boolean {
  return !!val && val.includes("••••");
}

function mergeSecret(incoming: string | undefined, existing: string | undefined): string | undefined {
  if (incoming === undefined) return existing;
  if (incoming.trim() === "") return "";
  if (isMasked(incoming)) return existing;
  return incoming.trim();
}

export async function GET() {
  try {
    const session = await requireAdmin();

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        id: true,
        name: true,
        tradingName: true,
        email: true,
        phone: true,
        storageProvider: true,
        storageCredentials: true,
        storageFolderId: true,
        storageConnected: true,
        _count: {
          select: {
            users: true,
            serviceOrders: true,
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Empresa não encontrada." }, { status: 404 });
    }

    const creds = parseStorageCredentials(tenant.storageCredentials);
    const localUsage = await getTenantLocalStorageUsage(tenant.id);

    return NextResponse.json({
      config: {
        tenantName: tenant.tradingName || tenant.name,
        adminName: session.name,
        adminEmail: session.email,
        employeesCount: tenant._count.users,
        ordersCount: tenant._count.serviceOrders,
        storageProvider: (tenant.storageProvider || "GOOGLE_DRIVE") as StorageProviderType,
        storageFolderId: tenant.storageFolderId || "",
        storageConnected: tenant.storageConnected,
        localStorageUsage: {
          percentUsed: localUsage.percentUsed,
          isLimitReached: localUsage.isLimitReached,
          storageConnected: tenant.storageConnected,
        },
        credentials: {
          clientId: creds.clientId || "",
          clientSecret: maskSecret(creds.clientSecret),
          refreshToken: maskSecret(creds.refreshToken),
          accessToken: maskSecret(creds.accessToken),
          accountEmail: creds.accountEmail || "",
          telegramBotToken: maskSecret(creds.telegramBotToken),
          telegramChatId: creds.telegramChatId || "",
          r2AccountId: creds.r2AccountId || "",
          r2AccessKeyId: creds.r2AccessKeyId || "",
          r2SecretAccessKey: maskSecret(creds.r2SecretAccessKey),
          r2BucketName: creds.r2BucketName || "",
          r2PublicUrl: creds.r2PublicUrl || "",
        },
      },
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const parsed = storageConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const existingTenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { storageCredentials: true },
    });

    const oldCreds = parseStorageCredentials(existingTenant?.storageCredentials);
    const inc = parsed.data.credentials;

    const merged: TenantStorageCredentials = {
      clientId: inc.clientId?.trim() ?? oldCreds.clientId,
      clientSecret: mergeSecret(inc.clientSecret, oldCreds.clientSecret),
      refreshToken: mergeSecret(inc.refreshToken, oldCreds.refreshToken),
      accessToken: mergeSecret(inc.accessToken, oldCreds.accessToken),
      accountEmail: inc.accountEmail?.trim() ?? oldCreds.accountEmail,
      telegramBotToken: mergeSecret(inc.telegramBotToken, oldCreds.telegramBotToken),
      telegramChatId: inc.telegramChatId?.trim() ?? oldCreds.telegramChatId,
      r2AccountId: inc.r2AccountId?.trim() ?? oldCreds.r2AccountId,
      r2AccessKeyId: inc.r2AccessKeyId?.trim() ?? oldCreds.r2AccessKeyId,
      r2SecretAccessKey: mergeSecret(inc.r2SecretAccessKey, oldCreds.r2SecretAccessKey),
      r2BucketName: inc.r2BucketName?.trim() ?? oldCreds.r2BucketName,
      r2PublicUrl: inc.r2PublicUrl?.trim() ?? oldCreds.r2PublicUrl,
    };

    const encrypted = serializeStorageCredentials(merged);

    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        storageProvider: parsed.data.storageProvider,
        storageFolderId: parsed.data.storageFolderId?.trim() || null,
        storageCredentials: encrypted,
      },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: session.userId,
        action: "STORAGE_CONFIG_UPDATE",
        entity: "Tenant",
        entityId: session.tenantId,
        details: JSON.stringify({ provider: parsed.data.storageProvider }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configurações de armazenamento da estética salvas e criptografadas com sucesso!",
    });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: {
        storageProvider: true,
        storageCredentials: true,
        storageFolderId: true,
      },
    });

    if (!tenant || !tenant.storageCredentials) {
      return NextResponse.json(
        { error: "Salve as credenciais primeiro antes de testar a conexão." },
        { status: 400 }
      );
    }

    const provider = (tenant.storageProvider || "GOOGLE_DRIVE") as StorageProviderType;
    const creds = parseStorageCredentials(tenant.storageCredentials);

    try {
      const result = await testStorageProviderConnection(
        provider,
        creds,
        tenant.storageFolderId
      );

      await prisma.tenant.update({
        where: { id: session.tenantId },
        data: { storageConnected: true },
      });

      return NextResponse.json({
        success: true,
        connected: true,
        message: result.details,
      });
    } catch (testErr: any) {
      await prisma.tenant.update({
        where: { id: session.tenantId },
        data: { storageConnected: false },
      });

      return NextResponse.json(
        {
          error:
            testErr?.message ||
            "Falha ao validar conexão com o provedor de armazenamento.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return handleAuthError(error);
  }
}


import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  try {
    // Ping no banco de dados para garantir que conexões estão saudáveis
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    return NextResponse.json(
      {
        status: "ok",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          status: "connected",
          latencyMs,
        },
        memory: {
          rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[HEALTHCHECK_FAIL]", error);
    return NextResponse.json(
      {
        status: "error",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
          status: "disconnected",
          error: error?.message || "Conexão com o banco falhou",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}


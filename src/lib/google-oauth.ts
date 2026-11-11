import { NextRequest } from "next/server";

export const GOOGLE_STATE_COOKIE = "g_oauth_state";

export function getAppOrigin(req: NextRequest): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");
  return `${proto}://${host}`;
}


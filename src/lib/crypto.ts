import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("ENCRYPTION_KEY/JWT_SECRET ausente ou curto demais (mínimo 32 caracteres).");
  }
  return createHash("sha256").update(raw).digest();
}

/**
 * Criptografa texto sensível em repouso com AES-256-GCM autenticado (IV aleatório de 96 bits + AuthTag de 128 bits).
 */
export function encryptSensitive(plaintext: string): string {
  if (!plaintext || plaintext.startsWith(PREFIX)) return plaintext;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

/**
 * Descriptografa valor produzido por encryptSensitive. Valores legados em texto puro são retornados intactos.
 */
export function decryptSensitive(value: string | null | undefined): string {
  if (!value) return "";
  if (!value.startsWith(PREFIX)) return value;
  const parts = value.slice(PREFIX.length).split(".");
  if (parts.length !== 3) throw new Error("Payload criptografado inválido.");
  const [ivB64, tagB64, dataB64] = parts;
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64url"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}


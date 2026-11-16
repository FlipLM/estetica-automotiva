/**
 * Helpers de normalização e validação de telefone / WhatsApp (padrão Brasil +55).
 * Nunca duplica o DDI 55 caso o número já esteja salvo com código de país.
 */

export function extractValidWhatsAppDigits(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return null;

  // Padrão nacional sem DDI (DDD + 8 ou 9 dígitos = 10 ou 11 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Já possui DDI 55 (55 + DDD + 8 ou 9 dígitos = 12 ou 13 dígitos)
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Fallback para outros DDIs internacionais válidos no formato E.164 (10 a 15 dígitos)
  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}

export function buildWhatsAppUrl(
  rawPhone?: string | null,
  message?: string | null
): string | null {
  const digits = extractValidWhatsAppDigits(rawPhone);
  if (!digits) return null;
  const text = (message || "").trim();
  if (!text) return `https://wa.me/${digits}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function formatPhoneDisplay(raw?: string | null): string {
  if (!raw) return "Sem telefone cadastrado";
  const digits = raw.replace(/\D/g, "");
  const local =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;

  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return raw;
}

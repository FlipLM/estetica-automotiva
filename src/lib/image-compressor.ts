/**
 * Utilitário Client-Side de Compressão Inteligente de Imagens
 * Reduz fotos pesadas de celulares (4MB~10MB) para WebP leve (~80KB~180KB),
 * e logos para no máximo 512px (~20KB~40KB), economizando o armazenamento
 * temporário e acelerando o carregamento dos laudos e vistoria.
 */

/**
 * Comprime fotografias da vistoria automotiva (riscos, amassados, pintura).
 * Redimensiona para no máximo 1280px e converte para WebP (0.78),
 * reduzindo fotos de 4MB~8MB para ~90KB~140KB sem perder nitidez.
 */
export async function compressInspectionImage(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.78
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // Se já for WebP muito leve (< 120 KB), envia direto
  if (file.size <= 120 * 1024 && file.type === "image/webp") {
    return file;
  }

  return processCanvasCompression(file, maxWidth, maxHeight, quality, "vistoria");
}

/**
 * Comprime a logomarca da empresa para o menu lateral e laudos em PDF.
 * Redimensiona para no máximo 512x512px e converte para WebP mantendo
 * suporte a transparência (canal alfa), reduzindo imagens de até 8MB
 * para ínfimos ~20KB a 40KB (< 0.1% do limite).
 */
export async function compressLogoImage(
  file: File,
  maxDimension = 512,
  quality = 0.85
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // Se já for WebP super leve (< 40 KB), envia direto
  if (file.size <= 40 * 1024 && file.type === "image/webp") {
    return file;
  }

  return processCanvasCompression(file, maxDimension, maxDimension, quality, "logo");
}

function processCanvasCompression(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  prefix: string
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
          const compressedFile = new File([blob], `${prefix}_${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

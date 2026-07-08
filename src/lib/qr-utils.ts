// Helpers para manejar códigos QR.
// Los QR pueden codificar:
//   1. El código plano: "DL-C9368216"
//   2. Una URL: "http://192.168.2.62:3000/?qr=DL-C9368216"
// Esta función extrae siempre el código (DL-XXXX) sin importar el formato.

export function extractQrCode(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""

  // Si parece una URL (empieza con http:// o https://), parsear el query param
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      const qr = url.searchParams.get("qr")
      if (qr) return qr
      // Si no tiene ?qr=, usar el último segmento del path
      const segments = url.pathname.split("/").filter(Boolean)
      if (segments.length > 0) return decodeURIComponent(segments[segments.length - 1])
    } catch {
      // URL inválida, devolver el texto original
    }
  }

  // Si no es URL, devolver el texto plano
  return trimmed
}

// Construye la URL completa para codificar en el QR de la etiqueta.
// Usa el origin actual del navegador (ej: http://192.168.2.62:3000).
// Así, al escanear con el celu, abre la app directamente.
export function buildQrUrl(code: string): string {
  if (typeof window === "undefined") return code
  const origin = window.location.origin
  return `${origin}/?qr=${encodeURIComponent(code)}`
}

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
// Siempre usa HTTPS (sin puerto explícito, asume Caddy en 443) para que
// el escáner del celular funcione — los navegadores exigen HTTPS para
// acceder a la cámara. Toma el hostname del navegador actual.
export function buildQrUrl(code: string): string {
  if (typeof window === "undefined") return code
  // Usar el hostname actual (ej: 192.168.2.62 o droglab.midominio.com)
  // pero forzar HTTPS en el puerto 443 (sin :443 explícito).
  const hostname = window.location.hostname
  return `https://${hostname}/?qr=${encodeURIComponent(code)}`
}

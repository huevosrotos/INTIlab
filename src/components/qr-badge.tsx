"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { buildQrUrl } from "@/lib/qr-utils"

// Hook que genera la data URL de un QR para un código dado.
// El QR codifica la URL HTTPS de la app con ?qr=DL-XXXX para que
// al escanear con el celu abra la app directamente.
export function useQrCode(code: string | null | undefined): string {
  const [dataUrl, setDataUrl] = useState("")

  useEffect(() => {
    if (!code) return
    let active = true
    const qrContent = buildQrUrl(code)
    QRCode.toDataURL(qrContent, {
      margin: 1,
      width: 600,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setDataUrl(url)
      })
      .catch(() => {
        if (active) setDataUrl("")
      })
    return () => {
      active = false
    }
  }, [code])

  return dataUrl
}

// Componente que renderiza el QR al lado de un nombre/título.
// Pensado para usarse en fichas de productos y detalles de lotes.
type QrBadgeProps = {
  code: string | null | undefined
  size?: number // tamaño en píxeles
  className?: string
}

export function QrBadge({ code, size = 80, className }: QrBadgeProps) {
  const dataUrl = useQrCode(code)

  if (!code) return null

  return (
    <div
      className={
        "shrink-0 overflow-hidden rounded-lg border border-border bg-white p-1.5 " +
        (className ?? "")
      }
      title={`QR: ${code}`}
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`Código QR ${code}`}
          width={size}
          height={size}
          style={{ width: size, height: size, imageRendering: "pixelated" }}
          className="block"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="animate-pulse rounded bg-muted"
        />
      )}
    </div>
  )
}

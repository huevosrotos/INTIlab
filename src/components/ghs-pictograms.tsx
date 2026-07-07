"use client"

import { GHS_PICTOGRAMS } from "@/lib/constants"

type Props = {
  code: string
  className?: string
  size?: number
}

// Pictogramas del Sistema Globalmente Armonizado (SGA/GHS).
// Diamante rojo con borde blanco y símbolo negro, estilo oficial.
export function Ghspictogram({ code, className, size = 40 }: Props) {
  const pict = GHS_PICTOGRAMS[code as keyof typeof GHS_PICTOGRAMS]
  if (!pict) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={pict.label}
      title={pict.label}
    >
      {/* Diamante rojo */}
      <rect
        x="14"
        y="14"
        width="72"
        height="72"
        transform="rotate(45 50 50)"
        fill="#e30613"
        stroke="#fff"
        strokeWidth="5"
      />
      <rect
        x="20"
        y="20"
        width="60"
        height="60"
        transform="rotate(45 50 50)"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
      />
      <g transform="translate(50 50)">{PictogramSymbol(code)}</g>
    </svg>
  )
}

function PictogramSymbol(code: string) {
  // Cada símbolo dibujado en blanco sobre el diamante rojo, centrado en (0,0)
  switch (code) {
    case "GHS01": // Explosivo: bomba explotando
      return (
        <g fill="#fff" stroke="#fff" strokeWidth="1.5" transform="translate(-18 -18)">
          {/* Cuerpo de bomba */}
          <circle cx="18" cy="22" r="9" fill="#fff" />
          {/* Mecha */}
          <path d="M18 13 L18 6 L24 3" fill="none" stroke="#fff" strokeWidth="2" />
          {/* Explosión */}
          <path d="M24 3 L27 0 M24 3 L30 4 M24 3 L26 -2" stroke="#fff" strokeWidth="1.8" fill="none" />
          {/* Brillos */}
          <line x1="12" y1="20" x2="9" y2="17" stroke="#e30613" strokeWidth="1.2" />
          <line x1="18" y1="16" x2="18" y2="13" stroke="#e30613" strokeWidth="1.2" />
        </g>
      )
    case "GHS02": // Inflamable: llama
      return (
        <g fill="#fff" transform="translate(-9 -16)">
          <path
            d="M9 0 C 3 6, 0 11, 0 16 C 0 22, 4 26, 9 26 C 14 26, 18 22, 18 16 C 18 12, 15 8, 13 6 C 13 9, 11 11, 9 11 C 11 7, 10 3, 9 0 Z"
            fill="#fff"
          />
        </g>
      )
    case "GHS03": // Comburente: llama sobre círculo
      return (
        <g fill="#fff" transform="translate(-13 -14)">
          <circle cx="13" cy="18" r="11" fill="none" stroke="#fff" strokeWidth="2.5" />
          <path
            d="M13 6 C 9 11, 7 14, 7 17 C 7 21, 10 23, 13 23 C 16 23, 19 21, 19 17 C 19 15, 17 12, 16 11 C 16 13, 15 14, 14 14 C 15 11, 14 8, 13 6 Z"
            fill="#fff"
          />
        </g>
      )
    case "GHS04": // Gas a presión: bombona
      return (
        <g fill="none" stroke="#fff" strokeWidth="2.5" transform="translate(-9 -15)">
          <rect x="3" y="9" width="12" height="22" rx="2" />
          <rect x="6" y="5" width="6" height="4" />
          <line x1="9" y1="2" x2="9" y2="5" />
          <circle cx="9" cy="20" r="3" fill="#fff" />
        </g>
      )
    case "GHS05": // Corrosivo: corrosión sobre manos/placa
      return (
        <g fill="#fff" transform="translate(-15 -15)">
          {/* Dos frascos cayendo líquido sobre mano y metal */}
          <path d="M4 4 L10 4 L11 8 L3 8 Z" fill="#fff" />
          <rect x="5" y="8" width="4" height="2" fill="#fff" />
          <path d="M7 10 L7 14" stroke="#fff" strokeWidth="1.5" />
          <path d="M20 4 L26 4 L27 8 L19 8 Z" fill="#fff" />
          <rect x="21" y="8" width="4" height="2" fill="#fff" />
          <path d="M23 10 L23 14" stroke="#fff" strokeWidth="1.5" />
          {/* Mano */}
          <path
            d="M2 20 Q 2 17, 5 17 L 13 17 Q 16 17, 16 20 L 16 26 Q 16 28, 14 28 L 4 28 Q 2 28, 2 26 Z"
            fill="#fff"
          />
          {/* Barra corrosa */}
          <rect x="18" y="22" width="10" height="6" fill="#fff" />
          <path d="M18 22 L20 19 L26 19 L28 22 Z" fill="#fff" />
        </g>
      )
    case "GHS06": // Toxicidad aguda: calavera y tibias
      return (
        <g fill="#fff" transform="translate(-11 -14)">
          {/* Cráneo */}
          <ellipse cx="11" cy="11" rx="9" ry="8" fill="#fff" />
          {/* Mandíbula */}
          <rect x="7" y="17" width="8" height="4" rx="1" fill="#fff" />
          <path d="M9 21 L9 23 M11 21 L11 23 M13 21 L13 23" stroke="#fff" strokeWidth="1.2" />
          {/* Ojos */}
          <ellipse cx="8" cy="11" rx="2.2" ry="2.6" fill="#e30613" />
          <ellipse cx="14" cy="11" rx="2.2" ry="2.6" fill="#e30613" />
          {/* Nariz */}
          <path d="M11 13 L10 15.5 L12 15.5 Z" fill="#e30613" />
          {/* Tibias cruzadas */}
          <line x1="3" y1="24" x2="9" y2="30" stroke="#fff" strokeWidth="2" />
          <line x1="19" y1="24" x2="13" y2="30" stroke="#fff" strokeWidth="2" />
          <circle cx="3" cy="24" r="1.4" fill="#fff" />
          <circle cx="19" cy="24" r="1.4" fill="#fff" />
        </g>
      )
    case "GHS07": // Irritante: signo de exclamación
      return (
        <g fill="#fff" transform="translate(-4 -16)">
          <rect x="5" y="2" width="6" height="18" rx="3" fill="#fff" />
          <circle cx="8" cy="25" r="3" fill="#fff" />
        </g>
      )
    case "GHS08": // Peligro para la salud: silueta humana con estrella en pecho
      return (
        <g fill="#fff" transform="translate(-10 -16)">
          {/* Cabeza */}
          <circle cx="10" cy="4" r="4" fill="#fff" />
          {/* Cuerpo */}
          <path
            d="M2 28 Q 2 14, 10 14 Q 18 14, 18 28 Z"
            fill="#fff"
          />
          {/* Estrella en el pecho (recortada) */}
          <path
            d="M10 18 L11.2 21 L14.3 21 L11.8 23 L12.7 26 L10 24.2 L7.3 26 L8.2 23 L5.7 21 L8.8 21 Z"
            fill="#e30613"
          />
        </g>
      )
    case "GHS09": // Peligro para el medio ambiente: árbol y pez muerto
      return (
        <g fill="#fff" transform="translate(-14 -15)">
          {/* Tierra */}
          <path d="M0 26 L28 26 L28 29 L0 29 Z" fill="#fff" />
          {/* Árbol sin hojas (muerto) */}
          <line x1="8" y1="26" x2="8" y2="12" stroke="#fff" strokeWidth="2" />
          <line x1="8" y1="16" x2="4" y2="12" stroke="#fff" strokeWidth="1.5" />
          <line x1="8" y1="14" x2="12" y2="10" stroke="#fff" strokeWidth="1.5" />
          <line x1="8" y1="18" x2="5" y2="15" stroke="#fff" strokeWidth="1.2" />
          {/* Pez */}
          <path
            d="M14 22 Q 14 19, 18 19 L 22 19 Q 25 19, 25 22 L 25 24 Q 25 26, 22 26 L 18 26 Q 14 26, 14 24 Z"
            fill="#fff"
          />
          <path d="M25 21 L28 19 L28 25 L25 23 Z" fill="#fff" />
          {/* Ojo X */}
          <line x1="16" y1="20.5" x2="17.5" y2="22" stroke="#e30613" strokeWidth="1" />
          <line x1="17.5" y1="20.5" x2="16" y2="22" stroke="#e30613" strokeWidth="1" />
        </g>
      )
    default:
      return null
  }
}

// Leyenda completa de pictogramas (para selector y ayuda)
export function PictogramLegend() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
      {Object.values(GHS_PICTOGRAMS).map((p) => (
        <div key={p.key} className="flex flex-col items-center gap-1 text-center">
          <Ghspictogram code={p.key} size={48} />
          <span className="text-[10px] leading-tight text-muted-foreground">{p.label}</span>
        </div>
      ))}
    </div>
  )
}

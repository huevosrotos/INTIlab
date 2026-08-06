"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  HelpCircle,
  QrCode,
  Boxes,
  Camera,
  Tags,
  ArrowLeftRight,
  ShieldAlert,
  PlayCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Pencil,
  Filter,
  Mail,
  Settings2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"

type HelpTopic = {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  category: "inventario" | "qr" | "movimientos" | "general"
  description: string
  steps: string[]
  tip?: string
}

const TOPICS: HelpTopic[] = [
  {
    id: "habilitar-consumir",
    title: "Habilitar y consumir un frasco",
    icon: PlayCircle,
    category: "movimientos",
    description: "Cómo habilitar un frasco para uso y registrarlo como consumido cuando se termina.",
    steps: [
      "Andá a Inventario → Lotes y buscá el frasco (o escaneá su QR).",
      "Si el lote está Activo, tocá 'Habilitar para uso'.",
      "Elegí a qué laboratorio/sector se destina el frasco y confirmá.",
      "El lote pasa a estado 'En uso' y aparece en ese depósito.",
      "Cuando el frasco se consumió por completo, abrí el lote y tocá 'Marcar consumido'.",
      "El stock pasa a 0 y el lote queda en estado 'Consumido' (para trazabilidad).",
    ],
    tip: "Si un frasco no se usó y querés devolverlo al depósito, usá 'Devolver al depósito' desde el estado 'En uso'.",
  },
  {
    id: "escanear-qr",
    title: "Escanear un código QR",
    icon: QrCode,
    category: "qr",
    description: "Cómo usar el escáner de QR con la cámara del celular.",
    steps: [
      "Entrá a la app por HTTPS (https://<IP>) desde el celu o PC.",
      "Andá a la sección 'Escanear QR'.",
      "Tocá 'Iniciar cámara' y aceptá el permiso del navegador.",
      "Apuntá la cámara al QR del frasco.",
      "La app muestra la ficha del lote con sus datos y acciones rápidas.",
      "Si no tenés cámara, podés ingresar el código QR (DL-XXXXXXXX) manualmente.",
    ],
    tip: "El QR de la etiqueta abre la app automáticamente si lo escaneás con la cámara nativa del celular (fuera de la app).",
  },
  {
    id: "imprimir-etiquetas",
    title: "Imprimir etiquetas QR",
    icon: Tags,
    category: "qr",
    description: "Cómo generar e imprimir etiquetas para pegar en los frascos.",
    steps: [
      "Andá a 'Etiquetas QR'.",
      "Elegí el tamaño de etiqueta (XS a XL, o personalizado).",
      "Para una etiqueta: seleccioná un lote y tocá 'Imprimir etiqueta'.",
      "Para varias: marcá los lotes con los checkboxes y tocá 'Imprimir (N)'.",
      "En el diálogo de impresión del navegador, configurá el tamaño de papel (A4) y márgenes mínimos.",
      "La etiqueta incluye: QR, nombre de la droga, pictogramas SGA, ubicación, lote, CAS y vencimiento.",
    ],
    tip: "El QR codifica la URL HTTPS de la app. Al escanearlo con el celu, abre la app directamente en la ficha del lote.",
  },
  {
    id: "transferir",
    title: "Transferir un frasco entre depósitos",
    icon: ArrowLeftRight,
    category: "movimientos",
    description: "Cómo mover un frasco completo de un depósito a otro.",
    steps: [
      "Andá a Inventario → Lotes y buscá el frasco.",
      "El lote debe estar en estado 'Activo' o 'Vencido'.",
      "Tocá 'Transferir' y elegí el depósito destino.",
      "Confirmá. El frasco entero cambia de depósito (no se permiten fracciones).",
      "El movimiento queda registrado en el historial del lote.",
    ],
    tip: "Cada transferencia queda en el historial de movimientos con fecha, usuario y depósitos origen/destino.",
  },
  {
    id: "foto-envase",
    title: "Tomar foto del envase",
    icon: Camera,
    category: "inventario",
    description: "Cómo fotografiar el frasco desde el celu y adjuntarlo al lote.",
    steps: [
      "Andá a Inventario → Lotes y abrí el lote.",
      "En la sección 'Foto del envase', tocá 'Tomar foto'.",
      "Aceptá el permiso de cámara del navegador.",
      "Apuntá al frasco y tocá 'Capturar foto'.",
      "La foto se sube automáticamente y se guarda en el lote.",
      "También podés 'Subir imagen' si ya tenés la foto como archivo.",
    ],
    tip: "Requiere HTTPS para que la cámara funcione en el celu. Si entrás por HTTP, usá 'Subir imagen'.",
  },
  {
    id: "observaciones",
    title: "Observaciones del lote",
    icon: Lightbulb,
    category: "inventario",
    description: "Cómo registrar características especiales de un lote (húmedo, prestado, contaminado, etc.).",
    steps: [
      "Andá a Inventario → Lotes y abrí el lote.",
      "Buscá la sección 'Observaciones del lote'.",
      "Tocá 'Agregar' o 'Editar'.",
      "Escribí la observación (ej: 'Está húmedo', 'Es prestado', 'Contaminado', 'No funciona').",
      "Tocá 'Guardar'.",
      "La observación se muestra en amarillo en el detalle y como preview en la tarjeta del listado.",
    ],
    tip: "Cada lote es independiente: dos frascos de la misma sustancia pueden tener observaciones distintas.",
  },
  {
    id: "vencidos",
    title: "Lotes vencidos",
    icon: ShieldAlert,
    category: "inventario",
    description: "Qué se puede hacer con un frasco vencido.",
    steps: [
      "Los lotes vencidos aparecen con badge rojo 'Vencido'.",
      "Filtrá por estado 'Vencido' en Inventario → Lotes para verlos todos.",
      "Un lote vencido puede: habilitarse para uso, consumirse, transferirse o darse de baja.",
      "Si el frasco vencido se va a usar igual (ej: para prácticas), habilitalo.",
      "Si no se puede usar, dalo de baja con 'Dar de baja'.",
      "Los lotes consumidos/dados de baja NO se eliminan: quedan para trazabilidad.",
    ],
    tip: "Las alertas de vencimiento te avisan 30 días antes de que venza un lote.",
  },
  {
    id: "vista-sustancia",
    title: "Vista 'Por sustancia'",
    icon: Boxes,
    category: "inventario",
    description: "Cómo ver todos los frascos de una misma sustancia agrupados.",
    steps: [
      "Andá a Inventario → Lotes.",
      "Arriba a la derecha, cambiá el toggle de 'Por lote' a 'Por sustancia'.",
      "Los lotes se agrupan por droga, mostrando: total de frascos, cuántos activos, purezas distintas y depósitos.",
      "Cada frasco tiene su mini-tarjeta con lote, depósito, stock, pureza y vencimiento.",
      "Hacé click en una mini-tarjeta para ver el detalle del lote.",
    ],
    tip: "Útil para ver de un vistazo cuántos frascos tenés de cada reactivo y en qué depósitos están.",
  },
  {
    id: "alertas",
    title: "Alertas de vencimiento y stock",
    icon: ShieldAlert,
    category: "general",
    description: "Cómo funcionan las alertas automáticas.",
    steps: [
      "Las alertas aparecen en el Panel de control y en la sección 'Alertas'.",
      "Alertas de vencimiento: avisan 30 días antes de que venza un lote (amarillo) o cuando ya venció (rojo).",
      "Alertas de stock: avisan cuando el stock está bajo el mínimo configurado por droga (amarillo) o agotado (rojo).",
      "Para resolver una alerta, hacé click en ella y seguí la acción sugerida (dar de baja, reponer, etc.).",
      "Las alertas se actualizan automáticamente cuando hacés un movimiento.",
    ],
    tip: "Configurá el 'Stock mínimo' en la ficha de cada droga para que las alertas de stock funcionen.",
  },
  {
    id: "editar-droga",
    title: "Editar una droga del catálogo",
    icon: Pencil,
    category: "inventario",
    description: "Cómo modificar los datos de una droga (solo administradores).",
    steps: [
      "Andá a Inventario → Catálogo y hacé click en la droga.",
      "En la sección 'Acciones' (debajo de la info), tocá 'Editar'.",
      "Modificá los campos: código, nombre, CAS, fórmula, pureza, etc.",
      "Para cambiar las clases químicas, usá los botones de colores por categoría.",
      "Tocá 'Guardar' para confirmar los cambios.",
    ],
    tip: "Solo los administradores pueden editar drogas. Los encargados pueden editar lotes pero no el catálogo.",
  },
  {
    id: "filtros-clases",
    title: "Buscar por clases químicas",
    icon: Filter,
    category: "inventario",
    description: "Cómo filtrar drogas por tipo (ácido, inflamable, colorante, etc.).",
    steps: [
      "Andá a Inventario → Catálogo.",
      "Tocá el botón 'Filtros' arriba a la derecha.",
      "Se abren las categorías: Naturaleza, Ácido/Base, Peligrosidad, Reactividad, Función, Material.",
      "Tocá una o varias clases para filtrar (se combinan con AND).",
      "Los resultados se actualizan automáticamente.",
      "Tocá 'Limpiar' para quitar todos los filtros.",
    ],
    tip: "La búsqueda por texto ignora acentos: escribí 'acido' y encuentra 'Ácido sulfúrico'.",
  },
  {
    id: "recuperar-password",
    title: "Recuperar contraseña olvidada",
    icon: Mail,
    category: "general",
    description: "Cómo restablecer tu contraseña si la olvidaste.",
    steps: [
      "En la pantalla de login, tocá '¿Olvidó su contraseña?'.",
      "Ingresá tu email y tocá 'Enviar enlace'.",
      "Vas a recibir un email con un enlace de recuperación (revisá spam).",
      "Abrí el enlace desde tu navegador.",
      "Ingresá la nueva contraseña dos veces y tocá 'Restablecer contraseña'.",
      "Ahora podés iniciar sesión con la nueva contraseña.",
    ],
    tip: "El enlace expira en 1 hora. Si no recibís el email, verificá que el SMTP esté configurado en Configuración → Email/SMTP.",
  },
  {
    id: "configuracion-smtp",
    title: "Configurar email (SMTP)",
    icon: Settings2,
    category: "general",
    description: "Cómo configurar el servidor de email para recuperación de contraseñas.",
    steps: [
      "Andá a Configuración → Email/SMTP (solo admin).",
      "Completá: servidor (smtp.gmail.com), puerto (587), usuario (tu email), contraseña (de aplicación).",
      "En 'Email remitente' poné tu email completo.",
      "Tocá 'Guardar'.",
      "Para probar: ingresá un email destino y tocá 'Probar'.",
      "Si llega el email de prueba, está configurado correctamente.",
    ],
    tip: "Para Gmail usá una 'contraseña de aplicación' (no tu password normal). Generala en myaccount.google.com/apppasswords.",
  },
  {
    id: "lotes-consumidos",
    title: "Lotes consumidos y dados de baja",
    icon: CheckCircle2,
    category: "inventario",
    description: "Qué hacer con los frascos vacíos o descartados.",
    steps: [
      "Los lotes consumidos o dados de baja NO se eliminan: quedan para trazabilidad.",
      "Filtrá por estado 'Consumido' o 'Dado de baja' en Inventario → Lotes.",
      "Un lote consumido puede darse de baja (para descartar el frasco vacío).",
      "Un lote dado de baja no admite más acciones.",
      "Las fechas de consumo y baja se registran en la sección 'Trazabilidad' del lote.",
    ],
    tip: "Los lotes vencidos pueden habilitarse, consumirse, transferirse o darse de baja. Un frasco vencido puede usarse para ciertas prácticas.",
  },
]

const CATEGORIES = [
  { id: "inventario", label: "Inventario", icon: Boxes },
  { id: "qr", label: "Códigos QR", icon: QrCode },
  { id: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { id: "general", label: "General", icon: HelpCircle },
  { id: "soporte", label: "Soporte", icon: Mail },
] as const

export function Help() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [category, setCategory] = useState<string>("inventario")
  const { setSection } = useAppStore()

  const selected = TOPICS.find((t) => t.id === selectedId)
  const filtered = TOPICS.filter((t) => t.category === category)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ayuda</h1>
        <p className="text-sm text-muted-foreground">
          Guías rápidas para usar el sistema
        </p>
      </div>

      {/* Categorías */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button
            key={c.id}
            variant={category === c.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCategory(c.id)
              setSelectedId(null)
            }}
          >
            <c.icon className="mr-1.5 h-4 w-4" />
            {c.label}
          </Button>
        ))}
      </div>

      {/* Lista de temas, detalle o soporte */}
      {selected ? (
        <HelpDetail topic={selected} onBack={() => setSelectedId(null)} />
      ) : category === "soporte" ? (
        <SupportCard />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setSelectedId(topic.id)}
              className="group text-left"
            >
              <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/40">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <topic.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-medium">{topic.title}</p>
                      <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {topic.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      {/* Acceso rápido */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Accesos rápidos
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setSection("inventory")}>
              <Boxes className="mr-1.5 h-4 w-4" />
              Inventario
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSection("scanner")}>
              <QrCode className="mr-1.5 h-4 w-4" />
              Escanear QR
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSection("labels")}>
              <Tags className="mr-1.5 h-4 w-4" />
              Etiquetas QR
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSection("dashboard")}>
              <ShieldAlert className="mr-1.5 h-4 w-4" />
              Ver alertas
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SupportCard() {
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    setSending(true)
    try {
      const subject = encodeURIComponent("Soporte INTILab")
      const body = encodeURIComponent(message)
      window.location.href = `mailto:miguel.della.vecchia@gmail.com?subject=${subject}&body=${body}`
      toast.success("Abriendo tu cliente de email…")
    } catch {
      toast.error("No se pudo abrir el cliente de email")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <img src="/logo.png" alt="INTILab" className="h-14 w-14 rounded-lg" />
          <div>
            <CardTitle className="text-lg">INTILab — Soporte</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Sistema de gestión de droguero de laboratorio químico
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Acerca del sistema</h3>
          <p className="text-sm text-muted-foreground">
            INTILab es un sistema de gestión de droguero desarrollado para el
            INTI Mendoza. Permite llevar el inventario de reactivos químicos con
            trazabilidad completa, etiquetas QR, multi-depósito, alertas de
            vencimiento y stock bajo, clasificación química automática, y
            operación desde PC o celular con cámara para escanear QR y tomar
            fotos de envases.
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Contactar soporte</h3>
          <p className="text-sm text-muted-foreground">
            Si tenés algún problema, sugerencia o consulta, enviános un email:
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Describí tu consulta o problema…"
          />
          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            <Mail className="mr-2 h-4 w-4" />
            Enviar email de soporte
          </Button>
          <p className="text-xs text-muted-foreground">
            El email se enviará a miguel.della.vecchia@gmail.com
          </p>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 INTI Mendoza — Todos los derechos reservados</span>
          <span>INTILab v1.0</span>
        </div>
      </CardContent>
    </Card>
  )
}

function HelpDetail({ topic, onBack }: { topic: HelpTopic; onBack: () => void }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <topic.icon className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg">{topic.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pasos */}
        <div>
          <p className="mb-3 text-xs font-medium text-muted-foreground">
            Pasos
          </p>
          <ol className="space-y-2">
            {topic.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Tip */}
        {topic.tip && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {topic.tip}
            </p>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={onBack}>
          ← Volver a la lista
        </Button>
      </CardContent>
    </Card>
  )
}

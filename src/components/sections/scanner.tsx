"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { extractQrCode } from "@/lib/qr-utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  ScanLine,
  Camera,
  CameraOff,
  Search,
  AlertTriangle,
  MapPin,
  Package,
  CalendarClock,
  ArrowLeftRight,
  History,
  Boxes,
  Loader2,
  QrCode,
  RotateCcw,
  PlayCircle,
  CheckCircle2,
  Ban,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { useAuth } from "@/components/app-provider"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Ghspictogram } from "@/components/ghs-pictograms"
import { QrBadge } from "@/components/qr-badge"
import {
  MovementDialog,
  type MovementType,
} from "@/components/movement-dialog"
import {
  LOT_STATUS_COLORS,
  LOT_STATUS_LABELS,
  EXPIRY_WARNING_DAYS,
} from "@/lib/constants"

type Lot = {
  id: string
  lotNumber: string
  qrCode: string
  currentQuantity: number
  unit: string
  expiryDate: string | null
  location: string | null
  status: string
  warehouseId?: string | null
  drug: {
    chemicalName: string
    commercialName: string | null
    cas: string | null
    pictograms: string
  }
  warehouse: { id: string; name: string; code: string } | null
}

const READER_ID = "droglab-qr-reader"

async function fetchLotByQr(qr: string): Promise<{ lot: Lot }> {
  const res = await fetch(
    `/api/lots/by-qr/${encodeURIComponent(qr)}`,
    { cache: "no-store" }
  )
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(
      (e as { error?: string }).error || "No se encontró el lote"
    )
  }
  return res.json()
}

function parsePictograms(p: string): string[] {
  try {
    const v = JSON.parse(p)
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function expiryInfo(dateStr: string | null): {
  label: string
  tone: "rose" | "amber" | "muted"
  days: number | null
} {
  if (!dateStr) return { label: "Sin vencimiento", tone: "muted", days: null }
  const d = new Date(dateStr)
  const now = new Date()
  const days = Math.floor(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  const formatted = format(d, "dd/MM/yyyy", { locale: es })
  if (days < 0) return { label: `Vencido ${formatted}`, tone: "rose", days }
  if (days <= EXPIRY_WARNING_DAYS)
    return { label: `Vence ${formatted} (${days}d)`, tone: "amber", days }
  return { label: `Vence ${formatted}`, tone: "muted", days }
}

const toneClass: Record<string, string> = {
  rose: "text-rose-600 font-medium",
  amber: "text-amber-600 font-medium",
  muted: "text-muted-foreground",
}

export function Scanner() {
  const { setSection, setActiveLotId, pendingQr, setPendingQr } = useAppStore()
  const { user } = useAuth()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const processingRef = useRef(false)

  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [foundLot, setFoundLot] = useState<Lot | null>(null)
  const [manualQr, setManualQr] = useState("")
  const [searching, setSearching] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [consumoOpen, setConsumoOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [habilitacionOpen, setHabilitacionOpen] = useState(false)
  const [devolucionOpen, setDevolucionOpen] = useState(false)
  const [bajaOpen, setBajaOpen] = useState(false)

  const canEdit = user?.role === "ADMIN" || user?.role === "ENCARGADO"
  const canConsume =
    !!user &&
    (user.role === "ADMIN" ||
      user.role === "ENCARGADO" ||
      user.role === "OPERARIO")

  const stopCamera = useCallback(async () => {
    const scanner = scannerRef.current
    if (scanner) {
      try {
        if (scanner.isScanning) {
          await scanner.stop()
        }
        await scanner.clear()
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
    setScanning(false)
  }, [])

  const handleFound = useCallback(
    async (qr: string) => {
      if (processingRef.current) return
      processingRef.current = true
      await stopCamera()
      setSearching(true)
      try {
        const code = extractQrCode(qr)
      const { lot } = await fetchLotByQr(code)
        setFoundLot(lot)
        toast.success("Lote encontrado")
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Lote no encontrado"
        toast.error(msg)
        setCamError(null)
      } finally {
        setSearching(false)
        processingRef.current = false
      }
    },
    [stopCamera]
  )

  const startCamera = useCallback(async () => {
    setCamError(null)
    setFoundLot(null)
    setStarting(true)
    try {
      // Limpia instancia previa si quedó
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop()
          }
          await scannerRef.current.clear()
        } catch {
          // ignore
        }
        scannerRef.current = null
      }

      const scanner = new Html5Qrcode(READER_ID)
      scannerRef.current = scanner
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          void handleFound(decoded)
        },
        () => {
          // errores por frame: ignorar
        }
      )
      setScanning(true)
    } catch (e) {
      console.error(e)
      setCamError(
        "No se pudo acceder a la cámara. Verifique los permisos del navegador y que no esté siendo usada por otra aplicación."
      )
      toast.error("Error al iniciar la cámara")
      scannerRef.current = null
    } finally {
      setStarting(false)
    }
  }, [handleFound])

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null
          })
      }
    }
  }, [])

  // Procesar QR pendiente (cuando se llega desde un ?qr= en la URL)
  useEffect(() => {
    if (pendingQr) {
      const code = extractQrCode(pendingQr)
      setPendingQr(null)
      if (code) {
        setSearching(true)
        fetchLotByQr(code)
          .then(({ lot }) => {
            setFoundLot(lot)
            toast.success("Lote encontrado")
          })
          .catch((e) => {
            const msg = e instanceof Error ? e.message : "Lote no encontrado"
            toast.error(msg)
          })
          .finally(() => setSearching(false))
      }
    }
  }, [pendingQr, setPendingQr])

  const handleManualSearch = async () => {
    const code = extractQrCode(manualQr)
    if (!code) return
    setSearching(true)
    setFoundLot(null)
    setCamError(null)
    try {
      const { lot } = await fetchLotByQr(code)
      setFoundLot(lot)
      toast.success("Lote encontrado")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lote no encontrado"
      toast.error(msg)
    } finally {
      setSearching(false)
    }
  }

  const reset = () => {
    setFoundLot(null)
    setManualQr("")
    setCamError(null)
  }

  const refreshFoundLot = useCallback(async () => {
    if (!foundLot) return
    try {
      const { lot } = await fetchLotByQr(foundLot.qrCode)
      setFoundLot(lot)
    } catch {
      // si ya no existe o cambió, volver al modo escaneo
      reset()
    }
  }, [foundLot])

  const gotoInventory = () => {
    if (foundLot) setActiveLotId(foundLot.id)
    setSection("inventory")
  }

  const gotoMovements = () => {
    if (foundLot) setActiveLotId(foundLot.id)
    setSection("movements")
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Escáner QR</h1>
        <p className="text-sm text-muted-foreground">
          Escanee el código QR de un lote para verlo al instante
        </p>
      </div>

      {foundLot ? (
        <FoundLotCard
          lot={foundLot}
          onReset={reset}
          onRefresh={refreshFoundLot}
          onGotoInventory={gotoInventory}
          onGotoMovements={gotoMovements}
          canEdit={canEdit}
          canConsume={canConsume}
          consumoOpen={consumoOpen}
          setConsumoOpen={setConsumoOpen}
          transferOpen={transferOpen}
          setTransferOpen={setTransferOpen}
          habilitacionOpen={habilitacionOpen}
          setHabilitacionOpen={setHabilitacionOpen}
          devolucionOpen={devolucionOpen}
          setDevolucionOpen={setDevolucionOpen}
          bajaOpen={bajaOpen}
          setBajaOpen={setBajaOpen}
        />
      ) : (
        <>
          {/* Cámara */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="mx-auto max-w-md space-y-4">
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed bg-muted/30">
                  <div id={READER_ID} className="h-full w-full" />
                  {!scanning && !starting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <ScanLine className="h-12 w-12 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Cámara detenida. Toque “Iniciar cámara” para escanear.
                      </p>
                    </div>
                  )}
                  {starting && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">
                        Iniciando cámara…
                      </p>
                    </div>
                  )}
                  {scanning && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="h-3/5 w-3/5 rounded-lg border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                    </div>
                  )}
                </div>

                {camError && (
                  <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{camError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!scanning ? (
                    <Button
                      onClick={startCamera}
                      disabled={starting}
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      {starting ? "Iniciando…" : "Iniciar cámara"}
                    </Button>
                  ) : (
                    <Button
                      onClick={stopCamera}
                      variant="destructive"
                      className="flex-1"
                    >
                      <CameraOff className="mr-2 h-4 w-4" />
                      Detener cámara
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Búsqueda manual */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  ¿No puede escanear? Ingrese el código QR manualmente
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <QrCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="DL-XXXXXXXX"
                      value={manualQr}
                      onChange={(e) => setManualQr(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleManualSearch()
                      }}
                      className="pl-9 font-mono"
                    />
                  </div>
                  <Button
                    onClick={handleManualSearch}
                    disabled={searching || !manualQr.trim()}
                  >
                    {searching ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-1.5 h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function FoundLotCard({
  lot,
  onReset,
  onRefresh,
  onGotoInventory,
  onGotoMovements,
  canEdit,
  canConsume,
  consumoOpen,
  setConsumoOpen,
  transferOpen,
  setTransferOpen,
  habilitacionOpen,
  setHabilitacionOpen,
  devolucionOpen,
  setDevolucionOpen,
  bajaOpen,
  setBajaOpen,
}: {
  lot: Lot
  onReset: () => void
  onRefresh: () => void
  onGotoInventory: () => void
  onGotoMovements: () => void
  canEdit: boolean
  canConsume: boolean
  consumoOpen: boolean
  setConsumoOpen: (o: boolean) => void
  transferOpen: boolean
  setTransferOpen: (o: boolean) => void
  habilitacionOpen: boolean
  setHabilitacionOpen: (o: boolean) => void
  devolucionOpen: boolean
  setDevolucionOpen: (o: boolean) => void
  bajaOpen: boolean
  setBajaOpen: (o: boolean) => void
}) {
  const picts = parsePictograms(lot.drug.pictograms)
  const exp = expiryInfo(lot.expiryDate)

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <QrBadge code={lot.qrCode} size={72} className="hidden sm:block" />
              <div className="min-w-0 flex-1">
                <h2 className="break-words text-xl font-bold sm:text-2xl">
                  {lot.drug.chemicalName}
                </h2>
                {lot.drug.commercialName && (
                  <p className="text-sm text-muted-foreground">
                    {lot.drug.commercialName}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    Lote {lot.lotNumber}
                  </Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    QR {lot.qrCode}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      LOT_STATUS_COLORS[lot.status]
                    )}
                  >
                    {LOT_STATUS_LABELS[lot.status]}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Escanear otro
            </Button>
          </div>

          {picts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {picts.map((p) => (
                <Ghspictogram key={p} code={p} size={36} />
              ))}
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              icon={Package}
              label="Stock disponible"
              value={`${lot.currentQuantity} ${lot.unit}`}
            />
            <InfoTile
              icon={MapPin}
              label="Depósito / ubicación"
              value={lot.warehouse?.name ?? "Sin depósito"}
              sub={lot.location || "Sin ubicación"}
            />
            <InfoTile
              icon={CalendarClock}
              label="Vencimiento"
              value={
                lot.expiryDate
                  ? format(new Date(lot.expiryDate), "dd/MM/yyyy", {
                      locale: es,
                    })
                  : "—"
              }
              valueClass={toneClass[exp.tone]}
            />
            <InfoTile
              icon={QrCode}
              label="Código QR"
              value={lot.qrCode}
              mono
            />
          </div>
        </CardContent>
      </Card>

      {/* Acciones contextuales según el estado del lote */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onGotoInventory} variant="default">
          <Boxes className="mr-1.5 h-4 w-4" />
          Ver en inventario
        </Button>

        {/* Habilitar: ACTIVO o VENCIDO */}
        {canConsume && (lot.status === "ACTIVO" || lot.status === "VENCIDO") && (
          <MovementDialog
            lot={lot}
            type="HABILITACION"
            open={habilitacionOpen}
            onOpenChange={setHabilitacionOpen}
            onDone={onRefresh}
            trigger={
              <Button variant="default">
                <PlayCircle className="mr-1.5 h-4 w-4" />
                Habilitar para uso
              </Button>
            }
          />
        )}
        {/* Transferir: ACTIVO o VENCIDO */}
        {canEdit && (lot.status === "ACTIVO" || lot.status === "VENCIDO") && (
          <MovementDialog
            lot={lot}
            type="TRANSFERENCIA"
            open={transferOpen}
            onOpenChange={setTransferOpen}
            onDone={onRefresh}
            trigger={
              <Button variant="outline">
                <ArrowLeftRight className="mr-1.5 h-4 w-4" />
                Transferir
              </Button>
            }
          />
        )}

        {/* Consumir: EN_USO o VENCIDO */}
        {canConsume && (lot.status === "EN_USO" || lot.status === "VENCIDO") && (
          <MovementDialog
            lot={lot}
            type="CONSUMO"
            open={consumoOpen}
            onOpenChange={setConsumoOpen}
            onDone={onRefresh}
            trigger={
              <Button variant="secondary">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                Marcar consumido
              </Button>
            }
          />
        )}
        {/* Devolver: solo EN_USO */}
        {canEdit && lot.status === "EN_USO" && (
          <MovementDialog
            lot={lot}
            type="DEVOLUCION"
            open={devolucionOpen}
            onOpenChange={setDevolucionOpen}
            onDone={onRefresh}
            trigger={
              <Button variant="outline">
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Devolver al depósito
              </Button>
            }
          />
        )}

        {/* Dar de baja: cualquier estado excepto DADO_DE_BAJA */}
        {canEdit && lot.status !== "DADO_DE_BAJA" && (
          <MovementDialog
            lot={lot}
            type="BAJA"
            open={bajaOpen}
            onOpenChange={setBajaOpen}
            onDone={onRefresh}
            trigger={
              <Button variant="outline">
                <Ban className="mr-1.5 h-4 w-4" />
                Dar de baja
              </Button>
            }
          />
        )}

        <Button onClick={onGotoMovements} variant="outline">
          <History className="mr-1.5 h-4 w-4" />
          Ver movimientos
        </Button>
      </div>
    </div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
  sub,
  valueClass,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  valueClass?: string
  mono?: boolean
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-medium",
          mono && "font-mono",
          valueClass
        )}
      >
        {value}
      </p>
      {sub && <p className="truncate text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

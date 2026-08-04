"use client"

import { useState, useEffect, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import QRCode from "qrcode"
import { buildQrUrl } from "@/lib/qr-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Ghspictogram } from "@/components/ghs-pictograms"
import {
  Search,
  Printer,
  QrCode as QrIcon,
  MapPin,
  Tag,
  Settings2,
  Layers,
  X,
} from "lucide-react"
import { LABEL_SIZES, LOT_STATUS_COLORS, LOT_STATUS_LABELS } from "@/lib/constants"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type LotListItem = {
  id: string
  lotNumber: string
  qrCode: string
  expiryDate: string | null
  unit: string
  currentQuantity: number
  status: string
  location: string | null
  warehouse: { id: string; name: string; code: string } | null
  drug: {
    chemicalName: string
    commercialName: string | null
    cas: string | null
    pictograms: string
    defaultLocation: string | null
  }
}

type LabelData = {
  lot: {
    id: string
    qrCode: string
    lotNumber: string
    expiryDate: string | null
    unit: string
    location: string | null
  }
  drug: {
    id: string
    chemicalName: string
    commercialName: string | null
    cas: string | null
    pictograms: string
    hazardClass: string | null
  }
  warehouse: { id: string; name: string; code: string } | null
}

async function fetchLotsForLabels(
  q: string
): Promise<{ lots: LotListItem[] }> {
  const url = q ? `/api/lots?q=${encodeURIComponent(q)}` : "/api/lots"
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar lotes")
  return res.json()
}

async function fetchLabelData(
  lotId: string
): Promise<LabelData> {
  const res = await fetch(`/api/labels/${lotId}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar la etiqueta")
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

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function Labels() {
  const [query, setQuery] = useState("")
  const [selectedLotId, setSelectedLotId] = useState<string | null>(null)
  const [sizeId, setSizeId] = useState<string>("M")
  const [customW, setCustomW] = useState(50)
  const [customH, setCustomH] = useState(30)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkPrintOpen, setBulkPrintOpen] = useState(false)

  const { data: lotsData, isLoading: lotsLoading } = useQuery({
    queryKey: ["labels-lots", query],
    queryFn: () => fetchLotsForLabels(query),
  })
  const lots = lotsData?.lots ?? []

  const selectedLot = useMemo(
    () => lots.find((l) => l.id === selectedLotId) ?? null,
    [lots, selectedLotId]
  )

  const { data: labelData, isLoading: labelLoading } = useQuery({
    queryKey: ["label", selectedLotId],
    queryFn: () => fetchLabelData(selectedLotId!),
    enabled: !!selectedLotId,
  })

  // Generar QR — codifica la URL completa para que al escanear con el
  // teléfono abra la app automáticamente y muestre la info del lote.
  const qrCodeValue = labelData?.lot.qrCode
  useEffect(() => {
    if (!qrCodeValue) return
    let active = true
    const qrContent = buildQrUrl(qrCodeValue)
    QRCode.toDataURL(qrContent, {
      margin: 1,
      width: 600,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url)
      })
      .catch(() => {
        if (active) toast.error("No se pudo generar el código QR")
      })
    return () => {
      active = false
    }
  }, [qrCodeValue])

  const size = LABEL_SIZES.find((s) => s.id === sizeId) ?? LABEL_SIZES[2]
  const w = sizeId === "CUSTOM" ? customW : size.width
  const h = sizeId === "CUSTOM" ? customH : size.height

  const handlePrint = () => {
    if (!labelData) {
      toast.error("Seleccione un lote primero")
      return
    }
    window.print()
  }

  return (
    <div className="space-y-4">
      <PrintStyle />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Etiquetas QR
        </h1>
        <p className="text-sm text-muted-foreground">
          Genere e imprima etiquetas con código QR para los envases
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Columna izquierda: búsqueda + opciones */}
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4" />
                Seleccionar lote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por droga, n° de lote o QR…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {lotsLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : lots.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No se encontraron lotes
                </p>
              ) : (
                <>
                  {/* Barra de selección masiva */}
                  <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 p-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={lots.length > 0 && selectedIds.size === lots.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(new Set(lots.map((l) => l.id)))
                          } else {
                            setSelectedIds(new Set())
                          }
                        }}
                      />
                      <Label htmlFor="select-all" className="text-xs cursor-pointer">
                        {selectedIds.size === 0
                          ? "Seleccionar todos"
                          : `${selectedIds.size} seleccionado${selectedIds.size === 1 ? "" : "s"}`}
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      variant="default"
                      disabled={selectedIds.size === 0}
                      onClick={() => setBulkPrintOpen(true)}
                    >
                      <Layers className="mr-1.5 h-4 w-4" />
                      Imprimir {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
                    </Button>
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-lg border">
                    {lots.map((lot) => {
                      const active = lot.id === selectedLotId
                      const checked = selectedIds.has(lot.id)
                      return (
                        <div
                          key={lot.id}
                          className={cn(
                            "flex w-full items-center gap-3 border-b px-3 py-2.5 text-left transition-colors last:border-b-0",
                            active
                              ? "bg-primary/10"
                              : checked
                                ? "bg-primary/5"
                                : "hover:bg-accent"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev)
                                if (c) next.add(lot.id)
                                else next.delete(lot.id)
                                return next
                              })
                            }}
                          />
                          <button
                            onClick={() => {
                              setQrDataUrl("")
                              setSelectedLotId(lot.id)
                            }}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {lot.drug.chemicalName}
                              </p>
                              <p className="truncate font-mono text-[11px] text-muted-foreground">
                                {lot.lotNumber} · {lot.qrCode}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[9px]",
                                  LOT_STATUS_COLORS[lot.status]
                                )}
                              >
                                {LOT_STATUS_LABELS[lot.status]}
                              </Badge>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {lot.currentQuantity} {lot.unit}
                              </p>
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tamaño */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-4 w-4" />
                Tamaño de etiqueta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select value={sizeId} onValueChange={setSizeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LABEL_SIZES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {sizeId === "CUSTOM" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Ancho (mm)
                    </Label>
                    <Input
                      type="number"
                      min={10}
                      max={200}
                      value={customW}
                      onChange={(e) =>
                        setCustomW(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">
                      Alto (mm)
                    </Label>
                    <Input
                      type="number"
                      min={10}
                      max={200}
                      value={customH}
                      onChange={(e) =>
                        setCustomH(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                Medidas actuales: {w} × {h} mm
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: vista previa */}
        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" />
                Vista previa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center overflow-auto rounded-lg bg-muted/30 p-4">
                {labelLoading ? (
                  <Skeleton className="h-32 w-48" />
                ) : !labelData ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-2 text-center">
                    <QrIcon className="h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      Seleccione un lote para ver la etiqueta
                    </p>
                  </div>
                ) : (
                  <LabelPreview
                    data={labelData}
                    qrDataUrl={qrDataUrl}
                    w={w}
                    h={h}
                    fallbackLocation={selectedLot?.drug.defaultLocation ?? null}
                  />
                )}
              </div>

              <Button
                onClick={handlePrint}
                disabled={!labelData}
                className="w-full"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir etiqueta
              </Button>

              <p className="text-center text-[11px] text-muted-foreground">
                La impresión usa el tamaño real en milímetros. Configure el
                tamaño de papel y márgenes en el diálogo de impresión.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de impresión masiva */}
      <BulkPrintDialog
        open={bulkPrintOpen}
        onOpenChange={setBulkPrintOpen}
        lots={lots.filter((l) => selectedIds.has(l.id))}
        w={w}
        h={h}
      />
    </div>
  )
}

// Hook para generar QRs en lote
function useBulkQrCodes(codes: string[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const codesKey = codes.join(",")

  useEffect(() => {
    let active = true
    const generate = async () => {
      const result: Record<string, string> = {}
      for (const code of codes) {
        try {
          const url = await QRCode.toDataURL(buildQrUrl(code), {
            margin: 1,
            width: 600,
            errorCorrectionLevel: "M",
            color: { dark: "#000000", light: "#ffffff" },
          })
          result[code] = url
        } catch {}
      }
      if (active) setUrls(result)
    }
    if (codes.length > 0) {
      void generate()
    }
    return () => {
      active = false
    }
  }, [codesKey])

  return urls
}

function BulkPrintDialog({
  open,
  onOpenChange,
  lots,
  w,
  h,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  lots: LotListItem[]
  w: number
  h: number
}) {
  const codes = lots.map((l) => l.qrCode)
  const qrUrls = useBulkQrCodes(codes)

  const handlePrint = () => {
    window.print()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header (no se imprime) */}
      <div className="no-print flex items-center justify-between border-b p-4">
        <div>
          <h2 className="text-lg font-bold">
            Imprimir {lots.length} etiqueta{lots.length === 1 ? "" : "s"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {w} × {h} mm cada una · {lots.length} etiquetas en una hoja
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-1.5 h-4 w-4" />
            Cerrar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-1.5 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Hoja de etiquetas (se imprime) */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <div className="bulk-print-sheet mx-auto bg-white p-4 shadow-lg" style={{ maxWidth: "210mm" }}>
          <div
            className="flex flex-wrap gap-2"
            style={{ gap: "2mm" }}
          >
            {lots.map((lot) => {
              const qrUrl = qrUrls[lot.qrCode] ?? ""
              const location =
                lot.location?.trim() || lot.drug.defaultLocation?.trim() || null
              const expiry = lot.expiryDate
                ? format(new Date(lot.expiryDate), "dd/MM/yy", { locale: es })
                : null
              const picts = parsePictograms(lot.drug.pictograms)
              const minDim = Math.min(w, h)
              const landscape = w >= h
              const qrMm = Math.round(Math.min(h * 0.74, w * 0.46) * 10) / 10
              const pictMm = clamp(minDim * 0.2, 3, 10)
              const pictPx = Math.round(pictMm * 3.7795)
              const nameMm = clamp(minDim * 0.13, 1.8, 4.8)
              const smallMm = clamp(minDim * 0.085, 1.2, 3)
              const locMm = clamp(minDim * 0.1, 1.4, 3.4)

              return (
                <div
                  key={lot.id}
                  className="print-label relative flex overflow-hidden border border-black bg-white"
                  style={{
                    width: `${w}mm`,
                    height: `${h}mm`,
                    flexDirection: landscape ? "row" : "column",
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                >
                  {/* QR */}
                  <div
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: landscape ? `${qrMm}mm` : "100%",
                      height: landscape ? "100%" : `${qrMm}mm`,
                      padding: `${Math.max(0.5, minDim * 0.02)}mm`,
                    }}
                  >
                    {qrUrl ? (
                      <img
                        src={qrUrl}
                        alt={`QR ${lot.qrCode}`}
                        style={{
                          width: `${qrMm - Math.max(1, minDim * 0.04)}mm`,
                          height: `${qrMm - Math.max(1, minDim * 0.04)}mm`,
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: `${qrMm - Math.max(1, minDim * 0.04)}mm`,
                          height: `${qrMm - Math.max(1, minDim * 0.04)}mm`,
                        }}
                        className="animate-pulse bg-muted"
                      />
                    )}
                  </div>

                  {/* Texto */}
                  <div
                    className="flex min-w-0 flex-1 flex-col justify-center text-black"
                    style={{
                      padding: `${Math.max(0.4, minDim * 0.03)}mm`,
                      gap: `${Math.max(0.3, minDim * 0.02)}mm`,
                    }}
                  >
                    <p
                      className="font-bold leading-tight"
                      style={{ fontSize: `${nameMm}mm`, lineHeight: 1.05 }}
                    >
                      {lot.drug.chemicalName}
                    </p>

                    {picts.length > 0 && (
                      <div className="flex flex-wrap" style={{ gap: `${Math.max(0.2, minDim * 0.015)}mm` }}>
                        {picts.map((p) => (
                          <Ghspictogram key={p} code={p} size={pictPx} />
                        ))}
                      </div>
                    )}

                    {location && (
                      <p
                        className="flex items-center font-medium leading-tight"
                        style={{ fontSize: `${locMm}mm`, lineHeight: 1.1 }}
                      >
                        <MapPin
                          className="shrink-0"
                          style={{
                            width: `${locMm}mm`,
                            height: `${locMm}mm`,
                            marginRight: `${Math.max(0.2, minDim * 0.015)}mm`,
                          }}
                        />
                        <span className="truncate">{location}</span>
                      </p>
                    )}

                    <div
                      className="font-mono leading-tight text-black/80"
                      style={{ fontSize: `${smallMm}mm`, lineHeight: 1.15 }}
                    >
                      <p className="truncate">Lote: {lot.lotNumber}</p>
                      {lot.drug.cas && (
                        <p className="truncate">CAS: {lot.drug.cas}</p>
                      )}
                      {expiry && <p className="truncate">Vence: {expiry}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden !important; }
          .bulk-print-sheet, .bulk-print-sheet * { visibility: visible !important; }
          .bulk-print-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 5mm !important;
            box-shadow: none !important;
            max-width: none !important;
            width: 100% !important;
          }
          .print-label {
            border: 1px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { margin: 5mm; }
        }
      `}</style>
    </div>
  )
}

function LabelPreview({
  data,
  qrDataUrl,
  w,
  h,
  fallbackLocation,
}: {
  data: LabelData
  qrDataUrl: string
  w: number
  h: number
  fallbackLocation: string | null
}) {
  const picts = parsePictograms(data.drug.pictograms)
  const minDim = Math.min(w, h)
  const landscape = w >= h

  // Escalado en mm
  const qrMm = Math.round(Math.min(h * 0.74, w * 0.46) * 10) / 10
  const pictMm = clamp(minDim * 0.2, 3, 10)
  const pictPx = Math.round(pictMm * 3.7795)
  const nameMm = clamp(minDim * 0.13, 1.8, 4.8)
  const smallMm = clamp(minDim * 0.085, 1.2, 3)
  const locMm = clamp(minDim * 0.1, 1.4, 3.4)

  const location =
    data.lot.location?.trim() || fallbackLocation?.trim() || null
  const expiry = data.lot.expiryDate
    ? format(new Date(data.lot.expiryDate), "dd/MM/yy", { locale: es })
    : null

  return (
    <div
      className="print-label relative flex overflow-hidden border bg-white"
      style={{
        width: `${w}mm`,
        height: `${h}mm`,
        flexDirection: landscape ? "row" : "column",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* QR */}
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: landscape ? `${qrMm}mm` : "100%",
          height: landscape ? "100%" : `${qrMm}mm`,
          padding: `${Math.max(0.5, minDim * 0.02)}mm`,
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Código QR del lote"
            style={{
              width: `${qrMm - Math.max(1, minDim * 0.04)}mm`,
              height: `${qrMm - Math.max(1, minDim * 0.04)}mm`,
              objectFit: "contain",
            }}
          />
        ) : (
          <QrIcon className="text-black/30" style={{ width: pictPx, height: pictPx }} />
        )}
      </div>

      {/* Texto */}
      <div
        className="flex min-w-0 flex-1 flex-col justify-center text-black"
        style={{
          padding: `${Math.max(0.4, minDim * 0.03)}mm`,
          gap: `${Math.max(0.3, minDim * 0.02)}mm`,
        }}
      >
        <p
          className="font-bold leading-tight"
          style={{ fontSize: `${nameMm}mm`, lineHeight: 1.05 }}
        >
          {data.drug.chemicalName}
        </p>

        {picts.length > 0 && (
          <div className="flex flex-wrap" style={{ gap: `${Math.max(0.2, minDim * 0.015)}mm` }}>
            {picts.map((p) => (
              <Ghspictogram key={p} code={p} size={pictPx} />
            ))}
          </div>
        )}

        {location && (
          <p
            className="flex items-center font-medium leading-tight"
            style={{ fontSize: `${locMm}mm`, lineHeight: 1.1 }}
          >
            <MapPin
              className="shrink-0"
              style={{
                width: `${locMm}mm`,
                height: `${locMm}mm`,
                marginRight: `${Math.max(0.2, minDim * 0.015)}mm`,
              }}
            />
            <span className="truncate">{location}</span>
          </p>
        )}

        <div
          className="font-mono leading-tight text-black/80"
          style={{ fontSize: `${smallMm}mm`, lineHeight: 1.15 }}
        >
          <p className="truncate">Lote: {data.lot.lotNumber}</p>
          {data.drug.cas && (
            <p className="truncate">CAS: {data.drug.cas}</p>
          )}
          {expiry && <p className="truncate">Vence: {expiry}</p>}
        </div>
      </div>
    </div>
  )
}

function PrintStyle() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        .print-label, .print-label * { visibility: visible !important; }
        .print-label {
          position: absolute !important;
          left: 5mm !important;
          top: 5mm !important;
          margin: 0 !important;
          border: 1px solid #000 !important;
          box-shadow: none !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        @page { margin: 5mm; }
      }
    `}</style>
  )
}

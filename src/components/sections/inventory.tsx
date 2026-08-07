"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MovementDialog, type MovementType } from "@/components/movement-dialog"
import { Ghspictogram } from "@/components/ghs-pictograms"
import { QrBadge } from "@/components/qr-badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Catalog } from "@/components/sections/catalog"
import { DrugFormDialog } from "@/components/sections/catalog"
import { useAppStore } from "@/store/app-store"
import { useAuth } from "@/components/app-provider"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Plus,
  Search,
  Boxes,
  ArrowLeft,
  MapPin,
  CalendarClock,
  Package,
  Camera,
  History,
  FlaskConical,
  Upload,
  PlayCircle,
  CheckCircle2,
  RotateCcw,
  Repeat,
  Ban,
  SlidersHorizontal,
  ImageIcon,
  ChevronDown,
  RefreshCw,
  Trash2,
  Pencil,
  StickyNote,
} from "lucide-react"
import {
  LOT_STATUS_LABELS,
  LOT_STATUS_COLORS,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_COLORS,
  UNITS,
  EXPIRY_WARNING_DAYS,
  PHYSICAL_STATE_LABELS,
} from "@/lib/constants"

type Drug = {
  id: string
  chemicalName: string
  commercialName: string | null
  cas: string | null
  formula: string | null
  physicalState: string | null
  pictograms: string
  unit: string | null
  defaultWarehouseId: string | null
  defaultLocation: string | null
}

type Warehouse = {
  id: string
  name: string
  code: string
  type: string
}

type Lot = {
  id: string
  lotNumber: string
  qrCode: string
  expiryDate: string | null
  supplier: string | null
  purchaseDate: string | null
  initialQuantity: number
  currentQuantity: number
  unit: string
  status: string
  location: string | null
  purity: string | null
  notes: string | null
  containerPhoto: string | null
  warehouseId: string | null
  receivedDate: string | null
  openedDate: string | null
  consumedDate: string | null
  discardedDate: string | null
  warehouse: Warehouse | null
  drug: Drug
}

type Movement = {
  id: string
  type: string
  quantity: number
  balanceAfter: number | null
  reason: string | null
  createdAt: string
  user: { id: string; name: string }
  fromWarehouse: Warehouse | null
  toWarehouse: Warehouse | null
}

async function fetchLots(params: {
  warehouseId: string
  status: string
  q: string
}): Promise<{ lots: Lot[] }> {
  const sp = new URLSearchParams()
  if (params.warehouseId && params.warehouseId !== "ALL")
    sp.set("warehouseId", params.warehouseId)
  if (params.status && params.status !== "ALL") sp.set("status", params.status)
  if (params.q) sp.set("q", params.q)
  const res = await fetch(`/api/lots?${sp.toString()}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar lotes")
  return res.json()
}

async function fetchWarehouses(): Promise<{ warehouses: Warehouse[] }> {
  const res = await fetch("/api/warehouses", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar depósitos")
  return res.json()
}

async function fetchLotDetail(id: string) {
  const res = await fetch(`/api/lots/${id}?full=1`, { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar el lote")
  return res.json()
}

async function fetchDrugs(q: string): Promise<{ drugs: Drug[] }> {
  const url = q ? `/api/drugs?q=${encodeURIComponent(q)}` : "/api/drugs"
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar drogas")
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
  if (days < 0)
    return { label: `Vencido ${formatted}`, tone: "rose", days }
  if (days <= EXPIRY_WARNING_DAYS)
    return { label: `Vence ${formatted} (${days}d)`, tone: "amber", days }
  return { label: `Vence ${formatted}`, tone: "muted", days }
}

const toneClass: Record<string, string> = {
  rose: "text-rose-600 font-medium",
  amber: "text-amber-600 font-medium",
  muted: "text-muted-foreground",
}

export function Inventory() {
  const { activeLotId, selectedDrugId } = useAppStore()
  // Si hay un lote activo, mostrar el detalle del lote directamente
  if (activeLotId) {
    return <LotsList />
  }
  // Si hay una droga seleccionada, mostrar el catálogo (que abre el DrugDetail)
  if (selectedDrugId) {
    return <Catalog />
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="lots">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto">
          <TabsTrigger value="lots">Lotes</TabsTrigger>
          <TabsTrigger value="catalog">Catálogo</TabsTrigger>
        </TabsList>
        <TabsContent value="lots" className="mt-4">
          <LotsList />
        </TabsContent>
        <TabsContent value="catalog" className="mt-4">
          <Catalog />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function LotsList() {
  const { user } = useAuth()
  const {
    inventoryWarehouseFilter,
    setInventoryWarehouseFilter,
    activeLotId,
    setActiveLotId,
    inventoryViewMode,
    setInventoryViewMode,
    inventoryScrollY,
    setInventoryScrollY,
  } = useAppStore()
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [query, setQuery] = useState("")
  const viewMode = inventoryViewMode
  const setViewMode = setInventoryViewMode
  const listRef = useRef<HTMLDivElement>(null)

  // Restaurar scroll al montar (cuando se vuelve del detalle)
  useEffect(() => {
    if (listRef.current && inventoryScrollY > 0 && !activeLotId) {
      listRef.current.scrollTop = inventoryScrollY
    }
  }, [activeLotId, inventoryScrollY])

  // Guardar scroll antes de navegar al detalle
  const handleLotClick = (id: string) => {
    if (listRef.current) {
      setInventoryScrollY(listRef.current.scrollTop)
    }
    setActiveLotId(id)
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "ENCARGADO"

  const { data: whData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
  })

  const { data, isLoading } = useQuery({
    queryKey: ["lots", inventoryWarehouseFilter, statusFilter, query],
    queryFn: () =>
      fetchLots({
        warehouseId: inventoryWarehouseFilter,
        status: statusFilter,
        q: query,
      }),
  })

  if (activeLotId) {
    return (
      <LotDetail
        lotId={activeLotId}
        onBack={() => setActiveLotId(null)}
        canEdit={canEdit}
        canConsume={
          !!user &&
          (user.role === "ADMIN" ||
            user.role === "ENCARGADO" ||
            user.role === "OPERARIO")
        }
      />
    )
  }

  const lots = data?.lots ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            {lots.length} lote{lots.length === 1 ? "" : "s"} en stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "lots" | "drugs")}>
            <TabsList className="h-9">
              <TabsTrigger value="lots" className="text-xs">Por lote</TabsTrigger>
              <TabsTrigger value="drugs" className="text-xs">Por sustancia</TabsTrigger>
            </TabsList>
          </Tabs>
          {canEdit && <NewLotDialog warehouses={whData?.warehouses ?? []} />}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Depósito
              </Label>
              <Select
                value={inventoryWarehouseFilter}
                onValueChange={setInventoryWarehouseFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los depósitos</SelectItem>
                  {(whData?.warehouses ?? []).map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Estado
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los estados</SelectItem>
                  {Object.entries(LOT_STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 lg:col-span-2">
              <Label className="text-[11px] text-muted-foreground">
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="N° de lote, código QR o nombre de droga…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de lotes */}
      <div ref={listRef}>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : lots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Boxes className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No se encontraron lotes con los filtros seleccionados
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "lots" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <LotCard
              key={lot.id}
              lot={lot}
              onClick={() => handleLotClick(lot.id)}
            />
          ))}
        </div>
      ) : (
        <DrugGroupsView lots={lots} onLotClick={(id) => handleLotClick(id)} />
      )}
      </div>
    </div>
  )
}

function DrugGroupsView({ lots, onLotClick }: { lots: Lot[]; onLotClick: (id: string) => void }) {
  // Agrupar por drugId
  const groups = useMemo(() => {
    const map = new Map<string, { drug: Lot["drug"]; lots: Lot[] }>()
    for (const lot of lots) {
      const existing = map.get(lot.drug.id)
      if (existing) {
        existing.lots.push(lot)
      } else {
        map.set(lot.drug.id, { drug: lot.drug, lots: [lot] })
      }
    }
    // Ordenar por nombre de droga
    return Array.from(map.values()).sort((a, b) =>
      a.drug.chemicalName.localeCompare(b.drug.chemicalName)
    )
  }, [lots])

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const picts = parsePictograms(group.drug.pictograms)
        const activeLots = group.lots.filter((l) => l.status === "ACTIVO" || l.status === "EN_USO")
        const warehouses = new Set(group.lots.map((l) => l.warehouse?.name).filter(Boolean))
        const purities = new Set(
          group.lots.map((l) => l.purity ?? l.drug.purity).filter(Boolean) as string[]
        )
        return (
          <Card key={group.drug.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{group.drug.chemicalName}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {group.lots.length} {group.lots.length === 1 ? "frasco" : "frascos"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] text-emerald-600">
                      {activeLots.length} activo{activeLots.length === 1 ? "" : "s"}
                    </Badge>
                  </div>
                  {group.drug.commercialName && (
                    <p className="text-xs text-muted-foreground">{group.drug.commercialName}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {group.drug.cas && (
                      <Badge variant="outline" className="text-[9px] font-mono">
                        CAS {group.drug.cas}
                      </Badge>
                    )}
                    {picts.slice(0, 5).map((p) => (
                      <Ghspictogram key={p} code={p} size={16} />
                    ))}
                  </div>
                  {purities.size > 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Pureza: {Array.from(purities).join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    En: {Array.from(warehouses).join(", ") || "Sin depósito"}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {group.lots.map((lot) => {
                  const exp = expiryInfo(lot.expiryDate)
                  const lotPurity = lot.purity ?? group.drug.purity
                  return (
                    <button
                      key={lot.id}
                      onClick={() => onLotClick(lot.id)}
                      className="rounded-lg border p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate font-mono text-[11px] font-medium">
                          {lot.lotNumber}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("shrink-0 text-[9px]", LOT_STATUS_COLORS[lot.status])}
                        >
                          {LOT_STATUS_LABELS[lot.status]}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {lot.warehouse?.name ?? "Sin depósito"}
                      </p>
                      <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                        <span className="font-semibold">
                          {lot.currentQuantity} {lot.unit}
                        </span>
                        {lotPurity && (
                          <span className="text-muted-foreground">{lotPurity}</span>
                        )}
                      </div>
                      <p className={cn("mt-0.5 text-[10px]", toneClass[exp.tone])}>
                        {exp.label}
                      </p>
                      {lot.notes && (
                        <p className="mt-1 line-clamp-1 text-[10px] text-amber-600 dark:text-amber-400">
                          ⚠ {lot.notes}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function LotCard({ lot, onClick }: { lot: Lot; onClick: () => void }) {
  const picts = parsePictograms(lot.drug.pictograms)
  const exp = expiryInfo(lot.expiryDate)
  const pct =
    lot.initialQuantity > 0
      ? Math.round((lot.currentQuantity / lot.initialQuantity) * 100)
      : 0
  return (
    <button onClick={onClick} className="group text-left">
      <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/40">
        <CardContent className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold leading-tight">
                {lot.drug.chemicalName}
              </h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {lot.lotNumber}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-[10px]", LOT_STATUS_COLORS[lot.status])}
            >
              {LOT_STATUS_LABELS[lot.status]}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {picts.slice(0, 4).map((p) => (
              <Ghspictogram key={p} code={p} size={18} />
            ))}
            {lot.drug.cas && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                CAS {lot.drug.cas}
              </Badge>
            )}
            {(lot.purity || lot.drug.purity) && (
              <Badge variant="outline" className="text-[10px]">
                {(lot.purity ?? lot.drug.purity) + (lot.purity ? "" : " *")}
              </Badge>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {lot.warehouse?.name ?? "Sin depósito"}
              {lot.location ? ` · ${lot.location}` : ""}
            </span>
          </div>

          {lot.notes && (
            <div className="mt-2 flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 dark:border-amber-900 dark:bg-amber-950/30">
              <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="line-clamp-2 text-[11px] text-amber-800 dark:text-amber-300">
                {lot.notes}
              </p>
            </div>
          )}

          <div className="mt-auto flex items-end justify-between pt-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Stock</p>
              <p className="text-sm font-semibold">
                {lot.currentQuantity} / {lot.initialQuantity} {lot.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Vencimiento</p>
              <p className={cn("text-xs", toneClass[exp.tone])}>{exp.label}</p>
            </div>
          </div>
          {pct < 100 && (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  pct === 0
                    ? "bg-rose-500"
                    : pct < 30
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </button>
  )
}

function LotDetail({
  lotId,
  onBack,
  canEdit,
  canConsume,
}: {
  lotId: string
  onBack: () => void
  canEdit: boolean
  canConsume: boolean
}) {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ["lot", lotId],
    queryFn: () => fetchLotDetail(lotId),
  })

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8">
          <ArrowLeft className="mr-1 h-4 w-4" /> Volver
        </Button>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const lot: Lot = data.lot
  const movements: Movement[] = data.lot.movements ?? []
  const picts = parsePictograms(lot.drug.pictograms)
  const exp = expiryInfo(lot.expiryDate)

  const actions: {
    type: MovementType
    label: string
    icon: React.ComponentType<{ className?: string }>
    allowed: boolean
    variant: "default" | "outline" | "secondary" | "destructive"
  }[] = [
    // Habilitar: ACTIVO o VENCIDO (un frasco vencido puede habilitarse para uso)
    {
      type: "HABILITACION",
      label: "Habilitar para uso",
      icon: PlayCircle,
      allowed: canConsume && (lot.status === "ACTIVO" || lot.status === "VENCIDO"),
      variant: "default",
    },
    // Transferir: ACTIVO o VENCIDO
    {
      type: "TRANSFERENCIA",
      label: "Transferir",
      icon: Repeat,
      allowed: canEdit && (lot.status === "ACTIVO" || lot.status === "VENCIDO"),
      variant: "outline",
    },
    // Consumir: EN_USO o VENCIDO (puede consumirse aunque esté vencido)
    {
      type: "CONSUMO",
      label: "Marcar consumido",
      icon: CheckCircle2,
      allowed: canConsume && (lot.status === "EN_USO" || lot.status === "VENCIDO"),
      variant: "secondary",
    },
    // Devolver: solo EN_USO (un vencido no se "devuelve", se da de baja)
    {
      type: "DEVOLUCION",
      label: "Devolver al depósito",
      icon: RotateCcw,
      allowed: canEdit && lot.status === "EN_USO",
      variant: "outline",
    },
    // Baja: disponible desde cualquier estado excepto DADO_DE_BAJA
    // (un lote consumido puede darse de baja para descartar el frasco vacío)
    {
      type: "BAJA",
      label: "Dar de baja",
      icon: Ban,
      allowed: canEdit && lot.status !== "DADO_DE_BAJA",
      variant: "outline",
    },
    // Ajuste: admin/encargado, cualquier estado excepto DADO_DE_BAJA y CONSUMIDO
    {
      type: "AJUSTE",
      label: "Ajustar",
      icon: SlidersHorizontal,
      allowed:
        canEdit &&
        lot.status !== "DADO_DE_BAJA" &&
        lot.status !== "CONSUMIDO",
      variant: "outline",
    },
  ]

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="h-8">
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver al inventario
      </Button>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <QrBadge code={lot.qrCode} size={80} className="hidden sm:block" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="break-words text-xl font-bold sm:text-2xl">
                    {lot.drug.chemicalName}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", LOT_STATUS_COLORS[lot.status])}
                  >
                    {LOT_STATUS_LABELS[lot.status]}
                  </Badge>
                </div>
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
                  {lot.drug.cas && (
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    CAS {lot.drug.cas}
                  </Badge>
                )}
                {lot.drug.formula && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {lot.drug.formula}
                  </Badge>
                )}
                {lot.drug.physicalState && (
                  <Badge variant="outline" className="text-[10px]">
                    {PHYSICAL_STATE_LABELS[lot.drug.physicalState] ??
                      lot.drug.physicalState}
                  </Badge>
                )}
                </div>
              </div>
            </div>
          </div>

          {picts.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Pictogramas de peligro (SGA)
              </p>
              <div className="flex flex-wrap gap-3">
                {picts.map((p) => (
                  <Ghspictogram key={p} code={p} size={44} />
                ))}
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile
              icon={Package}
              label="Stock actual"
              value={`${lot.currentQuantity} ${lot.unit}`}
              sub={`Inicial: ${lot.initialQuantity} ${lot.unit}`}
            />
            <InfoTile
              icon={MapPin}
              label="Ubicación"
              value={lot.warehouse?.name ?? "Sin depósito"}
              sub={lot.location || "Sin ubicación física"}
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
              sub={exp.days !== null && exp.days < 0 ? "Vencido" : undefined}
            />
            <InfoTile
              icon={FlaskConical}
              label="Proveedor"
              value={lot.supplier || "—"}
              sub={
                lot.purchaseDate
                  ? `Compra: ${format(new Date(lot.purchaseDate), "dd/MM/yyyy", { locale: es })}`
                  : undefined
              }
            />
            <InfoTile
              icon={Package}
              label="Pureza del lote"
              value={lot.purity ?? lot.drug.purity ?? "—"}
              sub={lot.purity ? null : lot.drug.purity ? "(de la droga)" : undefined}
            />
          </div>

          {/* Trazabilidad: ciclo de vida del frasco */}
          <Separator className="my-5" />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Trazabilidad (ciclo de vida)
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <InfoTile
                icon={CalendarClock}
                label="Recibido"
                value={lot.receivedDate ? format(new Date(lot.receivedDate), "dd/MM/yyyy", { locale: es }) : "—"}
              />
              <InfoTile
                icon={PlayCircle}
                label="Apertura (habilitación)"
                value={lot.openedDate ? format(new Date(lot.openedDate), "dd/MM/yyyy", { locale: es }) : "—"}
              />
              <InfoTile
                icon={CheckCircle2}
                label="Consumido"
                value={lot.consumedDate ? format(new Date(lot.consumedDate), "dd/MM/yyyy", { locale: es }) : "—"}
              />
              <InfoTile
                icon={Ban}
                label="Dado de baja"
                value={lot.discardedDate ? format(new Date(lot.discardedDate), "dd/MM/yyyy", { locale: es }) : "—"}
              />
            </div>
          </div>

          {/* Observaciones del lote */}
          <Separator className="my-5" />
          <NotesSection lot={lot} canEdit={canEdit} />

          {/* Foto del envase */}
          <Separator className="my-5" />
          <ContainerPhotoSection lot={lot} canEdit={canEdit} />

          {/* Acciones rápidas */}
          {(canEdit || canConsume) && (
            <>
              <Separator className="my-5" />
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Acciones rápidas
                </p>
                <div className="flex flex-wrap gap-2">
                  {actions
                    .filter((a) => a.allowed)
                    .map((a) => (
                      <MovementDialog
                        key={a.type}
                        lot={lot}
                        type={a.type}
                        trigger={
                          <Button variant={a.variant} size="sm">
                            <a.icon className="mr-1.5 h-4 w-4" />
                            {a.label}
                          </Button>
                        }
                      />
                    ))}
                  {/* Editar droga: solo admin */}
                  {user?.role === "ADMIN" && (
                    <DrugEditButton drugId={lot.drug.id} drugData={lot.drug} />
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Movimientos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historial de movimientos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-96">
            {movements.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sin movimientos registrados
              </p>
            ) : (
              <div className="divide-y">
                {movements.map((m) => (
                  <MovementRow key={m.id} m={m} unit={lot.unit} />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

function MovementRow({ m, unit }: { m: Movement; unit: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Badge
        variant="outline"
        className={cn("shrink-0 text-[10px]", MOVEMENT_TYPE_COLORS[m.type])}
      >
        {MOVEMENT_TYPE_LABELS[m.type]}
      </Badge>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">
          {m.quantity} {unit}
          {m.balanceAfter != null && (
            <span className="ml-1 text-xs text-muted-foreground">
              · saldo {m.balanceAfter} {unit}
            </span>
          )}
        </p>
        <p className="truncate text-[11px] text-muted-foreground">
          {m.fromWarehouse?.name ?? "—"} → {m.toWarehouse?.name ?? "—"}
          {m.reason ? ` · ${m.reason}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] text-muted-foreground">{m.user?.name}</p>
        <p className="text-[10px] text-muted-foreground">
          {format(new Date(m.createdAt), "dd/MM/yy HH:mm", { locale: es })}
        </p>
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
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  sub?: string
  valueClass?: string
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-medium", valueClass)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

// Botón para editar la droga desde el detalle del lote (solo admin)
function DrugEditButton({ drugId, drugData }: { drugId: string; drugData: any }) {
  return <DrugFormDialog drug={drugData} />
}

function NotesSection({ lot, canEdit }: { lot: Lot; canEdit: boolean }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(lot.notes ?? "")
  const [saving, setSaving] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/lots/${lot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) throw new Error("Error al guardar las observaciones")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Observaciones guardadas")
      setEditing(false)
      qc.invalidateQueries({ queryKey: ["lot", lot.id] })
      qc.invalidateQueries({ queryKey: ["lots"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const startEdit = () => {
    setNotes(lot.notes ?? "")
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setNotes(lot.notes ?? "")
  }

  const save = () => {
    setSaving(true)
    saveMutation.mutate(undefined, {
      onSettled: () => setSaving(false),
    })
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Observaciones del lote
        </p>
        {canEdit && !editing && (
          <Button variant="ghost" size="sm" onClick={startEdit} className="h-7 text-xs">
            <Pencil className="mr-1 h-3 w-3" />
            {lot.notes ? "Editar" : "Agregar"}
          </Button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ej: Está húmedo, No funciona, Es prestado, Contaminado…"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
            <Button size="sm" variant="outline" onClick={cancelEdit}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : lot.notes ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="whitespace-pre-wrap text-sm text-amber-900 dark:text-amber-200">
            {lot.notes}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground/60">
          Sin observaciones. Ej: húmedo, prestado, contaminado, no funciona…
        </p>
      )}
    </div>
  )
}

function ContainerPhotoSection({
  lot,
  canEdit,
}: {
  lot: Lot
  canEdit: boolean
}) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/uploads", { method: "POST", body: fd })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(
          (e as { error?: string }).error || "Error al subir la imagen"
        )
      }
      const data = await res.json()
      const url = data.url as string
      const putRes = await fetch(`/api/lots/${lot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ containerPhoto: url }),
      })
      if (!putRes.ok) throw new Error("Error al guardar la foto")
      return putRes.json()
    },
    onSuccess: () => {
      toast.success("Foto del envase actualizada")
      qc.invalidateQueries({ queryKey: ["lot", lot.id] })
      qc.invalidateQueries({ queryKey: ["lots"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const removeMutation = useMutation({
    mutationFn: async () => {
      const putRes = await fetch(`/api/lots/${lot.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ containerPhoto: null }),
      })
      if (!putRes.ok) throw new Error("Error al eliminar la foto")
      return putRes.json()
    },
    onSuccess: () => {
      toast.success("Foto eliminada")
      qc.invalidateQueries({ queryKey: ["lot", lot.id] })
      qc.invalidateQueries({ queryKey: ["lots"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    uploadMutation.mutate(file, {
      onSettled: () => {
        setUploading(false)
        if (inputRef.current) inputRef.current.value = ""
      },
    })
  }

  // --- Cámara: abrir y cerrar ---
  const openCamera = async () => {
    setCameraOpen(true)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      })
      setStream(s)
      // Esperar a que el video element esté disponible
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = s
          videoRef.current.play().catch(() => {})
        }
      }, 100)
    } catch (e) {
      toast.error(
        "No se pudo acceder a la cámara. Verifique los permisos del navegador."
      )
      setCameraOpen(false)
    }
  }

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      setStream(null)
    }
    setCameraOpen(false)
  }

  // Capturar frame del video como imagen
  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, w, h)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("No se pudo capturar la foto")
          return
        }
        const file = new File([blob], `envase_${lot.lotNumber}.jpg`, {
          type: "image/jpeg",
        })
        setUploading(true)
        uploadMutation.mutate(file, {
          onSettled: () => {
            setUploading(false)
            closeCamera()
          },
        })
      },
      "image/jpeg",
      0.85
    )
  }

  // Limpiar cámara al desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [stream])

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">
        Foto del envase
      </p>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
          {lot.containerPhoto ? (
            <img
              src={lot.containerPhoto}
              alt={`Envase del lote ${lot.lotNumber}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <Camera className="h-8 w-8 text-muted-foreground/50" />
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {lot.containerPhoto
              ? "Foto actual del envase del lote."
              : "Aún no se cargó una foto del envase."}
          </p>
          {canEdit && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading || cameraOpen}
                >
                  {uploading && !cameraOpen ? (
                    <>
                      <Upload className="mr-1.5 h-4 w-4 animate-pulse" />
                      Subiendo…
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-1.5 h-4 w-4" />
                      Subir imagen
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCamera}
                  disabled={uploading || cameraOpen}
                >
                  <Camera className="mr-1.5 h-4 w-4" />
                  Tomar foto
                </Button>
                {lot.containerPhoto && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeMutation.mutate()}
                    disabled={removeMutation.isPending || uploading}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Eliminar
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de cámara */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">
                Captura del envase
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeCamera}
                className="text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
            </div>
            <div className="relative overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-auto max-h-[60vh] w-full object-contain"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex justify-center">
              <Button
                onClick={capturePhoto}
                disabled={uploading || !stream}
                className="min-w-[160px]"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <Camera className="mr-1.5 h-4 w-4" />
                    Capturar foto
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewLotDialog({ warehouses }: { warehouses: Warehouse[] }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [drugQuery, setDrugQuery] = useState("")
  const [drugId, setDrugId] = useState("")
  const [form, setForm] = useState({
    lotNumber: "",
    initialQuantity: "",
    unit: "g",
    expiryDate: "",
    supplier: "",
    purchaseDate: "",
    warehouseId: "",
    location: "",
    purity: "",
  })

  const { data: drugData, isLoading: drugsLoading } = useQuery({
    queryKey: ["drugs", drugQuery],
    queryFn: () => fetchDrugs(drugQuery),
    enabled: open,
  })
  const drugs = drugData?.drugs ?? []
  const selectedDrug = drugs.find((d) => d.id === drugId)

  const reset = () => {
    setDrugQuery("")
    setDrugId("")
    setForm({
      lotNumber: "",
      initialQuantity: "",
      unit: "g",
      expiryDate: "",
      supplier: "",
      purchaseDate: "",
      warehouseId: "",
      location: "",
      purity: "",
    })
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drugId,
          lotNumber: form.lotNumber,
          initialQuantity: Number(form.initialQuantity),
          unit: form.unit,
          expiryDate: form.expiryDate || undefined,
          supplier: form.supplier || undefined,
          purchaseDate: form.purchaseDate || undefined,
          warehouseId: form.warehouseId || undefined,
          location: form.location || undefined,
          purity: form.purity || undefined,
        }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(
          (e as { error?: string }).error || "Error al crear el lote"
        )
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Lote creado correctamente")
      setOpen(false)
      reset()
      qc.invalidateQueries({ queryKey: ["lots"] })
      qc.invalidateQueries({ queryKey: ["stats"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const canSubmit =
    drugId &&
    form.lotNumber.trim() &&
    Number(form.initialQuantity) > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" /> Nuevo lote
      </Button>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Nuevo lote</DialogTitle>
          <DialogDescription>
            Registre un nuevo lote de una droga del catálogo
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-4 pb-4">
            {/* Droga */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Droga *</Label>
              {selectedDrug ? (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {selectedDrug.chemicalName}
                    </p>
                    {selectedDrug.cas && (
                      <p className="text-xs text-muted-foreground">
                        CAS {selectedDrug.cas}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDrugId("")}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar droga por nombre, CAS…"
                      value={drugQuery}
                      onChange={(e) => setDrugQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border">
                    {drugsLoading ? (
                      <p className="p-3 text-sm text-muted-foreground">
                        Cargando…
                      </p>
                    ) : drugs.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground">
                        Sin resultados
                      </p>
                    ) : (
                      drugs.slice(0, 30).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setDrugId(d.id)}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                        >
                          <span className="font-medium">
                            {d.chemicalName}
                          </span>
                          {d.cas && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              CAS {d.cas}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Número de lote *">
                <Input
                  value={form.lotNumber}
                  onChange={(e) =>
                    setForm({ ...form, lotNumber: e.target.value })
                  }
                  placeholder="L-2024-001"
                />
              </Field>
              <Field label="Cantidad inicial *">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.initialQuantity}
                  onChange={(e) =>
                    setForm({ ...form, initialQuantity: e.target.value })
                  }
                  placeholder="500"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Unidad">
                <Select
                  value={form.unit}
                  onValueChange={(v) => setForm({ ...form, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Fecha de vencimiento">
                <Input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({ ...form, expiryDate: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Proveedor">
                <Input
                  value={form.supplier}
                  onChange={(e) =>
                    setForm({ ...form, supplier: e.target.value })
                  }
                  placeholder="Cicarelli"
                />
              </Field>
              <Field label="Fecha de compra">
                <Input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm({ ...form, purchaseDate: e.target.value })
                  }
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Depósito">
                <Select
                  value={form.warehouseId || "_"}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      warehouseId: v === "_" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default de la droga" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">
                      Default de la droga
                    </SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ubicación física">
                <Input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Estante A-3"
                />
              </Field>
              <Field
                label="Pureza / concentración"
                hint={
                  selectedDrug?.purity
                    ? `Por defecto: ${selectedDrug.purity}`
                    : undefined
                }
              >
                <Input
                  value={form.purity}
                  onChange={(e) =>
                    setForm({ ...form, purity: e.target.value })
                  }
                  placeholder="≥99,5%"
                />
              </Field>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
          >
            {mutation.isPending ? "Creando…" : "Crear lote"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

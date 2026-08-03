"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowLeftRight,
  Search,
  Plus,
  Filter,
  X,
  ArrowRight,
  Check,
  ChevronsUpDown,
  History,
  Package,
} from "lucide-react"
import {
  MOVEMENT_TYPES,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_COLORS,
  WAREHOUSE_TYPE_LABELS,
} from "@/lib/constants"
import { useAuth } from "@/components/app-provider"
import { toast } from "sonner"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type MovementType = keyof typeof MOVEMENT_TYPES

type Movement = {
  id: string
  type: string
  quantity: number
  balanceAfter: number | null
  reason: string | null
  createdAt: string
  lot: {
    id: string
    lotNumber: string
    unit: string
    drug: { id: string; chemicalName: string; commercialName: string | null }
  }
  user: { id: string; name: string } | null
  fromWarehouse: { id: string; name: string; code: string } | null
  toWarehouse: { id: string; name: string; code: string } | null
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
  currentQuantity: number
  unit: string
  expiryDate: string | null
  drug: { id: string; chemicalName: string; commercialName: string | null }
  warehouse: { id: string; name: string } | null
}

async function fetchMovements(params: {
  type?: string
  warehouseId?: string
  q?: string
}): Promise<{ movements: Movement[] }> {
  const sp = new URLSearchParams()
  if (params.type && params.type !== "ALL") sp.set("type", params.type)
  if (params.warehouseId && params.warehouseId !== "ALL")
    sp.set("warehouseId", params.warehouseId)
  sp.set("limit", "500")
  const url = `/api/movements${sp.toString() ? `?${sp.toString()}` : ""}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar movimientos")
  return res.json()
}

async function fetchWarehouses(): Promise<{ warehouses: Warehouse[] }> {
  const res = await fetch("/api/warehouses", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar depósitos")
  return res.json()
}

async function fetchActiveLots(): Promise<{ lots: Lot[] }> {
  const res = await fetch("/api/lots", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar lotes")
  return res.json()
}

export function Movements() {
  const { user } = useAuth()
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  const [warehouseFilter, setWarehouseFilter] = useState<string>("ALL")
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [registerOpen, setRegisterOpen] = useState(false)

  // simple debounce
  useMemo(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: whData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
  })
  const warehouses = whData?.warehouses ?? []

  const { data, isLoading, isError } = useQuery({
    queryKey: ["movements", typeFilter, warehouseFilter, debounced],
    queryFn: () =>
      fetchMovements({
        type: typeFilter,
        warehouseId: warehouseFilter,
        q: debounced || undefined,
      }),
  })

  // Filtro de texto en el cliente (sobre droga/lote/usuario/motivo)
  const movements = useMemo(() => {
    const list = data?.movements ?? []
    if (!debounced) return list
    const q = debounced.toLowerCase()
    return list.filter((m) => {
      return (
        m.lot?.drug?.chemicalName?.toLowerCase().includes(q) ||
        m.lot?.drug?.commercialName?.toLowerCase().includes(q) ||
        m.lot?.lotNumber?.toLowerCase().includes(q) ||
        m.user?.name?.toLowerCase().includes(q) ||
        m.reason?.toLowerCase().includes(q) ||
        m.fromWarehouse?.name?.toLowerCase().includes(q) ||
        m.toWarehouse?.name?.toLowerCase().includes(q)
      )
    })
  }, [data, debounced])

  // Contadores rápidos por tipo
  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    for (const m of movements) {
      map[m.type] = (map[m.type] ?? 0) + 1
    }
    return map
  }, [movements])

  const canRegister =
    user &&
    (user.role === "ADMIN" ||
      user.role === "ENCARGADO" ||
      user.role === "OPERARIO")

  const clearFilters = () => {
    setTypeFilter("ALL")
    setWarehouseFilter("ALL")
    setQuery("")
    setDebounced("")
  }

  const hasFilters =
    typeFilter !== "ALL" || warehouseFilter !== "ALL" || query !== ""

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ArrowLeftRight className="h-6 w-6 text-teal-600" />
            Movimientos
          </h1>
          <p className="text-sm text-muted-foreground">
            Trazabilidad completa del droguero
          </p>
        </div>
        {canRegister && (
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Registrar movimiento
          </Button>
        )}
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          label="Total"
          value={movements.length}
          tone="bg-muted text-foreground"
        />
        {(Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[]).map((t) => (
          <SummaryCard
            key={t}
            label={MOVEMENT_TYPE_LABELS[t]}
            value={byType[t] ?? 0}
            tone={MOVEMENT_TYPE_COLORS[t]}
          />
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" /> Filtros
          </div>
          <div className="w-full sm:w-48">
            <Label className="mb-1 block text-xs text-muted-foreground">
              Tipo
            </Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                {(Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[]).map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {MOVEMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-56">
            <Label className="mb-1 block text-xs text-muted-foreground">
              Depósito
            </Label>
            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Todos los depósitos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los depósitos</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[180px] flex-1">
            <Label className="mb-1 block text-xs text-muted-foreground">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Droga, lote, usuario, motivo…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 pl-8"
              />
            </div>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <X className="mr-1 h-4 w-4" /> Limpiar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm text-rose-600">
              Error al cargar los movimientos
            </p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : movements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <History className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {hasFilters
                ? "No hay movimientos que coincidan con los filtros"
                : "Aún no se registraron movimientos"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: tabla */}
          <Card className="hidden lg:block">
            <ScrollArea className="max-h-[70vh]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-background border-b">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Fecha / Hora</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Droga / Lote</th>
                    <th className="px-3 py-2 font-medium text-right">Cantidad</th>
                    <th className="px-3 py-2 font-medium">Origen → Destino</th>
                    <th className="px-3 py-2 font-medium">Usuario</th>
                    <th className="px-3 py-2 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-accent/40">
                      <td className="px-3 py-2.5 align-top">
                        <p className="font-medium">
                          {format(new Date(m.createdAt), "dd/MM/yyyy", { locale: es })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(m.createdAt), "HH:mm")}
                          {" · "}
                          {formatDistanceToNow(new Date(m.createdAt), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", MOVEMENT_TYPE_COLORS[m.type])}
                        >
                          {MOVEMENT_TYPE_LABELS[m.type] ?? m.type}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <p className="font-medium leading-tight">
                          {m.lot?.drug?.chemicalName}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {m.lot?.lotNumber}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-top text-right">
                        <p className="font-semibold">
                          {formatQty(m.type, m.quantity)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {m.lot?.unit}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="max-w-[120px] truncate">
                            {m.fromWarehouse?.name ?? "—"}
                          </span>
                          <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                          <span className="max-w-[120px] truncate">
                            {m.toWarehouse?.name ?? "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top text-xs">
                        {m.user?.name ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <p className="max-w-[260px] truncate text-xs text-muted-foreground">
                          {m.reason ?? "—"}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </Card>

          {/* Mobile: tarjetas */}
          <div className="space-y-2 lg:hidden">
            {movements.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-[10px]",
                            MOVEMENT_TYPE_COLORS[m.type]
                          )}
                        >
                          {MOVEMENT_TYPE_LABELS[m.type] ?? m.type}
                        </Badge>
                        <p className="font-semibold leading-tight">
                          {m.lot?.drug?.chemicalName}
                        </p>
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        Lote {m.lot?.lotNumber}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold">
                        {formatQty(m.type, m.quantity)} {m.lot?.unit}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(m.createdAt), "dd/MM/yy HH:mm", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {m.fromWarehouse?.name ?? "—"}
                      <ArrowRight className="h-3 w-3" />
                      {m.toWarehouse?.name ?? "—"}
                    </span>
                    <span>·</span>
                    <span>{m.user?.name ?? "—"}</span>
                  </div>
                  {m.reason && (
                    <p className="mt-1.5 line-clamp-2 rounded bg-muted/40 px-2 py-1 text-[11px]">
                      {m.reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {canRegister && (
        <RegisterMovementDialog open={registerOpen} onOpenChange={setRegisterOpen} />
      )}
    </div>
  )
}

function formatQty(type: string, qty: number): string {
  const v = Math.abs(qty)
  if (type === "AJUSTE") {
    return `${qty > 0 ? "+" : qty < 0 ? "−" : ""}${v}`
  }
  if (type === "CONSUMO" || type === "BAJA") {
    return `−${v}`
  }
  if (type === "INGRESO" || type === "DEVOLUCION") {
    return `+${v}`
  }
  return `${v}`
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: string
}) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", tone)}>
      <p className="truncate text-[10px] font-medium opacity-80">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  )
}

function RegisterMovementDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const qc = useQueryClient()
  const { data: lotsData } = useQuery({
    queryKey: ["lots", "ACTIVO", "register"],
    queryFn: fetchActiveLots,
    enabled: open,
  })
  const { data: whData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
    enabled: open,
  })

  const lots = (lotsData?.lots ?? []).filter(
    (l) => l.status === "ACTIVO" || l.status === "EN_USO"
  )
  const warehouses = whData?.warehouses ?? []

  const [lotId, setLotId] = useState<string>("")
  const [type, setType] = useState<string>("HABILITACION")
  const [quantity, setQuantity] = useState<string>("")
  const [toWarehouseId, setToWarehouseId] = useState<string>("")
  const [reason, setReason] = useState<string>("")
  const [newStock, setNewStock] = useState<string>("")
  const [comboOpen, setComboOpen] = useState(false)

  const selectedLot = lots.find((l) => l.id === lotId) || null

  const reset = () => {
    setLotId("")
    setType("HABILITACION")
    setQuantity("")
    setToWarehouseId("")
    setReason("")
    setNewStock("")
  }

  const isAjuste = type === "AJUSTE"
  const isTransfer = type === "TRANSFERENCIA"
  const isFullBottle = ["HABILITACION", "CONSUMO", "DEVOLUCION", "BAJA"].includes(type)

  const diff = isAjuste && selectedLot && newStock
    ? Number(newStock) - Number(selectedLot.currentQuantity)
    : 0

  const canSave = (() => {
    if (!lotId || !type) return false
    if (isAjuste) {
      if (!newStock || isNaN(Number(newStock))) return false
      if (!selectedLot) return false
      return true
    }
    if (isFullBottle) {
      // Frasco completo: solo necesita lote seleccionado
      if (!selectedLot) return false
      return true
    }
    // TRANSFERENCIA
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) return false
    if (isTransfer && !toWarehouseId) return false
    return true
  })()

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: any = {
        lotId,
        type,
        reason,
      }
      if (isAjuste) {
        body.diff = diff
        body.quantity = Math.abs(diff)
      } else if (isFullBottle) {
        // Frasco completo: la API usa el stock actual del lote
        body.quantity = selectedLot?.currentQuantity ?? 0
      } else {
        // TRANSFERENCIA
        body.quantity = Number(quantity)
        if (isTransfer) body.toWarehouseId = toWarehouseId
      }

      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Error al registrar movimiento")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Movimiento registrado")
      qc.invalidateQueries({ queryKey: ["movements"] })
      qc.invalidateQueries({ queryKey: ["lots"] })
      qc.invalidateQueries({ queryKey: ["stats"] })
      qc.invalidateQueries({ queryKey: ["alerts"] })
      reset()
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>
            Seleccione el lote y el tipo de movimiento a registrar
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-4 pb-4">
            {/* Lote (combobox buscable) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Lote *{" "}
                <span className="font-normal text-muted-foreground/70">
                  (solo lotes activos)
                </span>
              </Label>
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={comboOpen}
                    className="h-9 w-full justify-between font-normal"
                  >
                    {selectedLot ? (
                      <span className="truncate text-left">
                        {selectedLot.drug.chemicalName} —{" "}
                        <span className="font-mono">{selectedLot.lotNumber}</span>{" "}
                        <span className="text-muted-foreground">
                          ({selectedLot.currentQuantity} {selectedLot.unit})
                        </span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Buscar lote…
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por droga o lote…" />
                    <CommandList>
                      <CommandEmpty>No hay lotes activos.</CommandEmpty>
                      <CommandGroup>
                        {lots.map((l) => (
                          <CommandItem
                            key={l.id}
                            value={`${l.drug.chemicalName} ${l.lotNumber} ${l.drug.commercialName ?? ""}`}
                            onSelect={() => {
                              setLotId(l.id)
                              setComboOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                lotId === l.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm">
                                {l.drug.chemicalName}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                <span className="font-mono">{l.lotNumber}</span>{" "}
                                · {l.currentQuantity} {l.unit} ·{" "}
                                {l.warehouse?.name ?? "Sin depósito"}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {selectedLot && (
                <div className="rounded-md border bg-muted/30 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stock actual</span>
                    <span className="font-semibold">
                      {selectedLot.currentQuantity} {selectedLot.unit}
                    </span>
                  </div>
                  {selectedLot.expiryDate && (
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className="text-muted-foreground">Vencimiento</span>
                      <span>
                        {format(new Date(selectedLot.expiryDate), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo de movimiento *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "HABILITACION",
                      "CONSUMO",
                      "DEVOLUCION",
                      "TRANSFERENCIA",
                      "BAJA",
                      "AJUSTE",
                    ] as MovementType[]
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {MOVEMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAjuste ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Stock actual
                  </Label>
                  <Input
                    value={
                      selectedLot ? String(selectedLot.currentQuantity) : "—"
                    }
                    disabled
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Nuevo stock *
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
                <div className="col-span-2 rounded-md border bg-muted/30 p-2 text-xs">
                  Diferencia:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      diff > 0
                        ? "text-emerald-600"
                        : diff < 0
                        ? "text-rose-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {diff > 0 ? "+" : ""}
                    {diff} {selectedLot?.unit ?? ""}
                  </span>
                </div>
              </div>
            ) : isFullBottle ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-primary">
                  {type === "CONSUMO" && "Se consumirá todo el frasco completo."}
                  {type === "HABILITACION" && "Se habilitará el frasco para uso."}
                  {type === "DEVOLUCION" && "Se devolverá el frasco al depósito."}
                  {type === "BAJA" && "Se dará de baja el frasco completo."}
                </p>
                {selectedLot && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cantidad:{" "}
                    <span className="font-semibold">
                      {selectedLot.currentQuantity} {selectedLot.unit}
                    </span>
                    {(type === "CONSUMO" || type === "BAJA") && " → 0"}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Cantidad a transferir *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0"
                  className="h-9"
                />
                {selectedLot && (
                  <p className="text-[11px] text-muted-foreground">
                    Disponible: {selectedLot.currentQuantity} {selectedLot.unit}
                  </p>
                )}
              </div>
            )}

            {isTransfer && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Depósito destino *
                </Label>
                <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar depósito destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((w) => w.id !== selectedLot?.warehouse?.id)
                      .map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.code}) · {WAREHOUSE_TYPE_LABELS[w.type]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Motivo / observaciones
              </Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Indique el motivo del movimiento (opcional)"
              />
            </div>

            {!selectedLot && (
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                Primero seleccione un lote para habilitar el guardado.
              </p>
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !canSave}
          >
            {saveMutation.isPending ? "Guardando…" : "Registrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

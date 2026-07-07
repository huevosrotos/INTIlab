"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileBarChart,
  Download,
  Printer,
  Boxes,
  ArrowLeftRight,
  CalendarClock,
  TrendingDown,
  FileText,
  Inbox,
} from "lucide-react"
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_COLORS,
  LOT_STATUS_LABELS,
  LOT_STATUS_COLORS,
  EXPIRY_WARNING_DAYS,
} from "@/lib/constants"
import { toast } from "sonner"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type Lot = {
  id: string
  lotNumber: string
  currentQuantity: number
  initialQuantity: number
  unit: string
  expiryDate: string | null
  status: string
  location: string | null
  supplier: string | null
  drug: {
    id: string
    chemicalName: string
    commercialName: string | null
    cas: string | null
    minStock: number | null
    unit: string | null
  }
  warehouse: { id: string; name: string; code: string } | null
}

type Movement = {
  id: string
  type: string
  quantity: number
  reason: string | null
  createdAt: string
  lot: {
    id: string
    lotNumber: string
    unit: string
    drug: { id: string; chemicalName: string }
  }
  user: { id: string; name: string } | null
  fromWarehouse: { id: string; name: string; code: string } | null
  toWarehouse: { id: string; name: string; code: string } | null
}

type Warehouse = { id: string; name: string; code: string; type: string }

async function fetchLots(): Promise<{ lots: Lot[] }> {
  const res = await fetch("/api/lots", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar lotes")
  return res.json()
}

async function fetchMovements(): Promise<{ movements: Movement[] }> {
  const res = await fetch("/api/movements?limit=500", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar movimientos")
  return res.json()
}

async function fetchWarehouses(): Promise<{ warehouses: Warehouse[] }> {
  const res = await fetch("/api/warehouses", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar depósitos")
  return res.json()
}

export function Reports() {
  const [tab, setTab] = useState("inventory")

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <FileBarChart className="h-6 w-6 text-teal-600" />
          Reportes
        </h1>
        <p className="text-sm text-muted-foreground">
          Exporte e imprima reportes del droguero
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="inventory" className="gap-1.5">
            <Boxes className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Inventario</span>
          </TabsTrigger>
          <TabsTrigger value="movements" className="gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Movimientos</span>
          </TabsTrigger>
          <TabsTrigger value="expiry" className="gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Vencimientos</span>
          </TabsTrigger>
          <TabsTrigger value="lowstock" className="gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Stock bajo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <InventoryReport />
        </TabsContent>
        <TabsContent value="movements" className="mt-4">
          <MovementsReport />
        </TabsContent>
        <TabsContent value="expiry" className="mt-4">
          <ExpiryReport />
        </TabsContent>
        <TabsContent value="lowstock" className="mt-4">
          <LowStockReport />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* Utilidades CSV + impresión                                        */
/* ----------------------------------------------------------------- */

function downloadCSV(filename: string, rows: (string | number | null)[][]) {
  const escape = (v: string | number | null) => {
    if (v === null || v === undefined) return ""
    const s = String(v).replace(/"/g, '""')
    return /[",\n;]/.test(s) ? `"${s}"` : s
  }
  const csv = "\ufeff" + rows.map((r) => r.map(escape).join(";")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  toast.success("CSV generado")
}

function ReportToolbar({
  title,
  total,
  totalLabel,
  rows,
  filename,
  printId,
  children,
}: {
  title: string
  total?: number
  totalLabel?: string
  rows: (string | number | null)[][]
  filename: string
  printId: string
  children?: React.ReactNode
}) {
  return (
    <Card className="print:hidden">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {children}
        </div>
        <div className="flex items-center gap-2">
          {total !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {totalLabel ?? "Registros"}: {total}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCSV(filename, rows)}
          >
            <Download className="mr-1.5 h-4 w-4" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => printElement(printId)}
          >
            <Printer className="mr-1.5 h-4 w-4" /> Imprimir
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function printElement(id: string) {
  const el = document.getElementById(id)
  if (!el) {
    toast.error("No hay contenido para imprimir")
    return
  }
  const orig = document.body.innerHTML
  // Construye una página de impresión mínima con el contenido del reporte
  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow) {
    toast.error("Permita popups para imprimir")
    return
  }
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>DrogLab - Reporte</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { color: #555; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #f4f4f5; font-weight: 600; }
    tr:nth-child(even) td { background: #fafafa; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 9999px; font-size: 10px; border: 1px solid #ddd; background: #f4f4f5; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #14b8a6; padding-bottom: 8px; margin-bottom: 12px; }
    .brand { font-weight: 700; color: #0f766e; }
  </style></head><body>`)
  printWindow.document.write(`<div class="header"><div><h1>DrogLab</h1><div class="meta">Sistema de droguero de laboratorio</div></div><div class="meta">Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</div></div>`)
  printWindow.document.write(el.innerHTML)
  printWindow.document.write("</body></html>")
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 250)
}

function EmptyState({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Card className="print:hidden">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <Icon className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

function LoadingRows({ n = 5 }: { n?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(n)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* 1. Inventario actual                                              */
/* ----------------------------------------------------------------- */

function InventoryReport() {
  const [whFilter, setWhFilter] = useState<string>("ALL")
  const { data: lotsData, isLoading } = useQuery({
    queryKey: ["lots", "report", "inventory"],
    queryFn: fetchLots,
  })
  const { data: whData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
  })

  const lots = lotsData?.lots ?? []
  const warehouses = whData?.warehouses ?? []

  const filtered = useMemo(() => {
    return lots.filter((l) => {
      if (whFilter !== "ALL" && l.warehouse?.id !== whFilter) return false
      return true
    })
  }, [lots, whFilter])

  const totalStock = filtered.reduce((s, l) => s + l.currentQuantity, 0)

  const csvRows: (string | number | null)[][] = [
    [
      "Droga",
      "Lote",
      "Depósito",
      "Ubicación",
      "Cantidad",
      "Unidad",
      "Vencimiento",
      "Estado",
    ],
    ...filtered.map((l) => [
      l.drug.chemicalName,
      l.lotNumber,
      l.warehouse?.name ?? "—",
      l.location ?? "—",
      l.currentQuantity,
      l.unit,
      l.expiryDate ? format(new Date(l.expiryDate), "dd/MM/yyyy", { locale: es }) : "—",
      LOT_STATUS_LABELS[l.status] ?? l.status,
    ]),
  ]

  return (
    <div className="space-y-3">
      <ReportToolbar
        title="Inventario actual"
        total={filtered.length}
        totalLabel="Lotes"
        rows={csvRows}
        filename={`inventario_${format(new Date(), "yyyy-MM-dd")}.csv`}
        printId="print-inventory"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Inventario actual</span>
        </div>
        <div className="w-full sm:w-60">
          <Select value={whFilter} onValueChange={setWhFilter}>
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
        <Badge variant="outline" className="text-xs">
          Stock total: {totalStock}
        </Badge>
      </ReportToolbar>

      <Card className="print:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-3">
              <LoadingRows />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Inbox} label="No hay lotes en el inventario" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Droga</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="hidden md:table-cell">Depósito</TableHead>
                  <TableHead className="hidden lg:table-cell">Ubicación</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="hidden md:table-cell">Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">
                      {l.drug.chemicalName}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {l.lotNumber}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {l.warehouse?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      {l.location ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {l.currentQuantity} {l.unit}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {l.expiryDate
                        ? format(new Date(l.expiryDate), "dd/MM/yyyy", {
                            locale: es,
                          })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          LOT_STATUS_COLORS[l.status]
                        )}
                      >
                        {LOT_STATUS_LABELS[l.status] ?? l.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Print version */}
      <div id="print-inventory" className="hidden">
        <h2>Inventario actual de droguero</h2>
        <p className="meta">
          Depósito:{" "}
          {whFilter === "ALL"
            ? "Todos"
            : warehouses.find((w) => w.id === whFilter)?.name ?? "—"}{" "}
          · Lotes: {filtered.length} · Stock total: {totalStock}
        </p>
        <table>
          <thead>
            <tr>
              <th>Droga</th>
              <th>Lote</th>
              <th>Depósito</th>
              <th>Ubicación</th>
              <th>Cantidad</th>
              <th>Vencimiento</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>{l.drug.chemicalName}</td>
                <td>{l.lotNumber}</td>
                <td>{l.warehouse?.name ?? "—"}</td>
                <td>{l.location ?? "—"}</td>
                <td>
                  {l.currentQuantity} {l.unit}
                </td>
                <td>
                  {l.expiryDate
                    ? format(new Date(l.expiryDate), "dd/MM/yyyy", {
                        locale: es,
                      })
                    : "—"}
                </td>
                <td>
                  <span className="badge">
                    {LOT_STATUS_LABELS[l.status] ?? l.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* 2. Movimientos por período                                       */
/* ----------------------------------------------------------------- */

function MovementsReport() {
  const today = format(new Date(), "yyyy-MM-dd")
  const monthAgo = format(
    new Date(Date.now() - 30 * 86400000),
    "yyyy-MM-dd"
  )
  const [from, setFrom] = useState(monthAgo)
  const [to, setTo] = useState(today)
  const [typeFilter, setTypeFilter] = useState<string>("ALL")

  const { data, isLoading } = useQuery({
    queryKey: ["movements", "report"],
    queryFn: fetchMovements,
  })

  const movements = data?.movements ?? []

  const filtered = useMemo(() => {
    const fromD = from ? new Date(from + "T00:00:00") : null
    const toD = to ? new Date(to + "T23:59:59") : null
    return movements.filter((m) => {
      const d = new Date(m.createdAt)
      if (fromD && d < fromD) return false
      if (toD && d > toD) return false
      if (typeFilter !== "ALL" && m.type !== typeFilter) return false
      return true
    })
  }, [movements, from, to, typeFilter])

  const csvRows: (string | number | null)[][] = [
    ["Fecha", "Hora", "Tipo", "Droga", "Lote", "Cantidad", "Unidad", "Origen", "Destino", "Usuario", "Motivo"],
    ...filtered.map((m) => [
      format(new Date(m.createdAt), "dd/MM/yyyy", { locale: es }),
      format(new Date(m.createdAt), "HH:mm"),
      MOVEMENT_TYPE_LABELS[m.type] ?? m.type,
      m.lot?.drug?.chemicalName ?? "—",
      m.lot?.lotNumber ?? "—",
      m.quantity,
      m.lot?.unit ?? "",
      m.fromWarehouse?.name ?? "—",
      m.toWarehouse?.name ?? "—",
      m.user?.name ?? "—",
      m.reason ?? "",
    ]),
  ]

  return (
    <div className="space-y-3">
      <ReportToolbar
        title="Movimientos por período"
        total={filtered.length}
        totalLabel="Movimientos"
        rows={csvRows}
        filename={`movimientos_${from || "inicio"}_a_${to || "fin"}.csv`}
        printId="print-movements"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Movimientos por período</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 w-[150px]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 w-[150px]"
          />
        </div>
        <div className="w-full sm:w-44">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los tipos</SelectItem>
              {Object.entries(MOVEMENT_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ReportToolbar>

      <Card className="print:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-3">
              <LoadingRows />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Inbox} label="No hay movimientos en el período" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Droga / Lote</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="hidden md:table-cell">Origen → Destino</TableHead>
                  <TableHead className="hidden lg:table-cell">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">
                      <p className="font-medium">
                        {format(new Date(m.createdAt), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(m.createdAt), "HH:mm")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          MOVEMENT_TYPE_COLORS[m.type]
                        )}
                      >
                        {MOVEMENT_TYPE_LABELS[m.type] ?? m.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium leading-tight">
                        {m.lot?.drug?.chemicalName}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {m.lot?.lotNumber}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {m.quantity} {m.lot?.unit}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">
                      {m.fromWarehouse?.name ?? "—"} →{" "}
                      {m.toWarehouse?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      {m.user?.name ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div id="print-movements" className="hidden">
        <h2>Movimientos del período</h2>
        <p className="meta">
          Desde {from || "inicio"} hasta {to || "hoy"} · Tipo:{" "}
          {typeFilter === "ALL"
            ? "Todos"
            : MOVEMENT_TYPE_LABELS[typeFilter] ?? typeFilter}{" "}
          · Total: {filtered.length}
        </p>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Droga</th>
              <th>Lote</th>
              <th>Cantidad</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Usuario</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.id}>
                <td>
                  {format(new Date(m.createdAt), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })}
                </td>
                <td>{MOVEMENT_TYPE_LABELS[m.type] ?? m.type}</td>
                <td>{m.lot?.drug?.chemicalName ?? "—"}</td>
                <td>{m.lot?.lotNumber ?? "—"}</td>
                <td>
                  {m.quantity} {m.lot?.unit}
                </td>
                <td>{m.fromWarehouse?.name ?? "—"}</td>
                <td>{m.toWarehouse?.name ?? "—"}</td>
                <td>{m.user?.name ?? "—"}</td>
                <td>{m.reason ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* 3. Drogas por vencer                                              */
/* ----------------------------------------------------------------- */

function ExpiryReport() {
  const { data, isLoading } = useQuery({
    queryKey: ["lots", "report", "expiry"],
    queryFn: fetchLots,
  })

  const lots = (data?.lots ?? []).filter((l) => l.status === "ACTIVO" && l.expiryDate)

  const filtered = useMemo(() => {
    const now = new Date()
    return lots
      .filter((l) => {
        const days = differenceInDays(new Date(l.expiryDate!), now)
        return days <= EXPIRY_WARNING_DAYS // vence en 30 días o ya venció
      })
      .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime())
  }, [lots])

  const expiredCount = filtered.filter(
    (l) => new Date(l.expiryDate!) < new Date()
  ).length
  const soonCount = filtered.length - expiredCount

  const csvRows: (string | number | null)[][] = [
    ["Droga", "Lote", "Depósito", "Cantidad", "Unidad", "Vencimiento", "Días", "Estado"],
    ...filtered.map((l) => {
      const days = differenceInDays(new Date(l.expiryDate!), new Date())
      return [
        l.drug.chemicalName,
        l.lotNumber,
        l.warehouse?.name ?? "—",
        l.currentQuantity,
        l.unit,
        format(new Date(l.expiryDate!), "dd/MM/yyyy", { locale: es }),
        days,
        days < 0 ? "Vencido" : days <= 7 ? "Crítico" : "Próximo",
      ]
    }),
  ]

  return (
    <div className="space-y-3">
      <ReportToolbar
        title="Drogas por vencer"
        total={filtered.length}
        totalLabel="Lotes"
        rows={csvRows}
        filename={`vencimientos_${format(new Date(), "yyyy-MM-dd")}.csv`}
        printId="print-expiry"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Lotes que vencen en {EXPIRY_WARNING_DAYS} días (o ya vencidos)
          </span>
        </div>
        {expiredCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {expiredCount} vencido{expiredCount === 1 ? "" : "s"}
          </Badge>
        )}
        {soonCount > 0 && (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-700 text-xs dark:bg-amber-950/40 dark:text-amber-300"
          >
            {soonCount} próximo{soonCount === 1 ? "" : "s"}
          </Badge>
        )}
      </ReportToolbar>

      <Card className="print:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-3">
              <LoadingRows />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              label={`No hay lotes por vencer en los próximos ${EXPIRY_WARNING_DAYS} días`}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Droga</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="hidden md:table-cell">Depósito</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => {
                  const days = differenceInDays(new Date(l.expiryDate!), new Date())
                  const expired = days < 0
                  const critical = days >= 0 && days <= 7
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">
                        {l.drug.chemicalName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {l.lotNumber}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {l.warehouse?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {l.currentQuantity} {l.unit}
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-medium">
                          {format(new Date(l.expiryDate!), "dd/MM/yyyy", {
                            locale: es,
                        })}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDistanceToNow(new Date(l.expiryDate!), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            expired
                              ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                              : critical
                              ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                          )}
                        >
                          {expired
                            ? `Vencido (${Math.abs(days)}d)`
                            : critical
                            ? `Crítico (${days}d)`
                            : `${days}d`}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div id="print-expiry" className="hidden">
        <h2>Lotes por vencer</h2>
        <p className="meta">
          Vencidos: {expiredCount} · Próximos ({EXPIRY_WARNING_DAYS} días):{" "}
          {soonCount} · Total: {filtered.length}
        </p>
        <table>
          <thead>
            <tr>
              <th>Droga</th>
              <th>Lote</th>
              <th>Depósito</th>
              <th>Stock</th>
              <th>Vencimiento</th>
              <th>Días</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => {
              const days = differenceInDays(new Date(l.expiryDate!), new Date())
              return (
                <tr key={l.id}>
                  <td>{l.drug.chemicalName}</td>
                  <td>{l.lotNumber}</td>
                  <td>{l.warehouse?.name ?? "—"}</td>
                  <td>
                    {l.currentQuantity} {l.unit}
                  </td>
                  <td>
                    {format(new Date(l.expiryDate!), "dd/MM/yyyy", {
                      locale: es,
                    })}
                  </td>
                  <td>{days}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- */
/* 4. Stock bajo / agotado                                          */
/* ----------------------------------------------------------------- */

function LowStockReport() {
  const { data, isLoading } = useQuery({
    queryKey: ["lots", "report", "lowstock"],
    queryFn: fetchLots,
  })

  const lots = (data?.lots ?? []).filter((l) => l.status === "ACTIVO")

  const filtered = useMemo(() => {
    return lots
      .filter((l) => {
        const min = l.drug.minStock ?? 0
        return l.currentQuantity <= min
      })
      .sort((a, b) => {
        // Agotados primero, luego por ratio stock/minStock ascendente
        const aOut = a.currentQuantity <= 0
        const bOut = b.currentQuantity <= 0
        if (aOut !== bOut) return aOut ? -1 : 1
        const aMin = a.drug.minStock ?? 1
        const bMin = b.drug.minStock ?? 1
        return a.currentQuantity / aMin - b.currentQuantity / bMin
      })
  }, [lots])

  const outCount = filtered.filter((l) => l.currentQuantity <= 0).length
  const lowCount = filtered.length - outCount

  const csvRows: (string | number | null)[][] = [
    ["Droga", "Lote", "Depósito", "Stock actual", "Stock mínimo", "Unidad", "Estado"],
    ...filtered.map((l) => [
      l.drug.chemicalName,
      l.lotNumber,
      l.warehouse?.name ?? "—",
      l.currentQuantity,
      l.drug.minStock ?? 0,
      l.unit,
      l.currentQuantity <= 0 ? "AGOTADO" : "STOCK BAJO",
    ]),
  ]

  return (
    <div className="space-y-3">
      <ReportToolbar
        title="Stock bajo / agotado"
        total={filtered.length}
        totalLabel="Lotes"
        rows={csvRows}
        filename={`stock_bajo_${format(new Date(), "yyyy-MM-dd")}.csv`}
        printId="print-lowstock"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            Lotes con stock ≤ mínimo configurado
          </span>
        </div>
        {outCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {outCount} agotado{outCount === 1 ? "" : "s"}
          </Badge>
        )}
        {lowCount > 0 && (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-700 text-xs dark:bg-amber-950/40 dark:text-amber-300"
          >
            {lowCount} bajo{lowCount === 1 ? "" : "s"}
          </Badge>
        )}
      </ReportToolbar>

      <Card className="print:hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-3">
              <LoadingRows />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={TrendingDown}
              label="No hay lotes con stock bajo ni agotados. ¡Todo en orden!"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Droga</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="hidden md:table-cell">Depósito</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => {
                  const out = l.currentQuantity <= 0
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">
                        {l.drug.chemicalName}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {l.lotNumber}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {l.warehouse?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {l.currentQuantity} {l.unit}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-xs">
                        {l.drug.minStock ?? 0} {l.unit}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            out
                              ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                              : "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
                          )}
                        >
                          {out ? "Agotado" : "Stock bajo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div id="print-lowstock" className="hidden">
        <h2>Stock bajo / agotado</h2>
        <p className="meta">
          Agotados: {outCount} · Stock bajo: {lowCount} · Total: {filtered.length}
        </p>
        <table>
          <thead>
            <tr>
              <th>Droga</th>
              <th>Lote</th>
              <th>Depósito</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Unidad</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id}>
                <td>{l.drug.chemicalName}</td>
                <td>{l.lotNumber}</td>
                <td>{l.warehouse?.name ?? "—"}</td>
                <td>{l.currentQuantity}</td>
                <td>{l.drug.minStock ?? 0}</td>
                <td>{l.unit}</td>
                <td>{l.currentQuantity <= 0 ? "AGOTADO" : "STOCK BAJO"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

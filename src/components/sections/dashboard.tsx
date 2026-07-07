"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  FlaskConical,
  Boxes,
  Warehouse as WarehouseIcon,
  AlertTriangle,
  CalendarClock,
  TrendingDown,
  ArrowLeftRight,
  ShieldAlert,
  CheckCircle2,
  MapPin,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import {
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_COLORS,
  SEVERITY_COLORS,
  ALERT_TYPE_LABELS,
  WAREHOUSE_TYPE_LABELS,
} from "@/lib/constants"
import { Ghspictogram } from "@/components/ghs-pictograms"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type Stats = {
  counts: {
    drugs: number
    lots: number
    activeLots: number
    warehouses: number
    movements: number
    unresolvedAlerts: number
    expiringSoon: number
    lowStock: number
  }
  warehouseStats: Array<{ id: string; name: string; code: string; type: string; activeLotCount: number; distinctDrugs: number }>
  recentMovements: Array<any>
  alerts: Array<any>
}

async function fetchStats(): Promise<Stats> {
  const res = await fetch("/api/stats", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar estadísticas")
  return res.json()
}

export function Dashboard() {
  const { setSection, setInventoryWarehouseFilter } = useAppStore()
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: fetchStats, refetchInterval: 30000 })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const c = data!.counts

  const cards = [
    { label: "Drogas en catálogo", value: c.drugs, icon: FlaskConical, color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40", section: "catalog" as const },
    { label: "Lotes activos", value: c.activeLots, icon: Boxes, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40", section: "inventory" as const, sub: `${c.lots} en total` },
    { label: "Depósitos", value: c.warehouses, icon: WarehouseIcon, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/40", section: "warehouses" as const },
    { label: "Movimientos", value: c.movements, icon: ArrowLeftRight, color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40", section: "movements" as const },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-sm text-muted-foreground">
          Resumen general del droguero
        </p>
      </div>

      {/* Alertas destacadas */}
      {(c.unresolvedAlerts > 0 || c.expiringSoon > 0 || c.lowStock > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <AlertMini
            icon={ShieldAlert}
            label="Alertas activas"
            value={c.unresolvedAlerts}
            tone="rose"
            onClick={() => setSection("movements")}
          />
          <AlertMini
            icon={CalendarClock}
            label="Vencen en 30 días"
            value={c.expiringSoon}
            tone="amber"
            onClick={() => setSection("inventory")}
          />
          <AlertMini
            icon={TrendingDown}
            label="Stock agotado"
            value={c.lowStock}
            tone="rose"
            onClick={() => setSection("inventory")}
          />
        </div>
      )}

      {/* Tarjetas de conteo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => setSection(card.section)}
            className="group text-left"
          >
            <Card className="transition-all group-hover:shadow-md group-hover:border-primary/40">
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", card.color)}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold leading-none">{card.value}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{card.label}</p>
                  {card.sub && <p className="text-[10px] text-muted-foreground/70">{card.sub}</p>}
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Alertas recientes */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertas
            </CardTitle>
            {c.unresolvedAlerts > 0 && (
              <Badge variant="destructive" className="text-[10px]">{c.unresolvedAlerts} activas</Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[340px]">
              {data!.alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="text-sm text-muted-foreground">Sin alertas activas</p>
                </div>
              ) : (
                <div className="space-y-px">
                  {data!.alerts.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-accent/50">
                      <Badge variant="outline" className={cn("shrink-0 text-[10px]", SEVERITY_COLORS[a.severity])}>
                        {ALERT_TYPE_LABELS[a.type]}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs leading-snug">{a.message}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Movimientos recientes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ArrowLeftRight className="h-4 w-4 text-sky-500" />
              Movimientos recientes
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSection("movements")}>
              Ver todo
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[340px]">
              {data!.recentMovements.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Sin movimientos registrados
                </div>
              ) : (
                <div className="divide-y">
                  {data!.recentMovements.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <Badge variant="outline" className={cn("shrink-0 text-[10px]", MOVEMENT_TYPE_COLORS[m.type])}>
                        {MOVEMENT_TYPE_LABELS[m.type]}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {m.lot?.drug?.chemicalName}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          Lote {m.lot?.lotNumber} · {m.user?.name}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold">{m.quantity} {m.lot?.unit ?? ""}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Stock por depósito */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-violet-500" />
            Distribución por depósito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data!.warehouseStats.map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  setInventoryWarehouseFilter(w.id)
                  setSection("inventory")
                }}
                className="flex items-center justify-between rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{w.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {WAREHOUSE_TYPE_LABELS[w.type]} · {w.code}
                  </p>
                </div>
                <div className="ml-2 shrink-0 text-right">
                  <p className="text-lg font-bold leading-none">{w.activeLotCount}</p>
                  <p className="text-[10px] text-muted-foreground">lotes · {w.distinctDrugs} drogas</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AlertMini({
  icon: Icon,
  label,
  value,
  tone,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  tone: "rose" | "amber"
  onClick?: () => void
}) {
  const tones = {
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  }
  return (
    <button onClick={onClick} className={cn("flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-sm", tones[tone])}>
      <Icon className="h-5 w-5 shrink-0" />
      <div className="flex-1 text-left">
        <p className="text-xs font-medium opacity-80">{label}</p>
        <p className="text-xl font-bold leading-none">{value}</p>
      </div>
    </button>
  )
}

"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
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
  Warehouse as WarehouseIcon,
  Plus,
  Pencil,
  MapPin,
  User,
  Boxes,
  Star,
  PowerOff,
  ChevronRight,
} from "lucide-react"
import {
  WAREHOUSE_TYPES,
  WAREHOUSE_TYPE_LABELS,
} from "@/lib/constants"
import { useAppStore } from "@/store/app-store"
import { useAuth } from "@/components/app-provider"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Warehouse = {
  id: string
  name: string
  code: string
  type: string
  location: string | null
  description: string | null
  active: boolean
  responsibleId: string | null
  responsible: { id: string; name: string } | null
  _count?: { lots: number }
}

type UserLite = {
  id: string
  name: string
  email: string
  role: string
  active: boolean
}

async function fetchWarehouses(): Promise<{ warehouses: Warehouse[] }> {
  const res = await fetch("/api/warehouses", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar depósitos")
  return res.json()
}

async function fetchUsers(): Promise<{ users: UserLite[] }> {
  const res = await fetch("/api/users", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar usuarios")
  return res.json()
}

export function Warehouses() {
  const { user } = useAuth()
  const { setSection, setInventoryWarehouseFilter } = useAppStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
  })

  const canEdit =
    user && (user.role === "ADMIN" || user.role === "ENCARGADO")

  const warehouses = data?.warehouses ?? []
  // Ordenar: PRINCIPAL primero, luego por nombre
  const sorted = [...warehouses].sort((a, b) => {
    if (a.type === "PRINCIPAL" && b.type !== "PRINCIPAL") return -1
    if (a.type !== "PRINCIPAL" && b.type === "PRINCIPAL") return 1
    return a.name.localeCompare(b.name)
  })

  const openWarehouse = (wh: Warehouse) => {
    setInventoryWarehouseFilter(wh.id)
    setSection("inventory")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <WarehouseIcon className="h-6 w-6 text-teal-600" />
            Depósitos
          </h1>
          <p className="text-sm text-muted-foreground">
            {warehouses.length} depósito{warehouses.length === 1 ? "" : "s"} configurado
            {warehouses.length === 1 ? "" : "s"}
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Nuevo depósito
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-rose-600">
            Error al cargar los depósitos
          </CardContent>
        </Card>
      ) : warehouses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <WarehouseIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No hay depósitos registrados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((wh) => (
            <WarehouseCard
              key={wh.id}
              wh={wh}
              isOwn={user?.warehouseId === wh.id}
              canEdit={!!canEdit}
              onOpen={() => openWarehouse(wh)}
              onEdit={() => setEditing(wh)}
            />
          ))}
        </div>
      )}

      {canEdit && createOpen && (
        <WarehouseFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
      {canEdit && editing && (
        <WarehouseFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          warehouse={editing}
        />
      )}
    </div>
  )
}

function WarehouseCard({
  wh,
  isOwn,
  canEdit,
  onOpen,
  onEdit,
}: {
  wh: Warehouse
  isOwn: boolean
  canEdit: boolean
  onOpen: () => void
  onEdit: () => void
}) {
  const isPrincipal = wh.type === "PRINCIPAL"
  const lotCount = wh._count?.lots ?? 0

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all hover:shadow-md",
        isPrincipal
          ? "border-teal-300 dark:border-teal-800 ring-1 ring-teal-200/50 dark:ring-teal-900/40"
          : "hover:border-primary/40",
        !wh.active && "opacity-60"
      )}
    >
      {isPrincipal && (
        <div className="absolute right-0 top-0 bg-gradient-to-l from-teal-500 to-emerald-500 px-2.5 py-0.5 text-[10px] font-semibold text-white">
          PRINCIPAL
        </div>
      )}
      <CardContent className="flex flex-1 flex-col p-4">
        <button
          onClick={onOpen}
          className="flex-1 text-left"
          title="Ver inventario de este depósito"
        >
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isPrincipal
                  ? "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                  : "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
              )}
            >
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold leading-tight">{wh.name}</h3>
              <p className="font-mono text-[11px] text-muted-foreground">
                {wh.code}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {wh.location || "Sin ubicación"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {wh.responsible?.name || "Sin responsable"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Boxes className="h-3.5 w-3.5 shrink-0" />
              <span>
                {lotCount} {lotCount === 1 ? "lote" : "lotes"} asociado
                {lotCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </button>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex flex-wrap items-center gap-1">
            <Badge variant="outline" className="text-[10px]">
              {WAREHOUSE_TYPE_LABELS[wh.type] ?? wh.type}
            </Badge>
            {isOwn && (
              <Badge className="bg-teal-100 text-teal-700 text-[10px] hover:bg-teal-200 dark:bg-teal-950/50 dark:text-teal-300">
                <Star className="mr-0.5 h-2.5 w-2.5" /> Tu depósito
              </Badge>
            )}
            {!wh.active && (
              <Badge
                variant="outline"
                className="bg-slate-100 text-slate-600 text-[10px] dark:bg-slate-800 dark:text-slate-400"
              >
                <PowerOff className="mr-0.5 h-2.5 w-2.5" /> Inactivo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={onEdit}
              >
                <Pencil className="mr-1 h-3 w-3" /> Editar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-teal-600"
              onClick={onOpen}
            >
              Ver <ChevronRight className="ml-0.5 h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WarehouseFormDialog({
  open,
  onOpenChange,
  warehouse,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  warehouse?: Warehouse
}) {
  const qc = useQueryClient()
  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    enabled: open,
  })
  const users = (usersData?.users ?? []).filter((u) => u.active)

  const [form, setForm] = useState(() => ({
    name: warehouse?.name ?? "",
    code: warehouse?.code ?? "",
    type: warehouse?.type ?? "SECUNDARIO",
    location: warehouse?.location ?? "",
    description: warehouse?.description ?? "",
    responsibleId: warehouse?.responsibleId ?? "",
    active: warehouse?.active ?? true,
  }))

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = warehouse ? "PUT" : "POST"
      const url = warehouse
        ? `/api/warehouses/${warehouse.id}`
        : "/api/warehouses"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Error al guardar depósito")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(warehouse ? "Depósito actualizado" : "Depósito creado")
      qc.invalidateQueries({ queryKey: ["warehouses"] })
      qc.invalidateQueries({ queryKey: ["stats"] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {warehouse ? "Editar depósito" : "Nuevo depósito"}
          </DialogTitle>
          <DialogDescription>
            {warehouse
              ? "Modifique los datos del depósito"
              : "Complete los datos del nuevo depósito"}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre *">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Depósito Central"
              />
            </Field>
            <Field label="Código *">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="DC-01"
                className="font-mono"
              />
            </Field>
          </div>

          <Field label="Tipo de depósito">
            <Select
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(WAREHOUSE_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Ubicación">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Edificio B - Subsuelo - Sector 3"
            />
          </Field>

          <Field label="Descripción">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Notas internas del depósito (opcional)"
            />
          </Field>

          <Field label="Responsable">
            <Select
              value={form.responsibleId || "_"}
              onValueChange={(v) =>
                setForm({ ...form, responsibleId: v === "_" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">Sin responsable</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name} · {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {warehouse && (
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Switch
                id="wh-active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
              <Label htmlFor="wh-active" className="text-sm">
                Depósito activo
              </Label>
              <p className="ml-auto text-[11px] text-muted-foreground">
                Los inactivos no aparecen en altas nuevas
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name || !form.code}
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar"}
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

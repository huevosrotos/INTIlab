"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Users as UsersIcon,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Building2,
  Lock,
  UserCheck,
  UserX,
} from "lucide-react"
import { ROLE_LABELS } from "@/lib/constants"
import { useAuth } from "@/components/app-provider"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type UserRow = {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  warehouseId: string | null
  warehouse: { id: string; name: string; code: string } | null
  createdAt: string
}

type WarehouseLite = { id: string; name: string; code: string; type: string }

async function fetchUsers(): Promise<{ users: UserRow[] }> {
  const res = await fetch("/api/users", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar usuarios")
  return res.json()
}

async function fetchWarehouses(): Promise<{ warehouses: WarehouseLite[] }> {
  const res = await fetch("/api/warehouses", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar depósitos")
  return res.json()
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  ADMIN: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300",
  ENCARGADO:
    "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300",
  OPERARIO:
    "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300",
  AUDITOR:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
}

export function UsersSection() {
  const { user } = useAuth()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState<UserRow | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  })

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Acceso restringido a administradores
        </p>
      </div>
    )
  }

  const users = data?.users ?? []

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <UsersIcon className="h-6 w-6 text-teal-600" />
            Usuarios
          </h1>
          <p className="text-sm text-muted-foreground">
            {users.length} usuario{users.length === 1 ? "" : "s"} registrado
            {users.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-rose-600">
            Error al cargar los usuarios
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <UsersIcon className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No hay usuarios registrados
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop: tabla */}
          <Card className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Depósito</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const isSelf = u.id === user.id
                  return (
                    <TableRow
                      key={u.id}
                      className={cn(isSelf && "bg-teal-50/40 dark:bg-teal-950/10")}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback
                              className={cn(
                                "text-xs",
                                isSelf
                                  ? "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                                  : "bg-muted"
                              )}
                            >
                              {initials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-medium leading-tight">
                              {u.name}
                              {isSelf && (
                                <Badge className="bg-teal-100 text-teal-700 text-[9px] hover:bg-teal-200 dark:bg-teal-950/50 dark:text-teal-300">
                                  Tú
                                </Badge>
                              )}
                            </p>
                            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            ROLE_BADGE_COLORS[u.role] ?? ""
                          )}
                        >
                          {ROLE_LABELS[u.role] ?? u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {u.warehouse ? (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {u.warehouse.name}
                            <span className="font-mono text-[10px] text-muted-foreground">
                              ({u.warehouse.code})
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.active ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <UserCheck className="mr-0.5 h-2.5 w-2.5" /> Activo
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-600 text-[10px] dark:bg-slate-800 dark:text-slate-400"
                          >
                            <UserX className="mr-0.5 h-2.5 w-2.5" /> Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(u.createdAt), "dd/MM/yyyy", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => setEditing(u)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-rose-600 hover:text-rose-700"
                            onClick={() => setDeleting(u)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "No puede eliminar su propio usuario"
                                : "Eliminar"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: tarjetas */}
          <div className="space-y-2 lg:hidden">
            {users.map((u) => {
              const isSelf = u.id === user.id
              return (
                <Card
                  key={u.id}
                  className={cn(
                    isSelf &&
                      "border-teal-300 dark:border-teal-800 ring-1 ring-teal-200/50 dark:ring-teal-900/40"
                  )}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback
                          className={cn(
                            "text-xs",
                            isSelf
                              ? "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300"
                              : "bg-muted"
                          )}
                        >
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate font-semibold">{u.name}</p>
                          {isSelf && (
                            <Badge className="bg-teal-100 text-teal-700 text-[9px] hover:bg-teal-200 dark:bg-teal-950/50 dark:text-teal-300">
                              Tú
                            </Badge>
                          )}
                        </div>
                        <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                          <Mail className="h-3 w-3 shrink-0" />
                          {u.email}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              ROLE_BADGE_COLORS[u.role] ?? ""
                            )}
                          >
                            {ROLE_LABELS[u.role] ?? u.role}
                          </Badge>
                          {u.active ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-100 text-emerald-700 text-[10px] dark:bg-emerald-950/40 dark:text-emerald-300"
                            >
                              Activo
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-slate-100 text-slate-600 text-[10px] dark:bg-slate-800 dark:text-slate-400"
                            >
                              Inactivo
                            </Badge>
                          )}
                        </div>
                        {u.warehouse && (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {u.warehouse.name} ({u.warehouse.code})
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditing(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                          onClick={() => setDeleting(u)}
                          disabled={isSelf}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {createOpen && (
        <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
      {editing && (
        <UserFormDialog
          open={!!editing}
          onOpenChange={(o) => !o && setEditing(null)}
          user={editing}
        />
      )}
      {deleting && (
        <DeleteUserDialog
          user={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function UserFormDialog({
  open,
  onOpenChange,
  user,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  user?: UserRow
}) {
  const qc = useQueryClient()
  const { data: whData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
    enabled: open,
  })
  const warehouses = (whData?.warehouses ?? []).filter((w) => w.active)

  const [form, setForm] = useState(() => ({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role ?? "OPERARIO",
    warehouseId: user?.warehouseId ?? "",
    active: user?.active ?? true,
  }))

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = user ? "PUT" : "POST"
      const url = user ? `/api/users/${user.id}` : "/api/users"
      const body: any = {
        name: form.name,
        email: form.email,
        role: form.role,
        warehouseId: form.warehouseId || null,
        active: form.active,
      }
      if (form.password) body.password = form.password
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Error al guardar usuario")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(user ? "Usuario actualizado" : "Usuario creado")
      qc.invalidateQueries({ queryKey: ["users"] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {user ? "Editar usuario" : "Nuevo usuario"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Modifique los datos del usuario. Deje la contraseña vacía para no cambiarla."
              : "Complete los datos del nuevo usuario"}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 pb-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Nombre completo *
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="María Pérez"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="maria@lab.org"
              autoCapitalize="none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Contraseña{" "}
              {user && (
                <span className="text-muted-foreground/70">
                  (vacío = no cambiar)
                </span>
              )}
              {!user && "*"}
            </Label>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={user ? "••••••••" : "Mínimo 6 caracteres"}
                className="pl-8"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rol *</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Depósito asignado{" "}
              <span className="text-muted-foreground/70">(opcional)</span>
            </Label>
            <Select
              value={form.warehouseId || "_"}
              onValueChange={(v) =>
                setForm({ ...form, warehouseId: v === "_" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin depósito asignado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">Sin depósito asignado</SelectItem>
                {warehouses.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 rounded-md border p-3">
            <Switch
              id="user-active"
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
            <Label htmlFor="user-active" className="text-sm">
              Usuario activo
            </Label>
            <p className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              {form.active
                ? "Puede iniciar sesión"
                : "No puede iniciar sesión"}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={
              saveMutation.isPending ||
              !form.name ||
              !form.email ||
              (!user && !form.password)
            }
          >
            {saveMutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteUserDialog({
  user,
  onClose,
}: {
  user: UserRow
  onClose: () => void
}) {
  const qc = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Error al eliminar usuario")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Usuario eliminado")
      qc.invalidateQueries({ queryKey: ["users"] })
      onClose()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <AlertDialog
      open={true}
      onOpenChange={(o) => !o && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el
            usuario{" "}
            <span className="font-medium text-foreground">{user.name}</span> (
            {user.email}).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              deleteMutation.mutate()
            }}
            disabled={deleteMutation.isPending}
            className="bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-600"
          >
            {deleteMutation.isPending ? "Eliminando…" : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import { useState, useEffect } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { PictogramSelector } from "@/components/pictogram-selector"
import { Ghspictogram } from "@/components/ghs-pictograms"
import {
  Search,
  Plus,
  FlaskConical,
  ArrowLeft,
  Pencil,
  Boxes,
  MapPin,
  AlertTriangle,
  Package,
  FileText,
} from "lucide-react"
import {
  GHS_PICTOGRAMS,
  PHYSICAL_STATES,
  PHYSICAL_STATE_LABELS,
  UNITS,
  LOT_STATUS_COLORS,
  LOT_STATUS_LABELS,
} from "@/lib/constants"
import { useAppStore } from "@/store/app-store"
import { useAuth } from "@/components/app-provider"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type Drug = {
  id: string
  chemicalName: string
  commercialName: string | null
  cas: string | null
  formula: string | null
  molecularWeight: number | null
  purity: string | null
  physicalState: string | null
  hazardClass: string | null
  pictograms: string
  hStatements: string | null
  defaultWarehouseId: string | null
  defaultLocation: string | null
  minStock: number | null
  unit: string | null
  sdsUrl: string | null
  notes: string | null
  active: boolean
  lotCount: number
  activeLotCount: number
  totalStock: number
}

type Warehouse = {
  id: string
  name: string
  code: string
  type: string
}

async function fetchDrugs(q?: string): Promise<{ drugs: Drug[] }> {
  const url = q ? `/api/drugs?q=${encodeURIComponent(q)}` : "/api/drugs"
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Error")
  return res.json()
}

async function fetchDrug(id: string) {
  const res = await fetch(`/api/drugs/${id}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Error")
  return res.json()
}

async function fetchWarehouses() {
  const res = await fetch("/api/warehouses", { cache: "no-store" })
  if (!res.ok) throw new Error("Error")
  return res.json()
}

export function Catalog() {
  const { selectedDrugId, setSelectedDrugId } = useAppStore()
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data, isLoading } = useQuery({
    queryKey: ["drugs", debounced],
    queryFn: () => fetchDrugs(debounced),
  })

  if (selectedDrugId) {
    return <DrugDetail drugId={selectedDrugId} onBack={() => setSelectedDrugId(null)} />
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Catálogo de drogas</h1>
          <p className="text-sm text-muted-foreground">
            {data?.drugs.length ?? 0} drogas registradas
          </p>
        </div>
        <DrugFormDialog />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, CAS, fórmula…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setDebounced(e.target.value)
          }}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : data?.drugs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FlaskConical className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No se encontraron drogas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.drugs.map((d) => (
            <DrugCard key={d.id} drug={d} onClick={() => setSelectedDrugId(d.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function parsePictograms(p: string): string[] {
  try {
    return JSON.parse(p)
  } catch {
    return []
  }
}

function DrugCard({ drug, onClick }: { drug: Drug; onClick: () => void }) {
  const picts = parsePictograms(drug.pictograms)
  const lowStock = drug.minStock != null && drug.totalStock <= drug.minStock && drug.totalStock > 0
  const outStock = drug.totalStock <= 0
  return (
    <button onClick={onClick} className="group text-left">
      <Card className="h-full transition-all group-hover:shadow-md group-hover:border-primary/40">
        <CardContent className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold leading-tight">{drug.chemicalName}</h3>
              {drug.commercialName && (
                <p className="truncate text-xs text-muted-foreground">{drug.commercialName}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {picts.slice(0, 3).map((p) => (
                <Ghspictogram key={p} code={p} size={22} />
              ))}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {drug.cas && (
              <Badge variant="secondary" className="text-[10px] font-mono">CAS {drug.cas}</Badge>
            )}
            {drug.formula && (
              <Badge variant="outline" className="text-[10px] font-mono">{drug.formula}</Badge>
            )}
            {drug.physicalState && (
              <Badge variant="outline" className="text-[10px]">
                {PHYSICAL_STATE_LABELS[drug.physicalState] ?? drug.physicalState}
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between pt-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Stock total</p>
              <p className={cn("text-sm font-semibold", outStock && "text-rose-600", lowStock && "text-amber-600")}>
                {drug.totalStock} {drug.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Lotes</p>
              <p className="text-sm font-semibold">{drug.activeLotCount}/{drug.lotCount}</p>
            </div>
            {(lowStock || outStock) && (
              <AlertTriangle className={cn("h-4 w-4", outStock ? "text-rose-500" : "text-amber-500")} />
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  )
}

function DrugDetail({ drugId, onBack }: { drugId: string; onBack: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["drug", drugId],
    queryFn: () => fetchDrug(drugId),
  })
  const { setInventoryWarehouseFilter } = useAppStore()

  if (isLoading || !data) {
    return <Skeleton className="h-96 rounded-xl" />
  }

  const drug = data.drug
  const picts = parsePictograms(drug.pictograms)
  const hStatements = drug.hStatements ? JSON.parse(drug.hStatements) : []

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="h-8">
        <ArrowLeft className="mr-1 h-4 w-4" /> Volver al catálogo
      </Button>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold sm:text-2xl">{drug.chemicalName}</h1>
              {drug.commercialName && (
                <p className="text-sm text-muted-foreground">{drug.commercialName}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {drug.cas && <Badge variant="secondary" className="font-mono">CAS: {drug.cas}</Badge>}
                {drug.formula && <Badge variant="outline" className="font-mono">{drug.formula}</Badge>}
                {drug.physicalState && (
                  <Badge variant="outline">{PHYSICAL_STATE_LABELS[drug.physicalState]}</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DrugFormDialog drug={drug} />
            </div>
          </div>

          {/* Pictogramas */}
          {picts.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Pictogramas de peligro (SGA)</p>
              <div className="flex flex-wrap gap-3">
                {picts.map((p: string) => (
                  <div key={p} className="flex flex-col items-center gap-1">
                    <Ghspictogram code={p} size={56} />
                    <span className="text-[10px] text-muted-foreground">{GHS_PICTOGRAMS[p as keyof typeof GHS_PICTOGRAMS]?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Peso molecular" value={drug.molecularWeight ? `${drug.molecularWeight} g/mol` : "-"} />
            <InfoItem label="Pureza / concentración" value={drug.purity || "-"} />
            <InfoItem label="Clase de peligro" value={drug.hazardClass || "-"} />
            <InfoItem label="Ubicación predeterminada" value={drug.defaultLocation || "-"} icon={MapPin} />
            <InfoItem label="Stock mínimo" value={drug.minStock ? `${drug.minStock} ${drug.unit}` : "-"} icon={AlertTriangle} />
            <InfoItem label="Unidad" value={drug.unit || "-"} />
          </div>

          {hStatements.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Frases H</p>
              <div className="flex flex-wrap gap-1.5">
                {hStatements.map((h: string) => (
                  <Badge key={h} variant="outline" className="font-mono text-[10px]">{h}</Badge>
                ))}
              </div>
            </div>
          )}

          {drug.notes && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Notas</p>
              <p className="text-sm whitespace-pre-wrap rounded-lg bg-muted/50 p-3">{drug.notes}</p>
            </div>
          )}

          {drug.sdsUrl && (
            <a href={drug.sdsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <FileText className="h-4 w-4" /> Ver ficha de seguridad (SDS)
            </a>
          )}
        </CardContent>
      </Card>

      {/* Lotes */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Boxes className="h-4 w-4" /> Lotes ({drug.lots.length})
            </h2>
          </div>
          {drug.lots.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Esta droga no tiene lotes registrados
            </p>
          ) : (
            <div className="space-y-2">
              {drug.lots.map((lot: any) => {
                const expired = lot.expiryDate && new Date(lot.expiryDate) < new Date()
                return (
                  <div key={lot.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{lot.lotNumber}</span>
                        <Badge variant="outline" className={cn("text-[10px]", LOT_STATUS_COLORS[lot.status])}>
                          {LOT_STATUS_LABELS[lot.status]}
                        </Badge>
                        {expired && lot.status === "ACTIVO" && (
                          <Badge variant="destructive" className="text-[10px]">Vencido</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {lot.warehouse?.name ?? "Sin depósito"}
                        {lot.location ? ` · ${lot.location}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{lot.currentQuantity} / {lot.initialQuantity} {lot.unit}</p>
                      {lot.expiryDate && (
                        <p className={cn("text-[11px]", expired ? "text-rose-600 font-medium" : "text-muted-foreground")}>
                          Vence {format(new Date(lot.expiryDate), "dd/MM/yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}

function DrugFormDialog({ drug }: { drug?: any }) {
  const { user } = useAuth()
  const canEdit = user && (user.role === "ADMIN" || user.role === "ENCARGADO")
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { data: whData } = useQuery({ queryKey: ["warehouses"], queryFn: fetchWarehouses, enabled: open })
  const warehouses: Warehouse[] = whData?.warehouses ?? []

  const [form, setForm] = useState<any>(
    drug
      ? {
          ...drug,
          pictograms: parsePictograms(drug.pictograms),
          hStatements: drug.hStatements ? JSON.parse(drug.hStatements) : [],
        }
      : {
          chemicalName: "",
          commercialName: "",
          cas: "",
          formula: "",
          molecularWeight: "",
          purity: "",
          physicalState: "LIQUIDO",
          hazardClass: "",
          pictograms: [],
          hStatements: [],
          defaultWarehouseId: "",
          defaultLocation: "",
          minStock: 0,
          unit: "g",
          sdsUrl: "",
          notes: "",
          active: true,
        }
  )

  const saveMutation = useMutation({
    mutationFn: async () => {
      const method = drug ? "PUT" : "POST"
      const url = drug ? `/api/drugs/${drug.id}` : "/api/drugs"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Error al guardar")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(drug ? "Droga actualizada" : "Droga creada")
      setOpen(false)
      qc.invalidateQueries({ queryKey: ["drugs"] })
      qc.invalidateQueries({ queryKey: ["drug", drug?.id] })
      qc.invalidateQueries({ queryKey: ["stats"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (!canEdit) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {drug ? (
          <Button variant="outline" size="sm">
            <Pencil className="mr-1.5 h-4 w-4" /> Editar
          </Button>
        ) : (
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Nueva droga
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{drug ? "Editar droga" : "Nueva droga"}</DialogTitle>
          <DialogDescription>
            Complete los datos químicos y de seguridad de la droga
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-4 pb-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre químico *">
                <Input value={form.chemicalName} onChange={(e) => setForm({ ...form, chemicalName: e.target.value })} />
              </Field>
              <Field label="Nombre comercial">
                <Input value={form.commercialName} onChange={(e) => setForm({ ...form, commercialName: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Número CAS">
                <Input value={form.cas} onChange={(e) => setForm({ ...form, cas: e.target.value })} placeholder="64-17-5" />
              </Field>
              <Field label="Fórmula">
                <Input value={form.formula} onChange={(e) => setForm({ ...form, formula: e.target.value })} placeholder="C2H6O" />
              </Field>
              <Field label="Peso molecular (g/mol)">
                <Input type="number" step="0.01" value={form.molecularWeight} onChange={(e) => setForm({ ...form, molecularWeight: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Estado físico">
                <Select value={form.physicalState} onValueChange={(v) => setForm({ ...form, physicalState: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PHYSICAL_STATE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Pureza / concentración">
                <Input value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })} placeholder="≥99,5%" />
              </Field>
              <Field label="Unidad">
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Clase / categoría de peligro">
              <Input value={form.hazardClass} onChange={(e) => setForm({ ...form, hazardClass: e.target.value })} placeholder="Líquido inflamable cat. 2" />
            </Field>

            <div>
              <Label className="mb-2 block text-sm">Pictogramas SGA</Label>
              <PictogramSelector value={form.pictograms} onChange={(v) => setForm({ ...form, pictograms: v })} />
            </div>

            <Field label="Frases H (separadas por coma)">
              <Input
                value={form.hStatements.join(", ")}
                onChange={(e) => setForm({ ...form, hStatements: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                placeholder="H225, H319, H336"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Depósito predeterminado">
                <Select value={form.defaultWarehouseId || "_"} onValueChange={(v) => setForm({ ...form, defaultWarehouseId: v === "_" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_">Sin asignar</SelectItem>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>{w.name} ({w.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ubicación predeterminada">
                <Input value={form.defaultLocation} onChange={(e) => setForm({ ...form, defaultLocation: e.target.value })} placeholder="Estante A-3" />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Stock mínimo de alerta">
                <Input type="number" step="0.01" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
              </Field>
              <Field label="URL ficha de seguridad (SDS)">
                <Input value={form.sdsUrl} onChange={(e) => setForm({ ...form, sdsUrl: e.target.value })} placeholder="https://…" />
              </Field>
            </div>

            <Field label="Notas">
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </Field>

            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} id="active" />
              <Label htmlFor="active" className="text-sm">Droga activa</Label>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 border-t bg-muted/30 px-6 py-3">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.chemicalName}>
            {saveMutation.isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

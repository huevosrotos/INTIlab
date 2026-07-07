"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { MOVEMENT_TYPE_LABELS } from "@/lib/constants"

export type MovementType =
  | "CONSUMO"
  | "TRANSFERENCIA"
  | "DEVOLUCION"
  | "BAJA"
  | "AJUSTE"

type LotInfo = {
  id: string
  currentQuantity: number
  unit: string
  lotNumber: string
  warehouseId?: string | null
}

type Warehouse = { id: string; name: string; code: string }

async function fetchWarehouses(): Promise<{ warehouses: Warehouse[] }> {
  const res = await fetch("/api/warehouses", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar depósitos")
  return res.json()
}

const DESCRIPTIONS: Record<MovementType, string> = {
  CONSUMO: "Registre el consumo del lote. El stock disminuirá.",
  TRANSFERENCIA:
    "Mueva stock a otro depósito. Si la cantidad es parcial, se creará un sub-lote en destino.",
  DEVOLUCION: "Registre la devolución de material al lote. El stock aumentará.",
  BAJA: "Dé de baja parte o todo el lote (descarte, derrame, vencido, etc.).",
  AJUSTE:
    "Ajuste el inventario. Use valor negativo para restar y positivo para sumar.",
}

export function MovementDialog({
  lot,
  type,
  trigger,
  open,
  onOpenChange,
  onDone,
}: {
  lot: LotInfo
  type: MovementType
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (o: boolean) => void
  onDone?: () => void
}) {
  const qc = useQueryClient()
  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = open ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [quantity, setQuantity] = useState("")
  const [toWarehouseId, setToWarehouseId] = useState("")
  const [diff, setDiff] = useState("")
  const [reason, setReason] = useState("")

  const { data: whData } = useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
    enabled: isOpen && type === "TRANSFERENCIA",
  })
  const warehouses: Warehouse[] = whData?.warehouses ?? []

  const reset = () => {
    setQuantity("")
    setToWarehouseId("")
    setDiff("")
    setReason("")
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        lotId: lot.id,
        type,
        reason: reason || undefined,
      }
      if (type === "AJUSTE") {
        body.diff = Number(diff)
        body.quantity = Number(diff)
      } else {
        body.quantity = Number(quantity)
        if (type === "TRANSFERENCIA") body.toWarehouseId = toWarehouseId
      }
      const res = await fetch("/api/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(
          (e as { error?: string }).error || "Error al registrar el movimiento"
        )
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(`${MOVEMENT_TYPE_LABELS[type]} registrado correctamente`)
      setOpen(false)
      reset()
      qc.invalidateQueries({ queryKey: ["lots"] })
      qc.invalidateQueries({ queryKey: ["lot", lot.id] })
      qc.invalidateQueries({ queryKey: ["stats"] })
      qc.invalidateQueries({ queryKey: ["movements"] })
      onDone?.()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const needsWarehouse = type === "TRANSFERENCIA"
  const isAdjust = type === "AJUSTE"

  const canSubmit = isAdjust
    ? diff !== "" && !isNaN(Number(diff)) && Number(diff) !== 0
    : quantity !== "" &&
      Number(quantity) > 0 &&
      (!needsWarehouse || !!toWarehouseId)

  const newBalancePreview = isAdjust
    ? Math.max(0, lot.currentQuantity + (Number(diff) || 0))
    : type === "DEVOLUCION"
      ? lot.currentQuantity + (Number(quantity) || 0)
      : lot.currentQuantity - (Number(quantity) || 0)

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{MOVEMENT_TYPE_LABELS[type]}</DialogTitle>
          <DialogDescription>{DESCRIPTIONS[type]}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">
              Lote <span className="font-mono">{lot.lotNumber}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Stock actual:{" "}
              <span className="font-semibold text-foreground">
                {lot.currentQuantity} {lot.unit}
              </span>
            </p>
          </div>

          {isAdjust ? (
            <Field
              label="Diferencia (+ suma, − resta)"
              hint={`Nuevo stock: ${newBalancePreview} ${lot.unit}`}
            >
              <Input
                type="number"
                step="0.01"
                value={diff}
                onChange={(e) => setDiff(e.target.value)}
                placeholder="0"
              />
            </Field>
          ) : (
            <Field
              label={`Cantidad${
                type === "CONSUMO" || type === "BAJA"
                  ? ` (máx ${lot.currentQuantity})`
                  : ""
              }`}
              hint={`Nuevo stock: ${newBalancePreview} ${lot.unit}`}
            >
              <Input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </Field>
          )}

          {needsWarehouse && (
            <Field label="Depósito destino *">
              <Select value={toWarehouseId} onValueChange={setToWarehouseId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar depósito" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    .filter((w) => w.id !== lot.warehouseId)
                    .map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
          )}

          <Field label="Motivo / observación">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Opcional"
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !canSubmit}
          >
            {mutation.isPending ? "Procesando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

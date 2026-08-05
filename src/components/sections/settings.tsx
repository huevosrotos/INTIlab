"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Settings2, Mail, Bell, Server, Send, Save, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/app-provider"

async function fetchSettings() {
  const res = await fetch("/api/settings", { cache: "no-store" })
  if (!res.ok) throw new Error("Error al cargar configuración")
  return res.json()
}

export function SettingsSection() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})
  const [testEmail, setTestEmail] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    enabled: !!user && user.role === "ADMIN",
  })

  // Inicializar form cuando llegan los datos
  useState(() => {
    if (data?.settings && Object.keys(form).length === 0) {
      setForm(data.settings)
    }
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
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
      toast.success("Configuración guardada")
      qc.invalidateQueries({ queryKey: ["settings"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error || "Error al enviar email")
      }
      return res.json()
    },
    onSuccess: () => toast.success("Email de prueba enviado correctamente"),
    onError: (e: Error) => toast.error(e.message),
  })

  if (user?.role !== "ADMIN") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <Settings2 className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Solo los administradores pueden acceder a la configuración
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading || !data) {
    return <div className="space-y-4"><div className="h-32 animate-pulse rounded-xl bg-muted" /></div>
  }

  const currentForm = Object.keys(form).length > 0 ? form : data.settings
  const update = (key: string, value: string) => setForm({ ...currentForm, [key]: value })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Parámetros del sistema
        </p>
      </div>

      <Tabs defaultValue="email">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto">
          <TabsTrigger value="email" className="text-xs sm:text-sm">
            <Mail className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Email / SMTP</span>
            <span className="sm:hidden">Email</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs sm:text-sm">
            <Bell className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm">
            <Server className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* Email / SMTP */}
        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-5 w-5" />
                Configuración SMTP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Configure el servidor de email para enviar enlaces de recuperación de contraseña.
                Para Gmail, use una <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-primary underline">contraseña de aplicación</a>.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Servidor SMTP" hint="ej: smtp.gmail.com">
                  <Input
                    value={currentForm.smtp_host || ""}
                    onChange={(e) => update("smtp_host", e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </Field>
                <Field label="Puerto" hint="587 (TLS) o 465 (SSL)">
                  <Input
                    value={currentForm.smtp_port || "587"}
                    onChange={(e) => update("smtp_port", e.target.value)}
                    placeholder="587"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Usuario SMTP" hint="Tu email completo">
                  <Input
                    value={currentForm.smtp_user || ""}
                    onChange={(e) => update("smtp_user", e.target.value)}
                    placeholder="tu-email@gmail.com"
                  />
                </Field>
                <Field label="Contraseña SMTP" hint="Contraseña de aplicación (no tu password normal)">
                  <Input
                    type="password"
                    value={currentForm.smtp_pass || ""}
                    onChange={(e) => update("smtp_pass", e.target.value)}
                    placeholder="••••••••"
                  />
                </Field>
              </div>

              <Field label="Email remitente" hint="Email que aparece como remitente">
                <Input
                  value={currentForm.smtp_from || ""}
                  onChange={(e) => update("smtp_from", e.target.value)}
                  placeholder="tu-email@gmail.com"
                />
              </Field>

              <Separator />

              {/* Email de prueba */}
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Enviar email de prueba
                </p>
                <div className="flex flex-wrap gap-2">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="email@destino.com"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => testMutation.mutate()}
                    disabled={testMutation.isPending || !testEmail}
                  >
                    {testMutation.isPending ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 h-4 w-4" />
                    )}
                    Probar
                  </Button>
                </div>
              </div>

              <SaveButton onSave={() => saveMutation.mutate()} loading={saveMutation.isPending} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5" />
                Configuración de alertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field
                label="Días de anticipación para alertas de vencimiento"
                hint="Cuantos días antes del vencimiento se debe alertar"
              >
                <Input
                  type="number"
                  value={currentForm.alert_expiry_days || "30"}
                  onChange={(e) => update("alert_expiry_days", e.target.value)}
                  placeholder="30"
                />
              </Field>

              <SaveButton onSave={() => saveMutation.mutate()} loading={saveMutation.isPending} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5" />
                Configuración del sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Nombre del sistema">
                <Input
                  value={currentForm.system_name || "DrogLab"}
                  onChange={(e) => update("system_name", e.target.value)}
                  placeholder="DrogLab"
                />
              </Field>

              <Field
                label="Token de setup"
                hint="Token para inicializar la DB. Cambialo en producción."
              >
                <Input
                  value={currentForm.setup_token || ""}
                  onChange={(e) => update("setup_token", e.target.value)}
                  placeholder="droglab-setup-2024"
                  className="font-mono"
                />
              </Field>

              <SaveButton onSave={() => saveMutation.mutate()} loading={saveMutation.isPending} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  )
}

function SaveButton({ onSave, loading }: { onSave: () => void; loading: boolean }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onSave} disabled={loading}>
        {loading ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-1.5 h-4 w-4" />
        )}
        Guardar
      </Button>
    </div>
  )
}

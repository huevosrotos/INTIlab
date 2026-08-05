"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FlaskConical, Loader2, Lock, Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Estados: "login" | "forgot" | "reset"
  const [view, setView] = useState<"login" | "forgot" | "reset">("login")
  const [resetToken, setResetToken] = useState<string | null>(null)

  // Detectar ?reset=<token> en la URL
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const reset = params.get("reset")
    if (reset) {
      // Usar timeout para evitar setState sincrónico en effect
      setTimeout(() => {
        setResetToken(reset)
        setView("reset")
        window.history.replaceState({}, "", window.location.pathname)
      }, 0)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const res = await login(email, password)
    setLoading(false)
    if (!res.ok) {
      toast.error(res.error ?? "No se pudo iniciar sesión")
    } else {
      toast.success("Sesión iniciada")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-teal-50 via-background to-emerald-50 dark:from-teal-950/30 dark:via-background dark:to-emerald-950/30">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
              <FlaskConical className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">DrogLab</h1>
              <p className="text-sm text-muted-foreground">
                Gestión de droguero de laboratorio químico
              </p>
            </div>
          </div>

          {view === "login" && (
            <LoginCard
              email={email}
              password={password}
              setEmail={setEmail}
              setPassword={setPassword}
              loading={loading}
              onSubmit={handleSubmit}
              onForgot={() => setView("forgot")}
            />
          )}

          {view === "forgot" && (
            <ForgotPasswordCard onBack={() => setView("login")} />
          )}

          {view === "reset" && resetToken && (
            <ResetPasswordCard
              token={resetToken}
              onDone={() => {
                setResetToken(null)
                setView("login")
              }}
            />
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            DrogLab · Sistema de gestión de droguero · v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

function LoginCard({ email, password, setEmail, setPassword, loading, onSubmit, onForgot }: any) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Ingrese sus credenciales para acceder al sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="usuario@laboratorio.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <button
                type="button"
                onClick={onForgot}
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
                autoComplete="current-password"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ingresar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ForgotPasswordCard({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.devLink) {
        // En desarrollo sin SMTP, mostrar el link
        toast.info(`Modo desarrollo: ${data.devLink}`)
      } else if (data.ok) {
        setSent(true)
        toast.success("Si el email existe, recibirá un enlace de recuperación")
      } else {
        toast.error(data.error || "Error al enviar el email")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="shadow-lg">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Email enviado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Si el email <strong>{email}</strong> está registrado, recibirá
              un enlace para restablecer su contraseña. Revise su casilla
              (incluyendo spam).
            </p>
          </div>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver al login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Recuperar contraseña</CardTitle>
        <CardDescription>
          Ingrese su email y le enviaremos un enlace para restablecer su contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Correo electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="usuario@laboratorio.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando…</>
            ) : (
              <><Mail className="mr-2 h-4 w-4" />Enviar enlace</>
            )}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Volver al login
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ResetPasswordCard({ token, onDone }: { token: string; onDone: () => void }) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (password.length < 4) {
      toast.error("La contraseña debe tener al menos 4 caracteres")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success("Contraseña restablecida. Inicie sesión.")
        onDone()
      } else {
        toast.error(data.error || "Error al restablecer")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Nueva contraseña
        </CardTitle>
        <CardDescription>
          Ingrese su nueva contraseña
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-9"
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            Restablecer contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

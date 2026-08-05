"use client"

import { useState } from "react"
import { useAuth } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FlaskConical, Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"

export function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

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

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Iniciar sesión</CardTitle>
              <CardDescription>
                Ingrese sus credenciales para acceder al sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="password">Contraseña</Label>
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

              <div className="mt-6 rounded-lg border border-dashed bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground text-center">
                  Si olvidó su contraseña, contacte al administrador del sistema.
                </p>
              </div>
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            DrogLab · Sistema de gestión de droguero · v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

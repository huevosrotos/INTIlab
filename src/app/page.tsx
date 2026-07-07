"use client"

import { useAuth } from "@/components/app-provider"
import { AppShell } from "@/components/app-shell"
import { LoginScreen } from "@/components/sections/login"

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando DrogLab…</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen />
  return <AppShell />
}

"use client"

import { useAuth } from "@/components/app-provider"
import { useAppStore, type Section } from "@/store/app-store"
import {
  LayoutDashboard,
  FlaskConical,
  Boxes,
  ScanLine,
  QrCode,
  ArrowLeftRight,
  Warehouse as WarehouseIcon,
  FileBarChart,
  Users,
  HelpCircle,
  Settings2,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ROLE_LABELS } from "@/lib/constants"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"
import { Dashboard } from "@/components/sections/dashboard"
import { Catalog } from "@/components/sections/catalog"
import { Inventory } from "@/components/sections/inventory"
import { Scanner } from "@/components/sections/scanner"
import { Labels } from "@/components/sections/labels"
import { Movements } from "@/components/sections/movements"
import { Warehouses } from "@/components/sections/warehouses"
import { Reports } from "@/components/sections/reports"
import { UsersSection } from "@/components/sections/users"
import { Help } from "@/components/sections/help"
import { SettingsSection } from "@/components/sections/settings"

interface NavItem {
  id: Section
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Panel", icon: LayoutDashboard },
  { id: "inventory", label: "Inventario", icon: Boxes },
  { id: "scanner", label: "Escanear QR", icon: ScanLine },
  { id: "labels", label: "Etiquetas QR", icon: QrCode },
  { id: "movements", label: "Movimientos", icon: ArrowLeftRight },
  { id: "warehouses", label: "Depósitos", icon: WarehouseIcon },
  { id: "reports", label: "Reportes", icon: FileBarChart },
  { id: "users", label: "Usuarios", icon: Users, adminOnly: true },
  { id: "settings", label: "Configuración", icon: Settings2, adminOnly: true },
  { id: "help", label: "Ayuda", icon: HelpCircle },
]

export function AppShell() {
  const { user, logout } = useAuth()
  const { section, setSection } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const items = NAV_ITEMS.filter((i) => !i.adminOnly || user.role === "ADMIN")
  const readOnly = user.role === "AUDITOR"

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const go = (s: Section) => {
    setSection(s)
    setMobileOpen(false)
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* Top bar (mobile + desktop) */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-3 sm:px-4 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle className="flex items-center gap-2">
                <BrandMark />
                INTILab
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-4 flex flex-col gap-1 px-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    section === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <BrandMark className="h-6 w-6" />
          <span className="font-semibold">INTILab</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:inline-flex">
            {ROLE_LABELS[user.role] ?? user.role}
          </Badge>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-xs">{initials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-background lg:flex">
          <div className="flex h-16 items-center gap-2.5 border-b px-5">
            <BrandMark className="h-7 w-7" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight">INTILab</span>
              <span className="text-[11px] text-muted-foreground">
                Droguero de laboratorio
              </span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  section === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="border-t p-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => logout()}
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden pb-20 lg:pb-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {readOnly && section !== "dashboard" && section !== "inventory" && section !== "movements" && section !== "reports" && section !== "warehouses" ? (
              <ReadOnlyNotice />
            ) : (
              renderSection(section)
            )}
          </div>
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-stretch border-t bg-background lg:hidden">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon
          const active = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

const MOBILE_NAV: NavItem[] = [
  { id: "dashboard", label: "Panel", icon: LayoutDashboard },
  { id: "inventory", label: "Inventario", icon: Boxes },
  { id: "scanner", label: "Escanear", icon: ScanLine },
  { id: "labels", label: "Etiquetas", icon: QrCode },
  { id: "reports", label: "Más", icon: FileBarChart },
]

function renderSection(section: Section) {
  switch (section) {
    case "dashboard":
      return <Dashboard />
    case "inventory":
      return <Inventory />
    case "scanner":
      return <Scanner />
    case "labels":
      return <Labels />
    case "movements":
      return <Movements />
    case "warehouses":
      return <Warehouses />
    case "reports":
      return <Reports />
    case "users":
      return <UsersSection />
    case "help":
      return <Help />
    case "settings":
      return <SettingsSection />
    default:
      return <Dashboard />
  }
}

function ReadOnlyNotice() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-20 text-center">
      <ShieldCheck className="h-10 w-10 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Su rol de auditor es de solo lectura.
      </p>
    </div>
  )
}

function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="INTILab"
      className={cn("rounded-lg object-contain", className ?? "h-7 w-7")}
    />
  )
}

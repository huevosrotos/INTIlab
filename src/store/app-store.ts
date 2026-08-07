"use client"

import { create } from "zustand"

export type Section =
  | "dashboard"
  | "catalog"
  | "inventory"
  | "scanner"
  | "labels"
  | "movements"
  | "warehouses"
  | "reports"
  | "users"
  | "help"
  | "settings"

interface AppState {
  section: Section
  setSection: (s: Section) => void
  selectedDrugId: string | null
  setSelectedDrugId: (id: string | null) => void
  activeLotId: string | null
  setActiveLotId: (id: string | null) => void
  inventoryWarehouseFilter: string | "ALL"
  setInventoryWarehouseFilter: (w: string | "ALL") => void
  mobileNavOpen: boolean
  setMobileNavOpen: (o: boolean) => void
  // QR pendiente: cuando se escanea desde fuera (URL ?qr=DL-XXXX),
  // se guarda acá para que el Scanner lo procese al montar.
  pendingQr: string | null
  setPendingQr: (qr: string | null) => void
  // Vista del inventario: "lots" o "drugs". Se preserva al volver del detalle.
  inventoryViewMode: "lots" | "drugs"
  setInventoryViewMode: (m: "lots" | "drugs") => void
  // Scroll Y del listado de inventario. Se preserva al volver del detalle.
  inventoryScrollY: number
  setInventoryScrollY: (y: number) => void
}

export const useAppStore = create<AppState>((set) => ({
  section: "dashboard",
  setSection: (section) => set({ section }),
  selectedDrugId: null,
  setSelectedDrugId: (selectedDrugId) => set({ selectedDrugId }),
  activeLotId: null,
  setActiveLotId: (activeLotId) => set({ activeLotId }),
  inventoryWarehouseFilter: "ALL",
  setInventoryWarehouseFilter: (inventoryWarehouseFilter) =>
    set({ inventoryWarehouseFilter }),
  mobileNavOpen: false,
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  pendingQr: null,
  setPendingQr: (pendingQr) => set({ pendingQr }),
  inventoryViewMode: "lots",
  setInventoryViewMode: (inventoryViewMode) => set({ inventoryViewMode }),
  inventoryScrollY: 0,
  setInventoryScrollY: (inventoryScrollY) => set({ inventoryScrollY }),
}))

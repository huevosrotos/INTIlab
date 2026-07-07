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
}))

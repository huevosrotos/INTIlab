"use client"

import { GHS_PICTOGRAMS } from "@/lib/constants"
import { Ghspictogram } from "@/components/ghs-pictograms"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

type Props = {
  value: string[]
  onChange: (v: string[]) => void
}

export function PictogramSelector({ value, onChange }: Props) {
  const toggle = (key: string) => {
    if (value.includes(key)) onChange(value.filter((k) => k !== key))
    else onChange([...value, key])
  }
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
      {Object.values(GHS_PICTOGRAMS).map((p) => {
        const selected = value.includes(p.key)
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => toggle(p.key)}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-input hover:border-primary/40 hover:bg-accent"
            )}
          >
            {selected && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            )}
            <Ghspictogram code={p.key} size={40} />
            <span className="text-[9px] leading-tight text-muted-foreground">{p.label}</span>
          </button>
        )
      })}
    </div>
  )
}

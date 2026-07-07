import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err } from "@/lib/api-helpers"

export async function GET() {
  const r = await requireUser()
  if (!r.ok) return r.res
  const warehouses = await db.warehouse.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      responsible: { select: { id: true, name: true } },
      _count: { select: { lots: true } },
    },
  })
  return NextResponse.json({ warehouses })
}

export async function POST(req: NextRequest) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const body = await req.json()
  if (!body.name || !body.code) return err("Nombre y código son obligatorios")
  const existing = await db.warehouse.findUnique({ where: { code: body.code } })
  if (existing) return err("Ya existe un depósito con ese código")

  const warehouse = await db.warehouse.create({
    data: {
      name: body.name,
      code: body.code,
      type: body.type || "SECUNDARIO",
      location: body.location || null,
      description: body.description || null,
      responsibleId: body.responsibleId || null,
    },
  })
  return NextResponse.json({ warehouse })
}

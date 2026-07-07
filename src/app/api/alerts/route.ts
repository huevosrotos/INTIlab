import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, err } from "@/lib/api-helpers"

export async function GET(req: NextRequest) {
  const r = await requireUser()
  if (!r.ok) return r.res
  const { searchParams } = new URL(req.url)
  const onlyUnresolved = searchParams.get("unresolved") === "1"

  const alerts = await db.alert.findMany({
    where: onlyUnresolved ? { resolved: false } : undefined,
    orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
    include: {
      lot: { include: { drug: true, warehouse: true } },
    },
    take: 200,
  })
  return NextResponse.json({ alerts })
}

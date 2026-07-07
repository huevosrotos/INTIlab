import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireUser, requireEditor, err } from "@/lib/api-helpers"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const { id } = await params
  const alert = await db.alert.update({
    where: { id },
    data: { resolved: true, resolvedAt: new Date() },
  })
  return NextResponse.json({ alert })
}

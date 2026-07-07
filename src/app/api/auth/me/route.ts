import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      warehouseId: user.warehouseId,
      warehouse: user.warehouse
        ? {
            id: user.warehouse.id,
            name: user.warehouse.name,
            code: user.warehouse.code,
            type: user.warehouse.type,
          }
        : null,
    },
  })
}

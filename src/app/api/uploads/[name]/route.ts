import { NextRequest, NextResponse } from "next/server"
import { getUploadFile } from "@/lib/uploads"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params
  const buf = await getUploadFile(name)
  if (!buf) return new NextResponse("No encontrado", { status: 404 })
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

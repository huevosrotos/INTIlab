import { NextRequest, NextResponse } from "next/server"
import { requireEditor, err } from "@/lib/api-helpers"
import { saveUploadFile } from "@/lib/uploads"

export async function POST(req: NextRequest) {
  const r = await requireEditor()
  if (!r.ok) return r.res
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return err("No se recibió ningún archivo")
  if (file.size > 8 * 1024 * 1024) return err("El archivo supera los 8 MB")
  const url = await saveUploadFile(file, "env")
  return NextResponse.json({ url })
}

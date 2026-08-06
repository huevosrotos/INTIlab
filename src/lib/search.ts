// Helper para normalizar texto: quita acentos y pasa a minúsculas
// para búsquedas insensibles a acentos y mayúsculas/minúsculas.
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar diacríticos (acentos)
    .trim()
}

// Filtra un array de objetos normalizando el texto de búsqueda y los campos.
// fields: función que devuelve los strings a comparar para cada item.
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  fields: (item: T) => string[]
): T[] {
  const q = normalizeText(query)
  if (!q) return items
  return items.filter((item) =>
    fields(item).some((field) => normalizeText(field).includes(q))
  )
}

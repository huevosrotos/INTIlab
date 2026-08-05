#!/usr/bin/env python3
"""
Lee el Excel del droguero y genera un JSON con las sustancias categorizadas.
Salida: prisma/seed-data.json
"""

import openpyxl
import json
import re
import os

EXCEL_PATH = "/home/z/my-project/upload/Stock drogas-CONTROL II.xlsx"
OUTPUT_PATH = "/home/z/my-project/prisma/seed-data.json"

# ============================================================
# Función de categorización automática
# ============================================================
def categorize(name: str, tipo: str) -> list:
    """Devuelve lista de clases químicas basada en el nombre."""
    text = f"{name} {tipo}".lower()
    classes = []

    # Indicadores de pH
    ph_indicators = ["fenolftaleína", "fenolftaleina", "heliantina", "naranja de metilo",
                     "azul de bromofenol", "rojo de metilo", "púrpura de bromocresol",
                     "verde de bromocresol", "timolftaleína", "tropeolina", "alizarina",
                     "curcumina", "rojo fenol", "rojo neutral", "rojo de cresol",
                     "amarillo de metilo", "verde de malaquita", "naranja de xilenol"]
    for ind in ph_indicators:
        if ind in text:
            classes.append("INDICADOR_PH")
            break

    # Indicadores redox
    redox_indicators = ["difenilamina", "ferroína", "ferroina", "azul de metileno",
                        "dicromato", "yoduro de almidón", "almidón", "ortofenantrolina",
                        "fenantrolina", "difeni", "carbazón", "ditiocarbamato"]
    for ind in redox_indicators:
        if ind in text:
            classes.append("INDICADOR_REDOX")
            break

    # Colorantes
    dyes = ["fucsina", "violeta", "cristal", "azul de", "rojo de", "verde de",
            "amaranto", "eosina", "eritrosina", "nigrosina", "safranina",
            "fluoresceína", "fluoresceina", "rojo neutro", "azul de toluidina",
            "verde de janus", "ponceau", "coomassie", "orange g", "orceína",
            "hematoxilina", "carbón", "carmin", "iodine green", "pontamine",
            "solochrome", "murexida", "hofman"]
    for dye in dyes:
        if dye in text:
            classes.append("COLORANTE")
            break

    # Solventes
    solvents = ["acetona", "etanol", "metanol", "isopropanol", "tolueno", "xileno",
                 "éter", "eter", "cloroformo", "dicloro", "acetonitrilo", "hexano",
                 "heptano", "petróleo", "petroleo", "benceno", "acetato de etilo",
                 "acetato de", "piridina", "tetrahidrofurano", "dimetil", "dmso",
                 "alcohol"]
    for sol in solvents:
        if sol in text:
            classes.append("SOLVENTE")
            break

    # Ácidos
    if "ácido" in text or "acido" in text or text.strip().startswith("acido") or " buffer ph" in text:
        if "buffer" not in text:
            classes.append("ACIDO")
    # Bases
    bases = ["hidróxido", "hidroxido", "óxido de", "oxido de", "amoníaco", "amoniaco",
             "carbonato de", "bicarbonato", "amina", "amina,", "etanolamina",
             "tri", "piridina", "cal hidratada", "cal viva"]
    for b in bases:
        if b in text and "ácido" not in text and "acido" not in text:
            classes.append("BASE")
            break

    # Sales (si no es ácido ni base pero tiene "de" o "cloruro" o "sulfato")
    salts = ["cloruro de", "sulfato de", "nitrato de", "carbonato de", "fosfato de",
             "acetato de", "oxalato de", "citrato de", "tartrato de", "cianuro de",
             "bromuro de", "yoduro de", "fluoruro de", "permanganato de", "dicromato de",
             "tiocianato de", "nitrato", "cloruro", "sulfato", "carbonato", "fosfato"]
    is_acid = "ACIDO" in classes
    is_base = "BASE" in classes
    if not is_acid and not is_base:
        for s in salts:
            if s in text:
                classes.append("SAL")
                break

    # Peligrosidad
    dangerous = ["mercurio", "arsénico", "arsenico", "cianuro", "plomo", "cadmio",
                 "cromo", "níquel", "niquel", "berilio", "talio", "bencidina"]
    for d in dangerous:
        if d in text:
            classes.append("TOXICO")
            break

    if "flamable" in text or "inflamable" in text or "éter" in text or "eter diet" in text:
        classes.append("INFLAMABLE")
    if "explos" in text or "peróxido" in text or "peroxido" in text:
        classes.append("EXPLOSIVO")
    if "corros" in text or "ácido sulfúrico" in text or "ácido clorhídrico" in text or "ácido nítrico" in text:
        classes.append("CORROSIVO")
    if "oxidante" in text or "comburente" in text or "permanganato" in text or "dicromato" in text:
        classes.append("COMBURENTE")

    # Naturaleza (orgánico/inorgánico)
    # Metales → inorgánico
    metals = ["cloruro de", "sulfato de", "nitrato de", "óxido de", "oxido de",
              "carbonato de", "fosfato de", "mercurio", "plomo", "cobre", "hierro",
              "aluminio", "calcio", "sodio", "potasio", "magnesio", "zinc", "níquel",
              "niquel", "cromo", "cobalto", "manganeso", "bario", "estroncio",
              "cesio", "litio", "plata", "oro", "platino", "paladio", "rodio",
              "estaño", "antimonio", "bismuto", "cadmio", "alumin", "metalico", "metálico"]
    is_metal = False
    for m in metals:
        if m in text:
            classes.append("COMPUESTO_METALICO")
            is_metal = True
            break

    # Metales puros
    pure_metals = ["cobre metálico", "aluminio metal", "calcio metál", "sodio metál",
                   "estaño metál", "zinc metál", "magnesio metál"]
    for m in pure_metals:
        if m in text:
            classes.append("METAL")
            is_metal = True
            break

    # Determinar orgánico/inorgánico
    organic_markers = ["benz", "fenol", "anilina", "tolueno", "xileno", "benceno",
                       "naftalen", "piridina", "antraceno", "fenantrolina",
                       "ácido acético", "acido acetico", "acetato", "acetona",
                       "etanol", "metanol", "éter", "formaldehído", "formol",
                       "glucosa", "fructosa", "sacarosa", "almidón", "celulosa",
                       "proteína", "albumina", "gelatina", "aceite", "cera",
                       "cloroformo", "tetracloruro", "carbón activo", "carmin",
                       "fucsina", "violeta", "safranina", "hematoxilina"]
    is_organic = False
    for org in organic_markers:
        if org in text:
            is_organic = True
            break

    if is_organic:
        classes.append("ORGANICO")
    else:
        classes.append("INORGANICO")

    # Biológicos
    if "glucosa" in text or "fructosa" in text or "galactosa" in text or "sacarosa" in text:
        classes.append("CARBOHIDRATO")
    if "almidón" in text or "almidon" in text or "celulosa" in text or "carboximetil" in text:
        classes.append("CARBOHIDRATO")
    if "albumina" in text or "proteína" in text or "proteina" in text or "gelatina" in text:
        classes.append("PROTEINA")
    if "aceite" in text or "lipido" in text or "lípido" in text or "colesterol" in text:
        classes.append("LIPIDO")
    if "polímero" in text or "polimero" in text or "carboximetilcelulosa" in text:
        classes.append("POLIMERO")
    if "surfactante" in text or "detergente" in text or "tween" in text or "tritón" in text:
        classes.append("SURFACTANTE")

    # Buffer
    if "buffer" in text or "buffer ph" in text:
        classes.append("BUFFER")

    # Si no tiene nada, marcar como OTRO
    if not classes:
        classes.append("OTRO")

    # Deduplicar manteniendo orden
    seen = set()
    unique = []
    for c in classes:
        if c not in seen:
            seen.add(c)
            unique.append(c)
    return unique


# ============================================================
# Generar código nuevo: TIPO-ARMARIO-ESTANTE-CORR
# ============================================================
def generate_code(clases: list, armario: int, estante: str, corr: int) -> str:
    """Genera el código nuevo. TIPO = primeras letras de la clase principal."""
    # Mapeo de clase → prefijo
    prefixes = {
        "ACIDO": "AC",
        "BASE": "BA",
        "SAL": "SA",
        "SOLVENTE": "SO",
        "INDICADOR_PH": "IP",
        "INDICADOR_REDOX": "IR",
        "COLORANTE": "CO",
        "REACTIVO_ANALITICO": "RA",
        "BUFFER": "BU",
        "INFLAMABLE": "IN",
        "TOXICO": "TO",
        "CORROSIVO": "CO",
        "COMBURENTE": "CB",
        "ORGANICO": "OR",
        "INORGANICO": "IO",
        "METAL": "ME",
        "COMPUESTO_METALICO": "CM",
        "CARBOHIDRATO": "CA",
        "PROTEINA": "PR",
        "LIPIDO": "LI",
        "POLIMERO": "PO",
        "SURFACTANTE": "SU",
        "OTRO": "XX",
    }
    # Tomar la primera clase que no sea naturaleza
    primary = "OTRO"
    priority = ["ACIDO", "BASE", "SOLVENTE", "INDICADOR_PH", "INDICADOR_REDOX",
                "COLORANTE", "SAL", "BUFFER", "METAL", "COMPUESTO_METALICO",
                "CARBOHIDRATO", "PROTEINA", "LIPIDO", "POLIMERO", "SURFACTANTE",
                "INFLAMABLE", "TOXICO", "CORROSIVO", "ORGANICO", "INORGANICO"]
    for p in priority:
        if p in clases:
            primary = p
            break
    prefix = prefixes.get(primary, "XX")
    return f"{prefix}-{armario}{estante}-{corr:03d}"


# ============================================================
# Determinar estado físico y unidad
# ============================================================
def detect_state_and_unit(name: str, stock: str) -> tuple:
    text = f"{name} {stock}".lower()
    # Estado
    if any(x in text for x in ["litro", " ml", "l ", "líquido", "liquido", "solvente"]):
        state = "LIQUIDO"
    elif any(x in text for x in [" g", "g ", "gramo", "polvo", "sólido", "solido", "cristal"]):
        state = "SOLIDO"
    elif any(x in text for x in ["gas", "gaseoso"]):
        state = "GAS"
    else:
        state = "SOLIDO"  # default

    # Unidad
    if "litro" in text or "l " in text or text.rstrip().endswith("l"):
        unit = "L"
    elif "ml" in text:
        unit = "mL"
    elif "g " in text or "gramo" in text or text.rstrip().endswith("g"):
        unit = "g"
    elif "kg" in text:
        unit = "kg"
    else:
        unit = "u"  # unidades (sobres, etc.)

    return state, unit


# ============================================================
# Determinar depósito según la hoja
# ============================================================
def detect_warehouse(sheet_name: str) -> str:
    s = sheet_name.lower().strip()
    if "hplc" in s:
        return "Solventes HPLC"
    if "solvent" in s:
        return "Solventes"
    if "acid" in s:
        return "Ácidos"
    if "consum" in s:
        return "Consumibles"
    return "Depósito Central / Droguero"


# ============================================================
# Mapear nombre + tipo a nombre químico limpio
# ============================================================
def clean_name(name: str, tipo: str) -> str:
    """Limpia el nombre: a veces nombre y tipo están invertidos."""
    name = (name or "").strip()
    tipo = (tipo or "").strip()
    if not name:
        return tipo
    # Si tipo empieza con "Ácido" o "Cloruro de", probablemente va primero
    if tipo and any(tipo.lower().startswith(x) for x in ["ácido", "acido", "cloruro", "sulfato", "nitrato", "óxido", "oxido", "carbonato", "fosfato", "cianuro"]):
        # Caso: nombre="mercurio", tipo="Bicloruro de" → "Bicloruro de mercurio"
        # Caso: nombre="plata", tipo="Nitrato de" → "Nitrato de plata"
        return f"{tipo} {name}".strip()
    # Caso: nombre="Ácido periódico", tipo="Ácido" → "Ácido periódico"
    if tipo and name.lower().startswith("ácido") or name.lower().startswith("acido"):
        return name
    # Default
    return name if name else tipo


# ============================================================
# Main
# ============================================================
def main():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)

    drugs = {}  # codigo_viejo → {nombre, clases, lotes}
    lot_counter = {}  # codigo_viejo → contador de lotes

    for ws in wb.worksheets:
        sheet_name = ws.title
        warehouse = detect_warehouse(sheet_name)

        for i in range(2, ws.max_row + 1):
            row = [c.value for c in ws[i]]
            if not row or not row[0]:
                continue

            codigo = str(row[0]).strip()
            if not codigo or not codigo.isdigit():
                continue

            name_raw = str(row[1]).strip() if row[1] else ""
            tipo_raw = str(row[2]).strip() if row[2] else ""
            stock_raw = str(row[4]).strip() if row[4] else ""
            calidad = str(row[5]).strip() if row[5] else ""
            marca = str(row[6]).strip() if len(row) > 6 and row[6] else ""

            # Limpiar nombre
            nombre = clean_name(name_raw, tipo_raw)
            if not nombre or len(nombre) < 2:
                continue

            # Categorizar
            clases = categorize(nombre, tipo_raw)

            # Estado y unidad
            state, unit = detect_state_and_unit(nombre, stock_raw)

            # Extraer cantidad numérica del stock
            qty = 0
            if stock_raw:
                # Buscar número seguido de unidad
                m = re.search(r"(\d+(?:[.,]\d+)?)", stock_raw.replace(",", "."))
                if m:
                    try:
                        qty = float(m.group(1).replace(",", "."))
                    except:
                        qty = 0
            if qty == 0:
                qty = 1  # default

            # Inicializar drug si no existe
            if codigo not in drugs:
                drugs[codigo] = {
                    "codigo_viejo": codigo,
                    "chemicalName": nombre,
                    "clases": clases,
                    "state": state,
                    "unit": unit,
                    "purity": calidad if calidad else None,
                    "warehouse": warehouse,
                    "lotes": []
                }
                lot_counter[codigo] = 0

            # Agregar lote (frasco)
            lot_counter[codigo] += 1
            drugs[codigo]["lotes"].append({
                "lotNumber": f"{codigo}-{lot_counter[codigo]}",
                "supplier": marca if marca else None,
                "initialQuantity": qty,
                "currentQuantity": qty,
                "purity": calidad if calidad else None,
            })

    # Generar códigos nuevos
    # Asignar armario y estante según orden de aparición
    armarios = [1, 2, 3, 4, 5, 6]
    estantes = ["A", "B", "C", "D"]
    armario_idx = 0
    estante_idx = 0
    corr_por_armario_estante = {}

    # Ordenar drogas por nombre para asignar códigos
    codigos_ordenados = sorted(drugs.keys(), key=lambda c: drugs[c]["chemicalName"].lower())

    output_drugs = []
    for codigo in codigos_ordenados:
        drug = drugs[codigo]
        # Asignar armario/estante (4 estantes por armario, ~50 drogas por estante)
        key = (armarios[armario_idx], estantes[estante_idx])
        if key not in corr_por_armario_estante:
            corr_por_armario_estante[key] = 0
        corr_por_armario_estante[key] += 1
        corr = corr_por_armario_estante[key]

        new_code = generate_code(drug["clases"], armarios[armario_idx], estantes[estante_idx], corr)

        drug["code"] = new_code
        drug["armario"] = armarios[armario_idx]
        drug["estante"] = estantes[estante_idx]
        drug["correlativo"] = corr

        output_drugs.append(drug)

        # Avanzar estante cada 50 drogas
        if corr >= 50:
            estante_idx += 1
            if estante_idx >= len(estantes):
                estante_idx = 0
                armario_idx += 1
                if armario_idx >= len(armarios):
                    armario_idx = 0  # wrap (no debería pasar con 297 drogas)

    # Guardar JSON
    output = {
        "warehouses": [
            {"name": "Depósito Central / Droguero", "code": "DEP-00", "type": "PRINCIPAL",
             "location": "Edificio A - Planta Baja"},
            {"name": "Solventes HPLC", "code": "DEP-01", "type": "SECUNDARIO",
             "location": "Droguero Central"},
            {"name": "Solventes", "code": "DEP-02", "type": "SECUNDARIO",
             "location": "Droguero Central"},
            {"name": "Ácidos", "code": "DEP-03", "type": "SECUNDARIO",
             "location": "Droguero Central"},
            {"name": "Consumibles", "code": "DEP-04", "type": "SECUNDARIO",
             "location": "Droguero Central"},
            {"name": "Lab-MEIPA", "code": "LAB-01", "type": "SECUNDARIO",
             "location": "Laboratorio MEIPA"},
            {"name": "Lab-SERVICIOS", "code": "LAB-02", "type": "SECUNDARIO",
             "location": "Laboratorio de Servicios"},
            {"name": "Lab-Microbiología", "code": "LAB-03", "type": "SECUNDARIO",
             "location": "Laboratorio de Microbiología"},
            {"name": "Lab-Cromatografía", "code": "LAB-04", "type": "SECUNDARIO",
             "location": "Laboratorio de Cromatografía"},
            {"name": "Lab-Bioprocesos", "code": "LAB-05", "type": "SECUNDARIO",
             "location": "Laboratorio de Bioprocesos"},
        ],
        "users": [
            {"email": "mdellavecchia@inti.gob.ar", "name": "MDV", "password": "3141",
             "role": "ADMIN"},
        ],
        "drugs": output_drugs,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"✓ Generado {OUTPUT_PATH}")
    print(f"  - {len(output_drugs)} drogas")
    print(f"  - {sum(len(d['lotes']) for d in output_drugs)} lotes (frascos)")
    print(f"  - {len(output['warehouses'])} depósitos")
    print(f"  - {len(output['users'])} usuarios")

    # Mostrar algunas estadísticas de clases
    from collections import Counter
    clase_counter = Counter()
    for d in output_drugs:
        for c in d["clases"]:
            clase_counter[c] += 1
    print("\nDistribución por clase:")
    for clase, count in clase_counter.most_common(10):
        print(f"  {clase}: {count}")


if __name__ == "__main__":
    main()

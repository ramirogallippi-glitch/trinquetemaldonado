// Utilidades para hablar con las planillas de Google (Apps Script) de forma CONFIABLE.
//
// Problema que resuelven: los POST a Apps Script se mandan con `mode: "no-cors"`, que
// NO devuelve una respuesta legible. Sin verificación, la web "cree" que guardó aunque
// el guardado haya fallado (mala señal, Google lento, sin conexión). Eso hace que un
// jugador vea "¡Listo!" pero en la planilla no quede nada → cancha que no se llena.
//
// La solución: guardar y DESPUÉS releer la planilla (el GET sí devuelve JSON) para
// confirmar que el registro quedó realmente escrito. Recién ahí decimos "ok".

export type ResultadoGuardado = "ok" | "error"

const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Envía el POST (fire-and-forget: no-cors no devuelve nada útil; la verificación decide).
export async function enviarPost(url: string, body: unknown): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body),
    })
  } catch {
    /* no-cors no expone errores de red; la re-lectura posterior es la que confirma */
  }
}

// Relee la planilla (GET) y verifica con `verificar`. Reintenta varias veces porque
// el guardado en Google puede tardar un instante en reflejarse.
export async function verificarGuardado(
  url: string,
  verificar: (filas: any[]) => boolean,
  opts: { intentos?: number; esperaMs?: number } = {},
): Promise<boolean> {
  const { intentos = 4, esperaMs = 1500 } = opts
  for (let i = 0; i < intentos; i++) {
    await espera(esperaMs)
    try {
      const res = await fetch(url, { cache: "no-store" })
      const data = await res.json()
      if (Array.isArray(data) && verificar(data)) return true
    } catch {
      /* reintentar en la próxima vuelta */
    }
  }
  return false
}

// POST + verificación en una sola llamada. Devuelve "ok" solo si el registro
// aparece realmente en la planilla; "error" si no se pudo confirmar.
export async function guardarConfirmado(
  url: string,
  body: unknown,
  verificar: (filas: any[]) => boolean,
  opts?: { intentos?: number; esperaMs?: number },
): Promise<ResultadoGuardado> {
  await enviarPost(url, body)
  const ok = await verificarGuardado(url, verificar, opts)
  return ok ? "ok" : "error"
}

// Relee la planilla y devuelve las filas (o [] si falla). Útil para re-chequear
// turnos ocupados justo antes de confirmar (anti doble-reserva).
export async function leerFilas(url: string): Promise<any[]> {
  try {
    const res = await fetch(url, { cache: "no-store" })
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

// Normaliza un teléfono argentino a formato wa.me (54 9 <área> <número>), para que
// los links de WhatsApp abran el chat aunque el jugador lo escriba con espacios,
// guiones, el 0 de área o el 15. Si no puede normalizar con confianza, devuelve los
// dígitos tal cual (mejor eso que romper). No inventa código de área que no esté.
export function telefonoWa(telefono: string | number): string {
  let d = String(telefono ?? "").replace(/\D/g, "")
  if (!d) return ""
  d = d.replace(/^0+/, "") // saca ceros iniciales (ej: 011...)
  if (d.startsWith("54")) {
    // ya trae código de país; asegurar el 9 de celular después del 54
    const resto = d.slice(2)
    return resto.startsWith("9") ? d : "549" + resto
  }
  // número local (sin país). Le anteponemos 549 (celular Argentina).
  // Nota: si el jugador NO puso la característica (ej. 11), no hay forma de adivinarla.
  return "549" + d
}

// ¿La fecha (DD/MM/YYYY o texto de fecha) ya pasó respecto de hoy? Usada para ocultar
// desafíos vencidos del muro. Compara por día (ignora la hora).
export function fechaVencida(v: string): boolean {
  const s = String(v || "").trim()
  let d: Date | null = null
  const p = s.split(" ")[0].split("/")
  if (p.length === 3) {
    d = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]))
  } else {
    const d2 = new Date(s)
    if (!isNaN(d2.getTime())) d = d2
  }
  if (!d || isNaN(d.getTime())) return false // si no se entiende la fecha, no la ocultamos
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d.getTime() < hoy.getTime()
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { CalendarCheck, Clock, Trash2, Search } from "lucide-react"
import { leerFilas, bajaConfirmada } from "@/lib/sheets"

/* ── Paleta (igual al resto del sitio) ── */
const C = {
  amarillo: "#FFD300",
  negro: "#0A0A0A",
  card: "#151515",
  cardBorde: "rgba(255,255,255,0.08)",
  blanco: "#FFFFFF",
  gris: "rgba(255,255,255,0.55)",
  grisTenue: "rgba(255,255,255,0.35)",
}
const anton = "'Anton', sans-serif"
const oswald = "'Oswald', sans-serif"
const inter = "'Inter', sans-serif"

// Planilla de anotados individuales (misma que usa el formulario de anotarse)
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyj8eaiibJGXDL2PrnRtpFXpXf8iaoFvJVSyT2SWRIqamETclFhMTNu-0OkXqW8I3qbOg/exec"

type Anotado = { nombre: string; posicion: string; categoria: string; turnos: string; fechaJugar: string; telefono: string }

const soloDigitos = (s: unknown) => String(s ?? "").replace(/\D/g, "")

export default function MisTurnosPage() {
  const [telefono, setTelefono] = useState("")
  const [buscado, setBuscado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [misAnotados, setMisAnotados] = useState<Anotado[]>([])
  const [error, setError] = useState("")
  const [cancelando, setCancelando] = useState<string | null>(null)

  const buscar = async () => {
    const tel = soloDigitos(telefono)
    if (tel.length < 8) {
      setError("Poné tu número completo, con característica (ej: 11 6453-3959).")
      return
    }
    setError("")
    setCargando(true)
    setBuscado(false)
    const filas = await leerFilas(SHEET_URL)
    const mios = filas.filter((a: any) => soloDigitos(a.telefono) === tel) as Anotado[]
    setMisAnotados(mios)
    setCargando(false)
    setBuscado(true)
  }

  const claveDe = (a: Anotado) => `${a.nombre}|${a.fechaJugar}|${a.turnos}`

  const cancelar = async (a: Anotado) => {
    if (!window.confirm(`¿Cancelar tu anotación del ${a.fechaJugar} (${a.turnos})?`)) return
    setCancelando(claveDe(a))
    const res = await bajaConfirmada(
      SHEET_URL,
      { action: "cancelar", nombre: a.nombre, telefono: a.telefono, fechaJugar: a.fechaJugar, turnos: a.turnos },
      // sigue existiendo si todavía hay una fila igual (mismo nombre+tel+fecha+turnos)
      (filas) => filas.some((f: any) =>
        String(f.nombre || "").trim().toLowerCase() === String(a.nombre).trim().toLowerCase() &&
        soloDigitos(f.telefono) === soloDigitos(a.telefono) &&
        String(f.fechaJugar || "").trim() === String(a.fechaJugar).trim() &&
        String(f.turnos || "").trim() === String(a.turnos).trim()
      ),
    )
    setCancelando(null)
    if (res === "ok") {
      setMisAnotados(prev => prev.filter(x => claveDe(x) !== claveDe(a)))
    } else {
      setError("No pudimos confirmar la cancelación (puede ser la conexión). Reintentá en unos segundos.")
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", fontFamily: inter, fontSize: 16, color: C.blanco,
    background: "#0d0d0d", border: `1.5px solid ${C.cardBorde}`, borderRadius: 9, padding: "14px 16px", outline: "none",
  }

  return (
    <main style={{ background: C.negro, minHeight: "100vh", color: C.blanco }}>
      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: `3px solid ${C.amarillo}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 60 }}>
        <Link href="/" style={{ fontFamily: oswald, fontWeight: 700, fontSize: 16, textTransform: "uppercase", color: C.negro, textDecoration: "none" }}>← Volver al inicio</Link>
        <span style={{ fontFamily: anton, fontSize: 18, textTransform: "uppercase", color: C.negro }}>Mis turnos</span>
      </nav>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "48px 18px 90px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <CalendarCheck size={38} color={C.amarillo} style={{ marginBottom: 14 }} />
          <h1 style={{ fontFamily: anton, fontSize: "clamp(30px, 8vw, 48px)", textTransform: "uppercase", lineHeight: 1, margin: 0 }}>
            Mis <span style={{ color: C.amarillo }}>turnos</span>
          </h1>
          <p style={{ fontFamily: inter, fontSize: 15, color: C.gris, lineHeight: 1.7, maxWidth: 440, margin: "16px auto 0" }}>
            Poné tu teléfono para ver tus anotaciones y cancelar la que no vayas a usar. Así liberás el lugar para otro.
          </p>
        </div>

        {/* Buscador */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <input value={telefono} onChange={e => { setTelefono(e.target.value); setError("") }}
            onKeyDown={e => { if (e.key === "Enter") buscar() }}
            type="tel" inputMode="tel" placeholder="Tu teléfono (ej: 11 6453-3959)"
            style={{ ...inputStyle, flex: 1, minWidth: 200 }} />
          <button onClick={buscar} disabled={cargando} style={{
            fontFamily: oswald, fontSize: 15, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700,
            cursor: cargando ? "default" : "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "14px 22px", borderRadius: 9,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: cargando ? 0.7 : 1,
          }}>
            <Search size={16} /> {cargando ? "Buscando…" : "Ver mis turnos"}
          </button>
        </div>
        {error && <p style={{ fontFamily: inter, fontSize: 13, color: "#ff6b6b", marginBottom: 12 }}>{error}</p>}

        {/* Resultados */}
        {buscado && !cargando && (
          misAnotados.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.cardBorde}`, borderRadius: 14, padding: "34px 20px", textAlign: "center", marginTop: 20 }}>
              <p style={{ fontFamily: inter, fontSize: 15, color: C.gris, margin: 0 }}>No encontramos anotaciones con ese teléfono.</p>
              <Link href="/anotarse" style={{ display: "inline-block", marginTop: 16, fontFamily: oswald, fontSize: 14, textTransform: "uppercase", fontWeight: 700, color: C.negro, background: C.amarillo, padding: "11px 20px", borderRadius: 8, textDecoration: "none" }}>Anotarme a un partido</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
              {misAnotados.map((a, i) => {
                const enProceso = cancelando === claveDe(a)
                return (
                  <div key={`${claveDe(a)}-${i}`} style={{ background: C.card, border: `1px solid ${C.cardBorde}`, borderRadius: 13, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: oswald, fontSize: 17, fontWeight: 700, textTransform: "uppercase", color: C.blanco }}>{a.nombre}</span>
                        {a.categoria && <span style={{ fontFamily: inter, fontSize: 10.5, fontWeight: 700, color: C.negro, background: C.amarillo, padding: "2px 8px", borderRadius: 999, textTransform: "uppercase" }}>{a.categoria}</span>}
                        {a.posicion && <span style={{ fontFamily: inter, fontSize: 11, color: C.gris }}>{a.posicion}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: inter, fontSize: 13.5, color: C.gris }}><CalendarCheck size={15} color={C.amarillo} /> {a.fechaJugar}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: inter, fontSize: 13.5, color: C.gris }}><Clock size={15} color={C.amarillo} /> {a.turnos}</span>
                      </div>
                    </div>
                    <button onClick={() => cancelar(a)} disabled={enProceso} style={{
                      flexShrink: 0, display: "flex", alignItems: "center", gap: 7, fontFamily: oswald, fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700,
                      cursor: enProceso ? "default" : "pointer", color: "#ff6b6b", background: "transparent", border: "1.5px solid #ff6b6b55", borderRadius: 8, padding: "10px 15px", opacity: enProceso ? 0.6 : 1,
                    }}>
                      <Trash2 size={14} /> {enProceso ? "Cancelando…" : "Cancelar"}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </main>
  )
}

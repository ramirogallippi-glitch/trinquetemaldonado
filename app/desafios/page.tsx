"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Swords, Calendar, Clock, Trophy, Plus, X, Send } from "lucide-react"

/* ── Paleta ── */
const C = {
  amarillo: "#FFD300",
  negro:    "#0A0A0A",
  card:     "#151515",
  cardBorde:"rgba(255,255,255,0.08)",
  blanco:   "#FFFFFF",
  gris:     "rgba(255,255,255,0.55)",
  grisTenue:"rgba(255,255,255,0.35)",
}
const anton  = "'Anton', sans-serif"
const oswald = "'Oswald', sans-serif"
const inter  = "'Inter', sans-serif"

/* ⚠️ Pegar acá la URL del Apps Script de la planilla "Desafíos" (la que vas a crear) */
const DESAFIOS_URL = "https://script.google.com/macros/s/AKfycbz_-Q9pCsMEtCJZ8UNgRzfi_PlOSD8UHC8hqvUW70FA3-nRlnGjpiVRI7-gExnHT7DHVA/exec"

const CATEGORIAS = ["Primera", "Segunda", "Tercera", "Cuarta"]
const TURNOS = ["17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00"]
// Número de WhatsApp de Dani (cambiar por el real cuando lo tengan)
const DANI_WA = "5491141626719"
// Contraseña para entrar al muro (cambiala por la que quieras que use el club)
const CLAVE = "trinquete2026"

interface Desafio {
  id: string
  jugador1: string
  jugador2: string
  categoria: string
  fecha: string   // DD/MM/YYYY
  turno: string
  telefono1: string
  telefono2: string
  estado: string   // "abierto" | "completo"
  rival1: string
  rival2: string
}

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const ck = () => setM(window.innerWidth < 768)
    ck(); window.addEventListener("resize", ck)
    return () => window.removeEventListener("resize", ck)
  }, [])
  return m
}

// Convierte cualquier formato de fecha a DD/MM/YYYY (limpio, sin GMT ni "Wed")
function formatFecha(v: string): string {
  if (!v) return ""
  if (v.indexOf("/") !== -1) return v.split(" ")[0]      // ya viene DD/MM/YYYY
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`
}

export default function DesafiosPage() {
  const isMobile = useIsMobile()
  const [desafios, setDesafios] = useState<Desafio[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Acceso con contraseña
  const [unlocked, setUnlocked] = useState(false)
  const [claveInput, setClaveInput] = useState("")
  const [claveError, setClaveError] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("trinquete_desafios_ok") === "1") setUnlocked(true)
  }, [])
  const entrar = () => {
    if (claveInput.trim().toLowerCase() === CLAVE.toLowerCase()) {
      localStorage.setItem("trinquete_desafios_ok", "1")
      setUnlocked(true); setClaveError(false)
    } else { setClaveError(true) }
  }

  // form
  const [j1, setJ1] = useState("")
  const [j2, setJ2] = useState("")
  const [categoria, setCategoria] = useState("")
  const [fecha, setFecha] = useState("")
  const [turno, setTurno] = useState("")
  const [telefono1, setTelefono1] = useState("")
  const [telefono2, setTelefono2] = useState("")
  const [error, setError] = useState("")
  const [enviando, setEnviando] = useState(false)

  // aceptar (unirse) — flujo web
  const [aceptandoId, setAceptandoId] = useState<string | null>(null)
  const [rival1, setRival1] = useState("")
  const [rival2, setRival2] = useState("")
  const [errorAceptar, setErrorAceptar] = useState("")

  const cargarDesafios = () => {
    fetch(DESAFIOS_URL)
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // ignorar filas vacías o sin jugadores (partidos "fantasma")
          setDesafios(data.filter(x => x && String(x.jugador1 || "").trim() && String(x.jugador2 || "").trim()))
        }
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  useEffect(() => { cargarDesafios() }, [])

  const hoyStr = (() => { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}-${String(h.getDate()).padStart(2,"0")}` })()

  const publicar = async () => {
    if (!j1.trim() || !j2.trim() || !categoria || !fecha || !turno || !telefono1.trim() || !telefono2.trim()) {
      setError("Completá los dos jugadores con sus teléfonos, categoría, fecha y turno.")
      return
    }
    setError("")
    setEnviando(true)
    const fechaFmt = fecha.split("-").reverse().join("/")
    const id = String(Date.now())
    const payload: Desafio = { id, jugador1: j1, jugador2: j2, categoria, fecha: fechaFmt, turno, telefono1, telefono2, estado: "abierto", rival1: "", rival2: "" }
    try {
      await fetch(DESAFIOS_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...payload, action: "publicar" }),
      })
    } catch (e) {}
    // optimista: lo agrego al muro al toque
    setDesafios(prev => [payload, ...prev])
    setEnviando(false)
    setShowForm(false)
    setJ1(""); setJ2(""); setCategoria(""); setFecha(""); setTurno(""); setTelefono1(""); setTelefono2("")
    // y re-sincronizo con la planilla
    setTimeout(cargarDesafios, 2000)
  }

  const confirmarAceptar = (d: Desafio) => {
    if (!rival1.trim() || !rival2.trim()) {
      setErrorAceptar("Completá los nombres de los dos jugadores de tu dupla.")
      return
    }
    setErrorAceptar("")
    // 1) Abrir WhatsApp PRIMERO (en el toque directo, clave para que funcione en iPhone)
    const msg =
      `Hola! Se armó un partido de pelota paleta\n\n` +
      `${d.jugador1} y ${d.jugador2} VS ${rival1} y ${rival2}\n` +
      `Categoría: ${d.categoria}\n` +
      `Fecha: ${formatFecha(d.fecha)}\n` +
      `Horario: ${d.turno}`
    window.open(`https://wa.me/${DANI_WA}?text=${encodeURIComponent(msg)}`, "_blank")
    // 2) Guardar en la planilla (sin esperar, así no bloquea la apertura de WhatsApp)
    fetch(DESAFIOS_URL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "aceptar", id: d.id, rival1, rival2 }),
    }).catch(() => {})
    // 3) optimista: marco el partido como completo
    setDesafios(prev => prev.map(x => x.id === d.id ? { ...x, estado: "completo", rival1, rival2 } : x))
    setAceptandoId(null); setRival1(""); setRival2("")
    setTimeout(cargarDesafios, 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", fontFamily: inter, fontSize: 15, color: C.blanco,
    background: "#0d0d0d", border: `1.5px solid ${C.cardBorde}`, borderRadius: 9, padding: "13px 16px",
    outline: "none", marginBottom: 16, colorScheme: "dark",
  }
  const chip = (active: boolean): React.CSSProperties => ({
    fontFamily: inter, fontSize: 14, fontWeight: 500, cursor: "pointer",
    padding: "10px 16px", borderRadius: 9, transition: "all 0.18s",
    border: `1.5px solid ${active ? C.amarillo : C.cardBorde}`,
    background: active ? C.amarillo : "transparent", color: active ? C.negro : C.gris,
  })

  // Pantalla de contraseña
  if (!unlocked) {
    return (
      <main style={{ background: C.negro, minHeight: "100vh", color: C.blanco, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Swords size={40} color={C.amarillo} style={{ marginBottom: 18 }} />
        <h1 style={{ fontFamily: anton, fontSize: "clamp(28px, 8vw, 44px)", textTransform: "uppercase", color: C.blanco, marginBottom: 10, textAlign: "center" }}>Muro de Desafíos</h1>
        <p style={{ fontFamily: inter, fontSize: 14, color: C.gris, marginBottom: 26, textAlign: "center", maxWidth: 320 }}>Ingresá la clave del club para acceder.</p>
        <input
          type="password" value={claveInput}
          onChange={e => { setClaveInput(e.target.value); setClaveError(false) }}
          onKeyDown={e => { if (e.key === "Enter") entrar() }}
          placeholder="Clave"
          style={{ width: "100%", maxWidth: 300, boxSizing: "border-box", fontFamily: inter, fontSize: 16, color: C.blanco, background: C.card, border: `1.5px solid ${claveError ? "#ff6b6b" : C.cardBorde}`, borderRadius: 9, padding: "14px 16px", outline: "none", textAlign: "center", marginBottom: 12 }} />
        {claveError && <p style={{ fontFamily: inter, fontSize: 13, color: "#ff6b6b", marginBottom: 12 }}>Clave incorrecta</p>}
        <button onClick={entrar} style={{ width: "100%", maxWidth: 300, fontFamily: oswald, fontSize: 16, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "14px", borderRadius: 9 }}>Entrar</button>
        <Link href="/" style={{ fontFamily: inter, fontSize: 13, color: C.gris, marginTop: 22, textDecoration: "underline" }}>← Volver al inicio</Link>
      </main>
    )
  }

  return (
    <main style={{ background: C.negro, minHeight: "100vh", color: C.blanco }}>
      {/* Navbar simple */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: `3px solid ${C.amarillo}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 40px", height: 60 }}>
        <Link href="/" style={{ fontFamily: oswald, fontWeight: 700, fontSize: 16, textTransform: "uppercase", color: C.negro, textDecoration: "none" }}>
          ← Volver al inicio
        </Link>
        <span style={{ fontFamily: anton, fontSize: 18, textTransform: "uppercase", color: C.negro }}>Desafíos</span>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: isMobile ? "40px 18px 80px" : "64px 24px 100px" }}>
        {/* Encabezado */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Swords size={isMobile ? 26 : 32} color={C.amarillo} />
            <h1 style={{ fontFamily: anton, fontSize: "clamp(34px, 9vw, 60px)", textTransform: "uppercase", lineHeight: 1, color: C.blanco }}>
              Muro de Desafíos
            </h1>
          </div>
          <p style={{ fontFamily: inter, fontSize: 15, color: C.gris, lineHeight: 1.7, maxWidth: 480, margin: "0 auto" }}>
            Publicá tu desafío con tu dupla y elegí día y horario. Otra dupla lo acepta y se arma el partido.
          </p>
        </div>

        {/* Botón publicar */}
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            width: "100%", fontFamily: oswald, fontSize: 17, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700,
            cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "16px", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 36,
            boxShadow: "0 8px 28px rgba(255,211,0,0.25)",
          }}>
            <Plus size={20} /> Publicar un desafío
          </button>
        )}

        {/* Formulario */}
        {showForm && (
          <div style={{ background: C.card, border: `1px solid ${C.amarillo}55`, borderRadius: 16, padding: isMobile ? 20 : 30, marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: oswald, fontSize: 22, fontWeight: 700, textTransform: "uppercase", color: C.blanco }}>Tu desafío</h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.gris }}><X size={22} /></button>
            </div>

            <label style={{ display: "block", fontFamily: oswald, fontSize: 14, textTransform: "uppercase", color: C.blanco, marginBottom: 8 }}>Jugadores de tu dupla</label>
            <input value={j1} onChange={e => setJ1(e.target.value)} placeholder="Jugador 1" style={inputStyle} />
            <input value={j2} onChange={e => setJ2(e.target.value)} placeholder="Jugador 2" style={inputStyle} />

            <label style={{ display: "block", fontFamily: oswald, fontSize: 14, textTransform: "uppercase", color: C.blanco, marginBottom: 8 }}>Categoría</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
              {CATEGORIAS.map(c => (
                <button key={c} onClick={() => setCategoria(c)} style={{ ...chip(categoria === c), flex: isMobile ? "1 1 calc(50% - 4px)" : 1 }}>{c}</button>
              ))}
            </div>

            <label style={{ display: "block", fontFamily: oswald, fontSize: 14, textTransform: "uppercase", color: C.blanco, marginBottom: 8 }}>Fecha</label>
            <input type="date" value={fecha} min={hoyStr} onChange={e => setFecha(e.target.value)} style={inputStyle} />

            <label style={{ display: "block", fontFamily: oswald, fontSize: 14, textTransform: "uppercase", color: C.blanco, marginBottom: 8 }}>Turno</label>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 8, marginBottom: 18 }}>
              {TURNOS.map(t => (
                <button key={t} onClick={() => setTurno(t)} style={{ ...chip(turno === t), fontFamily: oswald, fontWeight: 600, whiteSpace: "nowrap" }}>{t}</button>
              ))}
            </div>

            <label style={{ display: "block", fontFamily: oswald, fontSize: 14, textTransform: "uppercase", color: C.blanco, marginBottom: 8 }}>Teléfono de cada jugador</label>
            <input value={telefono1} onChange={e => setTelefono1(e.target.value)} type="tel" inputMode="tel" placeholder={`Teléfono de ${j1 || "Jugador 1"}`} style={inputStyle} />
            <input value={telefono2} onChange={e => setTelefono2(e.target.value)} type="tel" inputMode="tel" placeholder={`Teléfono de ${j2 || "Jugador 2"}`} style={{ ...inputStyle, marginBottom: 22 }} />

            {error && <p style={{ fontFamily: inter, fontSize: 13, color: "#ff6b6b", marginBottom: 14, textAlign: "center" }}>{error}</p>}

            <button onClick={publicar} disabled={enviando} style={{
              width: "100%", fontFamily: oswald, fontSize: 16, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700,
              cursor: enviando ? "default" : "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "15px", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: enviando ? 0.7 : 1,
            }}>
              <Send size={18} /> {enviando ? "Publicando..." : "Publicar desafío"}
            </button>
          </div>
        )}

        {/* Muro */}
        <h2 style={{ fontFamily: oswald, fontSize: 20, fontWeight: 700, textTransform: "uppercase", color: C.amarillo, marginBottom: 18, letterSpacing: "0.05em" }}>
          Desafíos
        </h2>

        {cargando ? (
          <p style={{ fontFamily: inter, color: C.gris, textAlign: "center", padding: "30px 0" }}>Cargando…</p>
        ) : desafios.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.cardBorde}`, borderRadius: 14, padding: "40px 20px", textAlign: "center" }}>
            <Swords size={32} color={C.grisTenue} style={{ marginBottom: 14 }} />
            <p style={{ fontFamily: inter, fontSize: 15, color: C.gris }}>Todavía no hay desafíos. ¡Sé el primero en publicar uno!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {desafios.map((d) => {
              const completo = d.estado === "completo"
              return (
                <div key={d.id} style={{ background: C.card, border: `1px solid ${completo ? "#6B8F71" : C.cardBorde}`, borderRadius: 14, padding: isMobile ? 18 : 22 }}>
                  {completo ? (
                    /* ── PARTIDO ARMADO 2 vs 2 ── */
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <span style={{ fontFamily: inter, fontSize: 11, fontWeight: 700, color: C.negro, background: "#6B8F71", padding: "4px 11px", borderRadius: 999, textTransform: "uppercase" }}>✓ Partido armado · Completo</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: oswald, fontSize: isMobile ? 17 : 20, fontWeight: 700, textTransform: "uppercase", color: C.blanco, textAlign: "center" }}>{d.jugador1} & {d.jugador2}</span>
                        <span style={{ fontFamily: anton, fontSize: 18, color: C.amarillo }}>VS</span>
                        <span style={{ fontFamily: oswald, fontSize: isMobile ? 17 : 20, fontWeight: 700, textTransform: "uppercase", color: C.blanco, textAlign: "center" }}>{d.rival1} & {d.rival2}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 14, borderTop: `1px solid ${C.cardBorde}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: oswald, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B8F71", minWidth: 92 }}>Categoría:</span>
                          <span style={{ fontFamily: inter, fontSize: 14, color: C.blanco }}>{d.categoria}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: oswald, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B8F71", minWidth: 92 }}>Fecha:</span>
                          <span style={{ fontFamily: inter, fontSize: 14, color: C.blanco }}>{formatFecha(d.fecha)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: oswald, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#6B8F71", minWidth: 92 }}>Horario:</span>
                          <span style={{ fontFamily: inter, fontSize: 14, color: C.blanco }}>{d.turno}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ── DESAFÍO ABIERTO ── */
                    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 16 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: oswald, fontSize: isMobile ? 19 : 21, fontWeight: 700, textTransform: "uppercase", color: C.blanco }}>
                            {d.jugador1} <span style={{ color: C.amarillo }}>&</span> {d.jugador2}
                          </span>
                          <span style={{ fontFamily: inter, fontSize: 11, fontWeight: 700, color: C.negro, background: C.amarillo, padding: "3px 9px", borderRadius: 999, textTransform: "uppercase" }}>{d.categoria}</span>
                        </div>
                        <p style={{ fontFamily: inter, fontSize: 12.5, color: C.amarillo, marginBottom: 10, fontWeight: 500 }}>Esperando una dupla que los desafíe 🎾</p>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: inter, fontSize: 13.5, color: C.gris }}><Calendar size={15} color={C.amarillo} /> {formatFecha(d.fecha)}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: inter, fontSize: 13.5, color: C.gris }}><Clock size={15} color={C.amarillo} /> {d.turno}</span>
                        </div>
                      </div>
                      {aceptandoId !== d.id && (
                        <button onClick={() => { setAceptandoId(d.id); setRival1(""); setRival2(""); setErrorAceptar("") }} style={{
                          fontFamily: oswald, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700,
                          cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "12px 22px", borderRadius: 8,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap",
                        }}>
                          <Swords size={16} /> Unirse / Aceptar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mini-form para aceptar */}
                  {!completo && aceptandoId === d.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.cardBorde}` }}>
                      <p style={{ fontFamily: oswald, fontSize: 14, textTransform: "uppercase", color: C.blanco, marginBottom: 10 }}>Tu dupla (los rivales)</p>
                      <input value={rival1} onChange={e => setRival1(e.target.value)} placeholder="Jugador 1" style={inputStyle} />
                      <input value={rival2} onChange={e => setRival2(e.target.value)} placeholder="Jugador 2" style={{ ...inputStyle, marginBottom: 14 }} />
                      {errorAceptar && <p style={{ fontFamily: inter, fontSize: 12.5, color: "#ff6b6b", marginBottom: 12 }}>{errorAceptar}</p>}
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => confirmarAceptar(d)} style={{ flex: 1, fontFamily: oswald, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "13px", borderRadius: 8 }}>
                          Confirmar partido
                        </button>
                        <button onClick={() => setAceptandoId(null)} style={{ fontFamily: oswald, fontSize: 14, textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: C.gris, background: "transparent", border: `1.5px solid ${C.cardBorde}`, padding: "13px 18px", borderRadius: 8 }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Swords, Calendar, Clock, Trophy, Plus, X, Send, Trash2, Check } from "lucide-react"
import { guardarConfirmado, leerFilas, fechaVencida } from "@/lib/sheets"

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
// Agenda de la cancha (turnos ocupados)
const RESERVAS_URL = "https://script.google.com/macros/s/AKfycbwQ4-dYzUabsSYN5Xx3gnqeM00tKwYye3D2sk3_ipEAgoabR3JyJ0rIQXZ6QmDIB44d/exec"

const CATEGORIAS = ["Primera", "Segunda", "Tercera", "Cuarta"]
const TURNOS = ["17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00"]
// Número de WhatsApp de Dani (+54 9 11 6453-3959)
const DANI_WA = "5491164533959"
// Contraseña para entrar al muro (cambiala por la que quieras que use el club)
const CLAVE = "trinquete2026"
// Contraseña de ADMIN (SOLO Dani) para borrar partidos. Cambiala por la que quieras.
const CLAVE_ADMIN = "dani2026"

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
  rivalTel1?: string
  rivalTel2?: string
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
  const [reservados, setReservados] = useState<Set<string>>(new Set())
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

  // Modo admin (SOLO Dani): puede borrar partidos
  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("trinquete_desafios_admin") === "1") setAdmin(true)
  }, [])
  const activarAdmin = () => {
    const c = window.prompt("Clave de administrador (Dani):")
    if (c == null) return
    if (c.trim().toLowerCase() === CLAVE_ADMIN.toLowerCase()) {
      localStorage.setItem("trinquete_desafios_admin", "1"); setAdmin(true)
    } else { window.alert("Clave incorrecta") }
  }
  const salirAdmin = () => { localStorage.removeItem("trinquete_desafios_admin"); setAdmin(false) }
  // Libera la cancha de un desafío que tenía turno reservado (solo los "completo" reservan)
  const liberarReservaDe = (d: Desafio) => {
    if (d.estado !== "completo") return
    const f = formatFecha(d.fecha)
    fetch(RESERVAS_URL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "liberar", fecha: f, turno: d.turno }),
    }).catch(() => {})
    setReservados(prev => { const n = new Set(prev); n.delete(`${f}|${String(d.turno).trim()}`); return n })
  }
  const borrarDesafio = (d: Desafio) => {
    if (!window.confirm(`¿Borrar el partido de ${d.jugador1} y ${d.jugador2}? No se puede deshacer.`)) return
    fetch(DESAFIOS_URL, {
      method: "POST", mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "borrar", id: d.id }),
    }).catch(() => {})
    liberarReservaDe(d)   // si tenía cancha reservada, la libera para que no quede huérfana
    setDesafios(prev => prev.filter(x => x.id !== d.id))
  }
  const borrarTodos = () => {
    if (!desafios.length) return
    if (!window.confirm(`¿Borrar TODOS los partidos (${desafios.length})? No se puede deshacer.`)) return
    desafios.forEach(d => {
      fetch(DESAFIOS_URL, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "borrar", id: d.id }),
      }).catch(() => {})
      liberarReservaDe(d)   // libera la cancha de los que estaban completos
    })
    setDesafios([])
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
  const [rivalTel1, setRivalTel1] = useState("")
  const [rivalTel2, setRivalTel2] = useState("")
  const [errorAceptar, setErrorAceptar] = useState("")
  // paso 2 del aceptar: WhatsApp ya abierto, esperando que el usuario confirme que lo mandó
  const [confirmandoAceptarId, setConfirmandoAceptarId] = useState<string | null>(null)
  const [procesandoAceptar, setProcesandoAceptar] = useState(false)

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

  const cargarReservas = () => {
    fetch(RESERVAS_URL)
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReservados(new Set(data.map((r: any) => `${formatFecha(r.fecha)}|${String(r.turno).trim()}`)))
      })
      .catch(() => {})
  }

  useEffect(() => {
    cargarDesafios(); cargarReservas()
    // refresco automático cada 20s (desafíos y reservas al día entre dispositivos)
    const iv = setInterval(() => { cargarDesafios(); cargarReservas() }, 20000)
    const onFocus = () => { cargarDesafios(); cargarReservas() }
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(iv); window.removeEventListener("focus", onFocus) }
  }, [])

  const hoyStr = (() => { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}-${String(h.getDate()).padStart(2,"0")}` })()

  // Muro: ocultamos los desafíos con fecha ya pasada (basura vieja que confunde al jugador)
  const desafiosVisibles = desafios.filter(d => !fechaVencida(formatFecha(d.fecha)))

  const publicar = async () => {
    if (!j1.trim() || !j2.trim() || !categoria || !fecha || !turno || !telefono1.trim() || !telefono2.trim()) {
      setError("Completá los dos jugadores con sus teléfonos, categoría, fecha y turno.")
      return
    }
    const fechaFmt = fecha.split("-").reverse().join("/")
    setError("")
    setEnviando(true)
    // Anti doble-reserva: re-chequeo el turno AHORA (no con datos viejos)
    const reservasAhora = await leerFilas(RESERVAS_URL)
    const ocupados = new Set(reservasAhora.map((r: any) => `${formatFecha(r.fecha)}|${String(r.turno).trim()}`))
    if (ocupados.has(`${fechaFmt}|${String(turno).trim()}`)) {
      setReservados(ocupados)
      setEnviando(false)
      setError("Este turno ya fue reservado. Por favor, elegí otro horario.")
      return
    }
    const id = String(Date.now())
    const payload: Desafio = { id, jugador1: j1, jugador2: j2, categoria, fecha: fechaFmt, turno, telefono1, telefono2, estado: "abierto", rival1: "", rival2: "" }
    // Guardado CONFIRMADO: manda y verifica que el desafío quedó en la planilla.
    const res = await guardarConfirmado(
      DESAFIOS_URL,
      { ...payload, action: "publicar" },
      (filas) => filas.some((f: any) => String(f.id) === id),
    )
    setEnviando(false)
    if (res !== "ok") {
      setError("No pudimos confirmar la publicación (puede ser la conexión). Reintentá en unos segundos.")
      return
    }
    // confirmado: lo agrego al muro
    setDesafios(prev => [payload, ...prev])
    setShowForm(false)
    setJ1(""); setJ2(""); setCategoria(""); setFecha(""); setTurno(""); setTelefono1(""); setTelefono2("")
    setTimeout(cargarDesafios, 2000)
  }

  // Chequea que el desafío se pueda aceptar (nadie lo tomó, turno libre). Devuelve true si está OK.
  const puedeAceptar = (d: Desafio): boolean => {
    const actual = desafios.find(x => x.id === d.id)
    if (actual && actual.estado === "completo") {
      setErrorAceptar("Otra dupla ya aceptó este desafío. Elegí otro.")
      return false
    }
    if (reservados.has(`${formatFecha(d.fecha)}|${String(d.turno).trim()}`)) {
      setErrorAceptar("Este turno ya fue reservado. Por favor, elegí otro horario.")
      return false
    }
    return true
  }

  // PASO 1: abre WhatsApp con el mensaje para Dani. NO confirma nada todavía.
  const abrirWhatsAppAceptar = (d: Desafio) => {
    if (!rival1.trim() || !rival2.trim() || !rivalTel1.trim() || !rivalTel2.trim()) {
      setErrorAceptar("Completá el nombre y el teléfono de los dos jugadores de tu dupla.")
      return
    }
    if (!puedeAceptar(d)) return
    setErrorAceptar("")
    // Abrir WhatsApp en el toque directo (clave para que funcione en iPhone)
    const msg =
      `Hola! Se armó un partido de pelota paleta\n\n` +
      `${d.jugador1} y ${d.jugador2} VS ${rival1} y ${rival2}\n` +
      `Categoría: ${d.categoria}\n` +
      `Fecha: ${formatFecha(d.fecha)}\n` +
      `Horario: ${d.turno}\n\n` +
      `Teléfonos:\n` +
      `${d.jugador1}: ${d.telefono1}\n` +
      `${d.jugador2}: ${d.telefono2}\n` +
      `${rival1}: ${rivalTel1}\n` +
      `${rival2}: ${rivalTel2}`
    window.open(`https://wa.me/${DANI_WA}?text=${encodeURIComponent(msg)}`, "_blank")
    // Pasar al paso de confirmación (todavía NO se guarda nada)
    setConfirmandoAceptarId(d.id)
  }

  // PASO 2: el usuario confirma que efectivamente mandó el mensaje. RECIÉN ACÁ se arma el partido.
  const confirmarEnviadoAceptar = async (d: Desafio) => {
    setErrorAceptar("")
    setProcesandoAceptar(true)
    const claveReserva = `${formatFecha(d.fecha)}|${String(d.turno).trim()}`
    // Re-chequeo FRESCO justo antes de confirmar: ¿alguien tomó el desafío o el turno mientras tanto?
    const [desafiosAhora, reservasAhora] = await Promise.all([leerFilas(DESAFIOS_URL), leerFilas(RESERVAS_URL)])
    const yaCompleto = desafiosAhora.some((x: any) => String(x.id) === String(d.id) && String(x.estado) === "completo")
    const turnoTomado = reservasAhora.some((r: any) => `${formatFecha(r.fecha)}|${String(r.turno).trim()}` === claveReserva)
    if (yaCompleto) {
      setProcesandoAceptar(false)
      setErrorAceptar("Otra dupla ya aceptó este desafío mientras completabas. Elegí otro.")
      cargarDesafios(); cargarReservas()
      return
    }
    if (turnoTomado) {
      setProcesandoAceptar(false)
      setErrorAceptar("Ese turno se acaba de reservar. Elegí otro horario.")
      cargarReservas()
      return
    }
    // Guardado CONFIRMADO: marcar el desafío como completo y verificar que quedó.
    const res = await guardarConfirmado(
      DESAFIOS_URL,
      { action: "aceptar", id: d.id, rival1, rival2, rivalTel1, rivalTel2 },
      (filas) => filas.some((x: any) => String(x.id) === String(d.id) && String(x.estado) === "completo"),
    )
    if (res !== "ok") {
      setProcesandoAceptar(false)
      setErrorAceptar("No pudimos confirmar el partido (puede ser la conexión). Reintentá en unos segundos.")
      return
    }
    // Reservar el turno (confirmado). Si la reserva no se confirmara, el partido igual
    // quedó armado y Dani puede reservarlo desde la Agenda del panel.
    await guardarConfirmado(
      RESERVAS_URL,
      { action: "reservar", fecha: formatFecha(d.fecha), turno: d.turno },
      (filas) => filas.some((r: any) => `${formatFecha(r.fecha)}|${String(r.turno).trim()}` === claveReserva),
    )
    setReservados(prev => new Set(prev).add(claveReserva))
    setDesafios(prev => prev.map(x => x.id === d.id ? { ...x, estado: "completo", rival1, rival2, rivalTel1, rivalTel2 } : x))
    setProcesandoAceptar(false)
    setAceptandoId(null); setConfirmandoAceptarId(null)
    setRival1(""); setRival2(""); setRivalTel1(""); setRivalTel2("")
    setTimeout(() => { cargarDesafios(); cargarReservas() }, 2000)
  }

  // Volver atrás desde el paso de confirmación (el usuario NO mandó el mensaje / se arrepintió)
  const cancelarAceptar = () => { setAceptandoId(null); setConfirmandoAceptarId(null); setErrorAceptar("") }

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
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ width: 24, height: 2, background: C.amarillo, display: "inline-block" }} />
            <span style={{ fontFamily: oswald, fontSize: 11.5, letterSpacing: "0.28em", textTransform: "uppercase", color: C.amarillo, fontWeight: 600 }}>Pelota Paleta · 2 vs 2</span>
            <span style={{ width: 24, height: 2, background: C.amarillo, display: "inline-block" }} />
          </div>
          <h1 style={{ fontFamily: anton, fontSize: "clamp(34px, 9vw, 60px)", textTransform: "uppercase", lineHeight: 1, color: C.blanco, margin: 0 }}>
            Muro de <span style={{ color: C.amarillo }}>Desafíos</span>
          </h1>
          <p style={{ fontFamily: inter, fontSize: 15, color: C.gris, lineHeight: 1.7, maxWidth: 480, margin: "18px auto 0" }}>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <h2 style={{ fontFamily: oswald, fontSize: 20, fontWeight: 700, textTransform: "uppercase", color: C.amarillo, letterSpacing: "0.05em", margin: 0 }}>
            Desafíos
          </h2>
          {admin && desafios.length > 0 && (
            <button onClick={borrarTodos} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: oswald, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: "#ff6b6b", background: "transparent", border: "1.5px solid #ff6b6b55", borderRadius: 8, padding: "8px 14px" }}>
              <Trash2 size={14} /> Borrar todos
            </button>
          )}
        </div>

        {cargando ? (
          <p style={{ fontFamily: inter, color: C.gris, textAlign: "center", padding: "30px 0" }}>Cargando…</p>
        ) : desafiosVisibles.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.cardBorde}`, borderRadius: 14, padding: "40px 20px", textAlign: "center" }}>
            <Swords size={32} color={C.grisTenue} style={{ marginBottom: 14 }} />
            <p style={{ fontFamily: inter, fontSize: 15, color: C.gris }}>Todavía no hay desafíos. ¡Sé el primero en publicar uno!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {desafiosVisibles.map((d) => {
              const completo = d.estado === "completo"
              return (
                <div key={d.id} style={{ background: C.card, border: `1px solid ${completo ? "#6B8F71" : C.cardBorde}`, borderRadius: 14, padding: isMobile ? 18 : 22 }}>
                  {admin && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                      <button onClick={() => borrarDesafio(d)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: oswald, fontSize: 12, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: "#ff6b6b", background: "transparent", border: "1.5px solid #ff6b6b55", borderRadius: 8, padding: "7px 12px" }}>
                        <Trash2 size={14} /> Borrar
                      </button>
                    </div>
                  )}
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
                        <button onClick={() => { setAceptandoId(d.id); setConfirmandoAceptarId(null); setRival1(""); setRival2(""); setRivalTel1(""); setRivalTel2(""); setErrorAceptar("") }} style={{
                          fontFamily: oswald, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700,
                          cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "12px 22px", borderRadius: 8,
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8, whiteSpace: "nowrap",
                        }}>
                          <Swords size={16} /> Unirse / Aceptar
                        </button>
                      )}
                    </div>
                  )}

                  {/* Mini-form para aceptar (PASO 1: cargar rivales y avisar por WhatsApp) */}
                  {!completo && aceptandoId === d.id && confirmandoAceptarId !== d.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.cardBorde}` }}>
                      <p style={{ fontFamily: oswald, fontSize: 14, textTransform: "uppercase", color: C.blanco, marginBottom: 10 }}>Tu dupla (los rivales)</p>
                      <input value={rival1} onChange={e => setRival1(e.target.value)} placeholder="Jugador 1 (nombre)" style={inputStyle} />
                      <input value={rivalTel1} onChange={e => setRivalTel1(e.target.value)} type="tel" inputMode="tel" placeholder={`Teléfono de ${rival1 || "Jugador 1"}`} style={inputStyle} />
                      <input value={rival2} onChange={e => setRival2(e.target.value)} placeholder="Jugador 2 (nombre)" style={inputStyle} />
                      <input value={rivalTel2} onChange={e => setRivalTel2(e.target.value)} type="tel" inputMode="tel" placeholder={`Teléfono de ${rival2 || "Jugador 2"}`} style={{ ...inputStyle, marginBottom: 14 }} />
                      {errorAceptar && <p style={{ fontFamily: inter, fontSize: 12.5, color: "#ff6b6b", marginBottom: 12 }}>{errorAceptar}</p>}
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => abrirWhatsAppAceptar(d)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: oswald, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "13px", borderRadius: 8 }}>
                          <Send size={15} /> Avisar a Dani por WhatsApp
                        </button>
                        <button onClick={cancelarAceptar} style={{ fontFamily: oswald, fontSize: 14, textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: C.gris, background: "transparent", border: `1.5px solid ${C.cardBorde}`, padding: "13px 18px", borderRadius: 8 }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PASO 2: confirmar que el mensaje se envió (recién acá se arma el partido) */}
                  {!completo && confirmandoAceptarId === d.id && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.cardBorde}` }}>
                      <p style={{ fontFamily: oswald, fontSize: 15, textTransform: "uppercase", color: C.amarillo, marginBottom: 8 }}>¿Le mandaste el mensaje a Dani?</p>
                      <p style={{ fontFamily: inter, fontSize: 13.5, color: C.gris, lineHeight: 1.6, marginBottom: 14 }}>
                        Confirmá <strong style={{ color: C.blanco }}>solo si ya enviaste el mensaje</strong> por WhatsApp. Al confirmar, el partido queda armado y el turno reservado. Si todavía no lo mandaste, tocá "Todavía no".
                      </p>
                      {errorAceptar && <p style={{ fontFamily: inter, fontSize: 12.5, color: "#ff6b6b", marginBottom: 12 }}>{errorAceptar}</p>}
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={() => confirmarEnviadoAceptar(d)} disabled={procesandoAceptar} style={{ flex: 1, minWidth: 160, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: oswald, fontSize: 14, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, cursor: procesandoAceptar ? "default" : "pointer", color: C.negro, background: "#6B8F71", border: "none", padding: "13px", borderRadius: 8, opacity: procesandoAceptar ? 0.7 : 1 }}>
                          <Check size={15} /> {procesandoAceptar ? "Confirmando…" : "Sí, ya lo mandé"}
                        </button>
                        <button onClick={() => setConfirmandoAceptarId(null)} disabled={procesandoAceptar} style={{ fontFamily: oswald, fontSize: 14, textTransform: "uppercase", fontWeight: 600, cursor: procesandoAceptar ? "default" : "pointer", color: C.gris, background: "transparent", border: `1.5px solid ${C.cardBorde}`, padding: "13px 18px", borderRadius: 8, opacity: procesandoAceptar ? 0.6 : 1 }}>
                          Todavía no
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 44 }}>
          {admin ? (
            <p style={{ fontFamily: inter, fontSize: 12, color: C.grisTenue, margin: 0 }}>
              🔧 Modo admin activo · <span onClick={salirAdmin} style={{ color: C.amarillo, cursor: "pointer", textDecoration: "underline" }}>salir</span>
            </p>
          ) : (
            <button onClick={activarAdmin} style={{ fontFamily: inter, fontSize: 12, color: C.grisTenue, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Modo admin</button>
          )}
        </div>
      </div>
    </main>
  )
}

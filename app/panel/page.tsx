"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Calendar, Clock, RefreshCw, Copy, Send, Check, ShieldCheck } from "lucide-react"
import { guardarConfirmado, leerFilas, telefonoWa, enviarPost } from "@/lib/sheets"

/* ── Paleta ── */
const C = {
  amarillo: "#FFD300",
  negro:    "#0A0A0A",
  card:     "#151515",
  cardBorde:"rgba(255,255,255,0.08)",
  blanco:   "#FFFFFF",
  gris:     "rgba(255,255,255,0.55)",
  grisTenue:"rgba(255,255,255,0.35)",
  verde:    "#6B8F71",
}
const anton  = "'Anton', sans-serif"
const oswald = "'Oswald', sans-serif"
const inter  = "'Inter', sans-serif"

// Misma planilla individual (la que ya usás para anotarse)
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyj8eaiibJGXDL2PrnRtpFXpXf8iaoFvJVSyT2SWRIqamETclFhMTNu-0OkXqW8I3qbOg/exec"
// Agenda de la cancha (turnos ocupados)
const RESERVAS_URL = "https://script.google.com/macros/s/AKfycbwQ4-dYzUabsSYN5Xx3gnqeM00tKwYye3D2sk3_ipEAgoabR3JyJ0rIQXZ6QmDIB44d/exec"
// Clave del PANEL: solo Dani (distinta de la del club, que es la del muro de desafíos)
const CLAVE = "dani2026"

const ORDEN_CAT = ["Primera", "Segunda", "Tercera", "Cuarta"]
const ORDEN_TURNO = ["17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00"]
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

interface Anotado {
  nombre: string
  posicion: string
  categoria: string
  fechaJugar: string  // DD/MM/YYYY
  turnos: string      // "turno1, turno2"
  telefono: string
}
interface Jugador {
  key: string
  nombre: string
  posicion: string
  categoria: string
  fechaJugar: string
  turno: string
  telefono: string
}
interface Grupo {
  clave: string
  fechaJugar: string
  turno: string
  categoria: string
  jugadores: Jugador[]
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

function parseFecha(v: string): Date | null {
  const s = String(v || "").trim()
  // formato DD/MM/YYYY
  const p = s.split(" ")[0].split("/")
  if (p.length === 3) {
    const d = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10))
    if (!isNaN(d.getTime())) return d
  }
  // fallback: texto de fecha en inglés ("Wed Mar 26 2026...") o ISO
  const d2 = new Date(s)
  return isNaN(d2.getTime()) ? null : d2
}
function fechaCompleta(v: string): string {
  const d = parseFecha(v)
  if (!d || isNaN(d.getTime())) return v
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  return `${DIAS_LARGO[d.getDay()]} ${dd}/${mm}`
}
// DD/MM/YYYY (para que las reservas coincidan con el sistema de desafíos)
function fechaDMY(v: string): string {
  const d = parseFecha(v)
  if (!d) return String(v || "").split(" ")[0]
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
}

export default function PanelPage() {
  const isMobile = useIsMobile()
  const [anotados, setAnotados] = useState<Anotado[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [seleccion, setSeleccion] = useState<Record<string, Jugador>>({})
  const [copiado, setCopiado] = useState(false)
  const [avisando, setAvisando] = useState(false)                       // paso de avisar 1x1
  const [avisados, setAvisados] = useState<Record<string, boolean>>({}) // qué jugadores ya avisó
  const [procesando, setProcesando] = useState(false)
  const [reservados, setReservados] = useState<Set<string>>(new Set())

  // Acceso con contraseña
  const [unlocked, setUnlocked] = useState(false)
  const [claveInput, setClaveInput] = useState("")
  const [claveError, setClaveError] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("trinquete_panel_dani") === "1") setUnlocked(true)
  }, [])
  const entrar = () => {
    if (claveInput.trim().toLowerCase() === CLAVE.toLowerCase()) {
      localStorage.setItem("trinquete_panel_dani", "1"); setUnlocked(true); setClaveError(false)
    } else setClaveError(true)
  }

  const cargar = (intentos = 2) => {
    setError(false)
    fetch(SHEET_URL)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) throw new Error("formato")
        const filtrados = data.filter(x => x && String(x.nombre || "").trim())
        setAnotados(filtrados)
        try { localStorage.setItem("trinquete_panel_cache", JSON.stringify(filtrados)) } catch {}
        setCargando(false); setError(false)
      })
      .catch(() => {
        if (intentos > 0) { setTimeout(() => cargar(intentos - 1), 1200) }   // reintenta solo
        else { setCargando(false); setError(true) }
      })
  }
  useEffect(() => {
    if (!unlocked) return
    // mostrar al instante lo último cargado (caché), mientras refresca en segundo plano
    try {
      const c = localStorage.getItem("trinquete_panel_cache")
      if (c) { const arr = JSON.parse(c); if (Array.isArray(arr) && arr.length) { setAnotados(arr); setCargando(false) } }
    } catch {}
    cargar()
    cargarReservas()
    // refresco automático cada 20s (mantiene anotados y reservas al día entre dispositivos)
    const iv = setInterval(() => { cargar(); cargarReservas() }, 20000)
    const onFocus = () => { cargar(); cargarReservas() }
    window.addEventListener("focus", onFocus)
    return () => { clearInterval(iv); window.removeEventListener("focus", onFocus) }
  }, [unlocked])

  const cargarReservas = () => {
    fetch(RESERVAS_URL)
      .then(r => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReservados(new Set(data.map((r: any) => `${fechaDMY(r.fecha)}|${String(r.turno).trim()}`)))
      })
      .catch(() => {})
  }

  // Agrupar a todos los disponibles por DÍA + HORARIO (cada jugador entra por cada turno que eligió)
  const grupos: Grupo[] = (() => {
    const mapa: Record<string, Grupo> = {}
    anotados.forEach((a, idx) => {
      const turnos = String(a.turnos || "").split(",").map(t => t.trim()).filter(Boolean)
      const lista = turnos.length ? turnos : ["(sin turno)"]
      lista.forEach(turno => {
        const clave = `${a.fechaJugar}||${turno}`
        if (!mapa[clave]) mapa[clave] = { clave, fechaJugar: a.fechaJugar, turno, categoria: "", jugadores: [] }
        mapa[clave].jugadores.push({
          key: `${clave}__${idx}`,
          nombre: a.nombre, posicion: a.posicion, categoria: a.categoria,
          fechaJugar: a.fechaJugar, turno, telefono: a.telefono,
        })
      })
    })
    return Object.values(mapa).sort((g1, g2) => {
      const d1 = parseFecha(g1.fechaJugar)?.getTime() ?? Infinity
      const d2 = parseFecha(g2.fechaJugar)?.getTime() ?? Infinity
      if (d1 !== d2) return d1 - d2
      return ORDEN_TURNO.indexOf(g1.turno) - ORDEN_TURNO.indexOf(g2.turno)
    })
  })()

  // Separar en "listos para armar" (2 del + 2 zag) e "incompletos"
  const esListo = (g: Grupo) => {
    const del = g.jugadores.filter(j => /delantero/i.test(j.posicion)).length
    const zag = g.jugadores.filter(j => /zaguero/i.test(j.posicion)).length
    return del >= 2 && zag >= 2
  }
  const listos = grupos.filter(esListo)
  const incompletos = grupos.filter(g => !esListo(g))

  // Aviso "faltan jugadores" por WhatsApp (Dani lo manda al grupo)
  const avisarFaltan = (g: Grupo, fd: number, fz: number) => {
    const partes: string[] = []
    if (fd) partes.push(`${fd} delantero${fd > 1 ? "s" : ""}`)
    if (fz) partes.push(`${fz} zaguero${fz > 1 ? "s" : ""}`)
    const msg = `¡Faltan jugadores para armar un partido de pelota paleta! 🎾\n${fechaCompleta(g.fechaJugar)} · ${g.turno}\nNecesitamos ${partes.join(" y ")}. ¡Anótense en la web!`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const toggle = (j: Jugador) => {
    setSeleccion(prev => {
      const n = { ...prev }
      if (n[j.key]) delete n[j.key]; else n[j.key] = j
      return n
    })
    setCopiado(false)
  }

  const seleccionados = Object.values(seleccion)
  const mensajeArmado = (() => {
    if (!seleccionados.length) return ""
    const b = seleccionados[0]
    const lineas = seleccionados.map(p => `• ${p.nombre} (${p.posicion})`).join("\n")
    return `🎾 ¡Partido armado!\n\n${fechaCompleta(b.fechaJugar)}\nHorario: ${b.turno}\nCategoría: ${b.categoria}\n\nJugadores:\n${lineas}`
  })()
  // Mensaje personalizado para avisarle a UN jugador (le dice con quién juega, sin repetirlo a él)
  const mensajePara = (j: Jugador) => {
    const b = seleccionados[0]
    const otros = seleccionados.filter(p => p.key !== j.key).map(p => p.nombre)
    const conQuien = otros.length ? `👥 Jugás con: ${otros.join(", ")}\n` : ""
    return `🎾 ¡Se armó tu partido de pelota paleta!\n\n📅 ${fechaCompleta(b.fechaJugar)}\n🕐 ${b.turno}\n${conQuien}📍 Cancha del Trinquete. ¡Te esperamos!`
  }
  const copiar = () => {
    if (!mensajeArmado) return
    navigator.clipboard?.writeText(mensajeArmado).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2500) }).catch(() => {})
  }
  // Borra los jugadores armados de la planilla de Google
  const quitarDeLaPlanilla = (jugadores: Jugador[]) => {
    enviarPost(SHEET_URL, { action: "quitar", jugadores: jugadores.map(j => ({ nombre: j.nombre, telefono: j.telefono })) })
  }
  // Recién acá se borran (cuando Dani confirma que efectivamente avisó)
  const confirmarEnviado = async () => {
    const armados = seleccionados
    const base = armados[0]
    if (!base) { setAvisando(false); return }
    setProcesando(true)
    const fResv = fechaDMY(base.fechaJugar)
    const clave = `${fResv}|${String(base.turno).trim()}`
    // Anti doble-reserva: ¿el turno ya está tomado (por un desafío u otro armado)?
    const reservasAhora = await leerFilas(RESERVAS_URL)
    const tomado = reservasAhora.some((r: any) => `${fechaDMY(r.fecha)}|${String(r.turno).trim()}` === clave)
    if (tomado) {
      setReservados(new Set(reservasAhora.map((r: any) => `${fechaDMY(r.fecha)}|${String(r.turno).trim()}`)))
      setProcesando(false); setAvisando(false)
      alert("Ojo: ese turno ya figura reservado (quizás por un desafío). No armé el partido para no pisar la cancha; revisá la Agenda de turnos.")
      return
    }
    // Reservar el turno de la cancha (guardado CONFIRMADO)
    const res = await guardarConfirmado(
      RESERVAS_URL,
      { action: "reservar", fecha: fResv, turno: base.turno },
      (filas) => filas.some((r: any) => `${fechaDMY(r.fecha)}|${String(r.turno).trim()}` === clave),
    )
    if (res !== "ok") {
      setProcesando(false)
      alert("No pudimos confirmar la reserva del turno (puede ser la conexión). Reintentá en unos segundos.")
      return
    }
    setReservados(prev => new Set(prev).add(clave))
    // Sacar a los jugadores de la lista de anotados
    quitarDeLaPlanilla(armados)
    const fuera: Record<string, boolean> = {}
    armados.forEach(j => { fuera[`${j.nombre}__${j.telefono}`] = true })
    setAnotados(prev => prev.filter(a => !fuera[`${a.nombre}__${a.telefono}`]))
    setSeleccion({})
    setProcesando(false)
    setAvisando(false)
    setAvisados({})
  }

  // Liberar un turno reservado (si el partido se canceló)
  const liberarTurno = (fechaJugar: string, turno: string) => {
    if (!confirm("¿Liberar este turno? Va a quedar disponible de nuevo para armar o desafiar.")) return
    const f = fechaDMY(fechaJugar)
    enviarPost(RESERVAS_URL, { action: "liberar", fecha: f, turno })
    setReservados(prev => { const n = new Set(prev); n.delete(`${f}|${String(turno).trim()}`); return n })
  }

  // Lista de TODOS los turnos reservados (lee directo de la planilla), ordenada por fecha y horario.
  // Es la "red de seguridad": muestra hasta las reservas que no tienen un partido visible detrás.
  const listaReservas = Array.from(reservados)
    .map(k => { const i = k.indexOf("|"); return { fecha: k.slice(0, i), turno: k.slice(i + 1) } })
    .filter(r => r.fecha)
    .sort((a, b) => {
      const ka = a.fecha.split("/").reverse().join("")
      const kb = b.fecha.split("/").reverse().join("")
      return ka === kb ? a.turno.localeCompare(b.turno) : ka.localeCompare(kb)
    })

  // Dibuja la tarjeta de un grupo (día + horario)
  const renderGrupo = (g: Grupo) => {
    const del = g.jugadores.filter(j => /delantero/i.test(j.posicion))
    const zag = g.jugadores.filter(j => /zaguero/i.test(j.posicion))
    const otros = g.jugadores.filter(j => !/delantero|zaguero/i.test(j.posicion))
    const listo = del.length >= 2 && zag.length >= 2
    const reservado = reservados.has(`${fechaDMY(g.fechaJugar)}|${String(g.turno).trim()}`)
    const faltanDel = Math.max(0, 2 - del.length)
    const faltanZag = Math.max(0, 2 - zag.length)
    const faltanTxt = [faltanDel ? `${faltanDel} delantero${faltanDel > 1 ? "s" : ""}` : null, faltanZag ? `${faltanZag} zaguero${faltanZag > 1 ? "s" : ""}` : null].filter(Boolean).join(" y ")
    const Col = ({ titulo, arr }: { titulo: string; arr: Jugador[] }) => (
      arr.length === 0 ? null : (
        <div style={{ flex: 1, minWidth: isMobile ? "100%" : 220 }}>
          <p style={{ fontFamily: oswald, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: C.amarillo, marginBottom: 10 }}>{titulo} · {arr.length}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {arr.map(j => {
              const sel = !!seleccion[j.key]
              return (
                <div key={j.key} onClick={reservado ? undefined : () => toggle(j)} role="button" tabIndex={0}
                  style={{ cursor: reservado ? "default" : "pointer", opacity: reservado ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                    background: sel ? "rgba(255,211,0,0.14)" : "#0d0d0d", border: `1.5px solid ${sel ? C.amarillo : C.cardBorde}`,
                    borderRadius: 9, padding: "10px 12px", transition: "all 0.15s" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    {!reservado && <span style={{ width: 18, height: 18, flexShrink: 0, borderRadius: 5, border: `1.5px solid ${sel ? C.amarillo : C.grisTenue}`, background: sel ? C.amarillo : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {sel && <Check size={13} color={C.negro} strokeWidth={3} />}
                    </span>}
                    <span style={{ fontFamily: inter, fontSize: 14, fontWeight: 500, color: C.blanco, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.nombre}</span>
                    <span style={{ flexShrink: 0, fontFamily: inter, fontSize: 10, fontWeight: 700, color: C.amarillo, border: `1px solid ${C.amarillo}55`, borderRadius: 999, padding: "2px 7px", textTransform: "uppercase" }}>{j.categoria}</span>
                  </span>
                  <a href={`https://wa.me/${telefonoWa(j.telefono)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{ flexShrink: 0, fontFamily: inter, fontSize: 12, color: C.gris, textDecoration: "underline", whiteSpace: "nowrap" }}>{j.telefono}</a>
                </div>
              )
            })}
          </div>
        </div>
      )
    )
    return (
      <div key={g.clave} style={{ background: C.card, border: `1px solid ${reservado ? C.cardBorde : (listo ? C.verde : C.cardBorde)}`, borderRadius: 14, padding: isMobile ? 16 : 22, opacity: reservado ? 0.9 : 1 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            <p style={{ fontFamily: oswald, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: C.amarillo }}>Disponibles</p>
            {reservado && <span style={{ fontFamily: inter, fontSize: 11, fontWeight: 700, color: C.blanco, background: "rgba(255,255,255,0.1)", border: `1px solid ${C.cardBorde}`, padding: "4px 11px", borderRadius: 999, textTransform: "uppercase", whiteSpace: "nowrap" }}>🔒 Turno reservado</span>}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: oswald, fontSize: isMobile ? 19 : 22, fontWeight: 700, textTransform: "uppercase", color: C.blanco, marginBottom: 8 }}>
            <Calendar size={18} color={C.amarillo} /> {fechaCompleta(g.fechaJugar)}
          </span>
          <p style={{ fontFamily: inter, fontSize: 14.5, color: C.blanco, margin: 0 }}>
            <span style={{ color: C.amarillo, fontWeight: 600 }}>Horario:</span> {g.turno} <span style={{ color: C.grisTenue }}>· {g.jugadores.length} disponible{g.jugadores.length !== 1 ? "s" : ""}</span>
          </p>
        </div>
        {reservado && (
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.cardBorde}`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: inter, fontSize: 13.5, color: C.gris }}>Este turno ya tiene un partido armado.</span>
            <button onClick={() => liberarTurno(g.fechaJugar, g.turno)} style={{ fontFamily: oswald, fontSize: 12.5, textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.blanco, background: "transparent", border: `1.5px solid ${C.cardBorde}`, padding: "8px 14px", borderRadius: 7 }}>
              Liberar turno
            </button>
          </div>
        )}
        {!listo && !reservado && (
          <div style={{ marginBottom: 16, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.cardBorde}`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontFamily: inter, fontSize: 13.5, color: C.gris }}>Faltan <strong style={{ color: C.blanco }}>{faltanTxt}</strong> para armar</span>
            <button onClick={() => avisarFaltan(g, faltanDel, faltanZag)} style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: oswald, fontSize: 12.5, textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "9px 14px", borderRadius: 7 }}>
              <Send size={13} /> Avisar que faltan
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Col titulo="Delanteros" arr={del} />
          <Col titulo="Zagueros" arr={zag} />
          <Col titulo="Sin posición" arr={otros} />
        </div>
      </div>
    )
  }

  /* ── Pantalla de contraseña ── */
  if (!unlocked) {
    return (
      <main style={{ background: C.negro, minHeight: "100vh", color: C.blanco, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <ShieldCheck size={40} color={C.amarillo} style={{ marginBottom: 18 }} />
        <h1 style={{ fontFamily: anton, fontSize: "clamp(26px, 8vw, 42px)", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Panel de Dani</h1>
        <p style={{ fontFamily: inter, fontSize: 14, color: C.gris, marginBottom: 26, textAlign: "center", maxWidth: 320 }}>Panel privado. Ingresá tu clave de administrador (Dani).</p>
        <input type="password" value={claveInput}
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
    <main style={{ background: C.negro, minHeight: "100vh", color: C.blanco, paddingBottom: seleccionados.length ? 120 : 40 }}>
      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: `3px solid ${C.amarillo}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 40px", height: 60 }}>
        <Link href="/" style={{ fontFamily: oswald, fontWeight: 700, fontSize: 16, textTransform: "uppercase", color: C.negro, textDecoration: "none" }}>← Inicio</Link>
        <span style={{ fontFamily: anton, fontSize: 18, textTransform: "uppercase", color: C.negro }}>Panel de Dani</span>
      </nav>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: isMobile ? "32px 16px 0" : "48px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: anton, fontSize: "clamp(28px, 7vw, 44px)", textTransform: "uppercase", lineHeight: 1 }}>Armado de partidos</h1>
            <p style={{ fontFamily: inter, fontSize: 14, color: C.gris, marginTop: 8, maxWidth: 520, lineHeight: 1.6 }}>
              Anotados individuales, agrupados por <strong style={{ color: C.blanco }}>fecha · turno · categoría</strong>. Tocá los jugadores para armar un partido y avisarles.
            </p>
          </div>
          <button onClick={() => cargar()} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: oswald, fontSize: 13, textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "10px 16px", borderRadius: 8 }}>
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>

        {cargando && anotados.length === 0 ? (
          <p style={{ fontFamily: inter, color: C.gris, textAlign: "center", padding: "50px 0" }}>Cargando anotados…</p>
        ) : error && anotados.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid #ff6b6b55`, borderRadius: 14, padding: "32px 22px", textAlign: "center", marginTop: 24 }}>
            <p style={{ fontFamily: inter, fontSize: 15, color: C.blanco, marginBottom: 8 }}>No se pudieron cargar los anotados.</p>
            <p style={{ fontFamily: inter, fontSize: 13, color: C.gris, marginBottom: 20, lineHeight: 1.6 }}>
              Revisá la conexión y volvé a intentar. Si sigue fallando, siempre podés ver todo directo en la planilla de Google.
            </p>
            <button onClick={() => cargar()} style={{ fontFamily: oswald, fontSize: 14, textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "12px 24px", borderRadius: 8 }}>Reintentar</button>
          </div>
        ) : grupos.length === 0 ? (
          <div style={{ background: C.card, border: `1px solid ${C.cardBorde}`, borderRadius: 14, padding: "44px 20px", textAlign: "center", marginTop: 24 }}>
            <Users size={32} color={C.grisTenue} style={{ marginBottom: 14 }} />
            <p style={{ fontFamily: inter, fontSize: 15, color: C.gris }}>Todavía no hay nadie anotado.</p>
          </div>
        ) : (
          <div style={{ marginTop: 28 }}>
            {/* Sección: LISTOS PARA ARMAR */}
            {listos.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: oswald, fontSize: 18, fontWeight: 700, textTransform: "uppercase", color: C.verde, letterSpacing: "0.05em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <Check size={20} color={C.verde} /> Listos para armar
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {listos.map(renderGrupo)}
                </div>
              </div>
            )}

            {/* Sección: ESPERANDO MÁS JUGADORES */}
            {incompletos.length > 0 && (
              <div>
                <h2 style={{ fontFamily: oswald, fontSize: 18, fontWeight: 700, textTransform: "uppercase", color: C.grisTenue, letterSpacing: "0.05em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock size={18} color={C.grisTenue} /> Esperando más jugadores
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {incompletos.map(renderGrupo)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección: AGENDA · TURNOS RESERVADOS (red de seguridad, siempre visible) */}
        <div style={{ marginTop: 44, paddingTop: 32, borderTop: `1px solid ${C.cardBorde}` }}>
          <h2 style={{ fontFamily: oswald, fontSize: 18, fontWeight: 700, textTransform: "uppercase", color: C.amarillo, letterSpacing: "0.05em", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <Calendar size={18} color={C.amarillo} /> Agenda · Turnos reservados
          </h2>
          <p style={{ fontFamily: inter, fontSize: 13.5, color: C.gris, marginBottom: 18, maxWidth: 560, lineHeight: 1.6 }}>
            Todos los turnos con la cancha ocupada. Si un partido se canceló o quedó viejo, tocá <strong style={{ color: C.blanco }}>Liberar</strong> y el turno vuelve a estar disponible para anotarse o desafiar.
          </p>
          {listaReservas.length === 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.cardBorde}`, borderRadius: 12, padding: "22px 18px", textAlign: "center" }}>
              <p style={{ fontFamily: inter, fontSize: 14, color: C.gris, margin: 0 }}>No hay ningún turno reservado.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {listaReservas.map(r => (
                <div key={`${r.fecha}|${r.turno}`} style={{ background: C.card, border: `1px solid ${C.cardBorde}`, borderRadius: 11, padding: isMobile ? "12px 14px" : "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 15 }}>🔒</span>
                    <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontFamily: oswald, fontSize: 15.5, fontWeight: 700, textTransform: "uppercase", color: C.blanco }}>{fechaCompleta(r.fecha)}</span>
                      <span style={{ fontFamily: inter, fontSize: 13, color: C.gris }}>{r.turno}</span>
                    </span>
                  </span>
                  <button onClick={() => liberarTurno(r.fecha, r.turno)} style={{ flexShrink: 0, fontFamily: oswald, fontSize: 12.5, textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.blanco, background: "transparent", border: `1.5px solid ${C.cardBorde}`, padding: "9px 16px", borderRadius: 7 }}>
                    Liberar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barra flotante de selección */}
      {seleccionados.length > 0 && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60, background: "#0d0d0d", borderTop: `2px solid ${C.amarillo}`, padding: isMobile ? "12px 16px" : "14px 24px" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            {avisando ? (
              /* Paso AVISAR: un botón por jugador (WhatsApp con mensaje listo). Recién al final se arma. */
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: inter, fontSize: 13, color: C.gris, lineHeight: 1.4 }}>
                    Tocá <strong style={{ color: C.blanco }}>Avisar</strong> a cada jugador (se abre su WhatsApp con el mensaje listo). Cuando avisaste a todos, tocá <strong style={{ color: C.blanco }}>Armar partido</strong>.
                  </span>
                  <button onClick={() => setAvisando(false)} disabled={procesando} style={{ fontFamily: oswald, fontSize: 13, textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: C.gris, background: "none", border: "none", textDecoration: "underline" }}>← Volver</button>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {seleccionados.map(j => {
                    const listo = !!avisados[j.key]
                    return (
                      <a key={j.key} href={`https://wa.me/${telefonoWa(j.telefono)}?text=${encodeURIComponent(mensajePara(j))}`} target="_blank" rel="noopener noreferrer"
                        onClick={() => setAvisados(p => ({ ...p, [j.key]: true }))}
                        style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: oswald, fontSize: 13.5, fontWeight: 700, textTransform: "uppercase", textDecoration: "none",
                          color: listo ? C.verde : C.negro, background: listo ? "transparent" : C.amarillo, border: `1.5px solid ${listo ? C.verde : C.amarillo}`, padding: "10px 14px", borderRadius: 8 }}>
                        {listo ? <Check size={14} color={C.verde} /> : <Send size={14} />} {listo ? `${j.nombre} ✓` : `Avisar a ${j.nombre}`}
                      </a>
                    )
                  })}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button onClick={copiar} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: oswald, fontSize: 13, textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: C.gris, background: "transparent", border: `1.5px solid ${C.cardBorde}`, padding: "10px 14px", borderRadius: 8 }}>
                    {copiado ? <><Check size={14} color={C.verde} /> Copiado</> : <><Copy size={14} /> Copiar (grupo)</>}
                  </button>
                  <button onClick={confirmarEnviado} disabled={procesando} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: oswald, fontSize: 14, textTransform: "uppercase", fontWeight: 700, cursor: procesando ? "default" : "pointer", color: C.negro, background: C.verde, border: "none", padding: "11px 18px", borderRadius: 8, opacity: procesando ? 0.7 : 1 }}>
                    <Check size={15} /> {procesando ? "Armando…" : "Listo, armar partido"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontFamily: oswald, fontSize: 15, fontWeight: 700, textTransform: "uppercase", color: C.blanco }}>
                  {seleccionados.length} seleccionado{seleccionados.length !== 1 ? "s" : ""}
                </span>
                <button onClick={() => setSeleccion({})} style={{ fontFamily: inter, fontSize: 13, color: C.gris, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Limpiar</button>
                <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                  <button onClick={copiar} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: oswald, fontSize: 14, textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: C.blanco, background: "transparent", border: `1.5px solid ${C.cardBorde}`, padding: "11px 16px", borderRadius: 8 }}>
                    {copiado ? <><Check size={15} color={C.verde} /> Copiado</> : <><Copy size={15} /> Copiar</>}
                  </button>
                  <button onClick={() => { setAvisados({}); setAvisando(true) }} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: oswald, fontSize: 14, textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "11px 18px", borderRadius: 8 }}>
                    <Send size={15} /> Avisar jugadores
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

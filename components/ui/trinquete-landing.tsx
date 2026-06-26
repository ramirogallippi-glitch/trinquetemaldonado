"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { HeroGeometric } from "./shape-landing-hero"
import {
  Dumbbell, Bike, Target, Clock, MapPin, Phone, AtSign,
  CheckCircle2, ChevronRight, Send, Droplets,
} from "lucide-react"

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
const oswald = "'Oswald', sans-serif"
const inter  = "'Inter', sans-serif"
const WA     = "5491141626719"

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const ck = () => setM(window.innerWidth < 768)
    ck(); window.addEventListener("resize", ck)
    return () => window.removeEventListener("resize", ck)
  }, [])
  return m
}

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })

/* ── Título de sección ── */
function SectionTitle({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 48 }}>
      <p style={{ fontFamily: inter, fontSize: 12, letterSpacing: "0.25em", color: C.amarillo, textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>{eyebrow}</p>
      <h2 style={{ fontFamily: oswald, fontSize: "clamp(32px, 6vw, 56px)", fontWeight: 700, textTransform: "uppercase", lineHeight: 1, color: C.blanco }}>{title}</h2>
      {sub && <p style={{ fontFamily: inter, fontSize: 15, color: C.gris, maxWidth: 520, margin: "16px auto 0", lineHeight: 1.7 }}>{sub}</p>}
    </div>
  )
}

/* ── Navbar ── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const links = [
    { label: "Servicios", id: "servicios" },
    { label: "Paleta", id: "paleta" },
    { label: "Galería", id: "galeria" },
    { label: "Contacto", id: "contacto" },
  ]
  const go = (id: string) => { scrollTo(id); setOpen(false) }

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, width: "100%", boxSizing: "border-box",
        background: "#FFFFFF",
        borderBottom: `3px solid ${C.amarillo}`,
        boxShadow: scrolled ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
        transition: "box-shadow 0.35s ease",
      }}>
        <div style={{ position: "relative", padding: isMobile ? "0 20px" : "0 40px", height: isMobile ? 56 : 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, zIndex: 2 }}>
            <span style={{ fontFamily: oswald, fontWeight: 700, fontSize: isMobile ? 18 : 21, textTransform: "uppercase", lineHeight: 1, color: C.negro, letterSpacing: "0.01em" }}>
              Trinquete <span style={{ color: C.amarillo }}>Maldonado</span>
            </span>
          </button>

          {!isMobile ? (
            <>
              {/* Links centrados */}
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", gap: 6 }}>
                {links.map(l => (
                  <button key={l.id} onClick={() => go(l.id)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: oswald, fontSize: 15, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: C.negro, padding: "8px 16px", transition: "color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = C.amarillo}
                    onMouseLeave={e => e.currentTarget.style.color = C.negro}>{l.label}</button>
                ))}
              </div>

              {/* Botón Anotarme (amarillo para resaltar sobre el blanco) */}
              <button onClick={() => go("paleta")} style={{ fontFamily: oswald, fontSize: 14, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "11px 26px", borderRadius: 6, zIndex: 2, transition: "transform 0.15s", boxShadow: "0 4px 14px rgba(255,211,0,0.45)" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>Anotarme</button>
            </>
          ) : (
            <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5, padding: 4, zIndex: 2 }}>
              {[0,1,2].map(i => (
                <span key={i} style={{ display: "block", width: 24, height: 2.5, background: C.negro, transition: "all 0.3s",
                  transform: open ? (i===0 ? "rotate(45deg) translate(4px,4px)" : i===2 ? "rotate(-45deg) translate(5px,-5px)" : "scaleX(0)") : "none" }} />
              ))}
            </button>
          )}
        </div>
      </nav>

      {isMobile && open && (
        <div style={{ position: "fixed", top: 59, left: 0, right: 0, zIndex: 49, background: "#FFFFFF", borderBottom: `3px solid ${C.amarillo}`, boxShadow: "0 8px 20px rgba(0,0,0,0.15)", padding: "6px 0 18px" }}>
          {links.map(l => (
            <button key={l.id} onClick={() => go(l.id)} style={{ display: "block", width: "100%", padding: "13px 24px", background: "none", border: "none", cursor: "pointer", fontFamily: oswald, fontSize: 19, fontWeight: 600, textTransform: "uppercase", color: C.negro, textAlign: "left" }}>{l.label}</button>
          ))}
          <div style={{ padding: "12px 24px 0" }}>
            <button onClick={() => go("paleta")} style={{ width: "100%", fontFamily: oswald, fontSize: 17, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "14px", borderRadius: 6 }}>Anotarme a jugar</button>
          </div>
        </div>
      )}
    </>
  )
}

/* ── Servicios ── */
const servicios = [
  {
    icon: Dumbbell, titulo: "Musculación", color: C.amarillo,
    desc: "Sala completa de musculación con máquinas y peso libre. Entrená a tu ritmo con asesoramiento.",
    items: ["Máquinas y peso libre", "Profesores en sala", "Acceso libre"],
    precio: "Consultar",
  },
  {
    icon: Bike, titulo: "Spinning", color: "#fff",
    desc: "Clases de spinning en grupo con instructores. Energía, música y buen ritmo en cada sesión.",
    items: ["Clases grupales", "Distintos horarios", "Todos los niveles"],
    precio: "Consultar",
  },
  {
    icon: Target, titulo: "Pelota Paleta", color: C.amarillo,
    desc: "Cancha profesional de trinquete. Armá tu partido anotándote por horario y posición.",
    items: ["Cancha profesional", "Armado de partidos", "Todas las categorías"],
    precio: "Por turno",
    destacado: true,
  },
  {
    icon: Droplets, titulo: "Vestuarios", color: "#fff",
    desc: "Vestuarios amplios para hombres y mujeres, pensados para tu comodidad después de entrenar.",
    items: ["Duchas individuales divididas", "Agua caliente y fría", "Hombres y mujeres"],
    precio: "Incluido",
  },
]

function ServiciosSection() {
  const isMobile = useIsMobile()
  return (
    <section id="servicios" style={{ padding: isMobile ? "72px 20px" : "110px 40px", background: C.negro }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionTitle eyebrow="Lo que ofrecemos" title="Nuestros servicios" sub="Un gimnasio de barrio con todo lo que necesitás para entrenar y jugar." />

        {/* Seguimiento personalizado (arriba de las tarjetas) */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          style={{ marginBottom: 18, background: C.card, border: `1px solid ${C.amarillo}55`, borderRadius: 14, padding: isMobile ? "28px 22px" : "36px 40px", textAlign: "center" }}>
          <h3 style={{ fontFamily: oswald, fontSize: isMobile ? 24 : 30, fontWeight: 700, textTransform: "uppercase", color: C.blanco, marginBottom: 14 }}>
            Entrenamiento <span style={{ color: C.amarillo }}>personalizado</span>
          </h3>
          <p style={{ fontFamily: inter, fontSize: isMobile ? 14 : 15.5, color: C.gris, lineHeight: 1.8, maxWidth: 600, margin: "0 auto 26px" }}>
            Nuestros profesores hacen un seguimiento personalizado, adaptando cada rutina a tus necesidades y objetivos. Sea cual sea tu meta, te acompañamos en cada paso.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {[
              "Recuperación de lesiones",
              "Powerlifting",
              "Atletismo",
              "Deportes de combate",
              "Fútbol",
              "Acondicionamiento físico",
              "Objetivos personales",
            ].map(d => (
              <span key={d} style={{
                fontFamily: inter, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)",
                background: "rgba(255,255,255,0.04)", border: `1px solid ${C.amarillo}55`, borderRadius: 999, padding: "9px 16px",
              }}>{d}</span>
            ))}
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 18 }}>
          {servicios.map(s => {
            const Icon = s.icon
            return (
              <motion.div key={s.titulo}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
                style={{ position: "relative", background: C.card, border: `1px solid ${s.destacado ? C.amarillo : C.cardBorde}`, borderRadius: 14, padding: 28, overflow: "hidden" }}>
                {s.destacado && (
                  <span style={{ position: "absolute", top: 16, right: 16, fontFamily: inter, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C.negro, background: C.amarillo, padding: "4px 10px", borderRadius: 999 }}>Destacado</span>
                )}
                <div style={{ width: 52, height: 52, borderRadius: 12, background: s.color === C.amarillo ? "rgba(255,211,0,0.12)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icon size={26} color={s.color === C.amarillo ? C.amarillo : "#fff"} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontFamily: oswald, fontSize: 26, fontWeight: 600, textTransform: "uppercase", color: C.blanco, marginBottom: 10 }}>{s.titulo}</h3>
                <p style={{ fontFamily: inter, fontSize: 14, color: C.gris, lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</p>
                <div style={{ marginBottom: 22 }}>
                  {s.items.map(it => (
                    <div key={it} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                      <CheckCircle2 size={16} color={C.amarillo} />
                      <span style={{ fontFamily: inter, fontSize: 13.5, color: "rgba(255,255,255,0.75)" }}>{it}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 18, borderTop: `1px solid ${C.cardBorde}` }}>
                  <span style={{ fontFamily: oswald, fontSize: 20, fontWeight: 600, color: s.color === C.amarillo ? C.amarillo : "#fff" }}>{s.precio}</span>
                  <button onClick={() => scrollTo(s.destacado ? "paleta" : "contacto")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontFamily: inter, fontSize: 13, fontWeight: 600, color: C.gris }}>
                    {s.destacado ? "Anotarme" : "Consultar"} <ChevronRight size={15} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── Formulario Pelota Paleta → WhatsApp ── */
const POSICIONES = ["Delantero", "Zaguero"]
const CATEGORIAS = ["Primera", "Segunda", "Tercera", "Cuarta"]
// Turnos de pelota paleta
const TURNOS = ["17:30 - 19:00", "19:00 - 20:30", "20:30 - 22:00"]
// Planilla de Google (Apps Script) donde se guardan los anotados
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyj8eaiibJGXDL2PrnRtpFXpXf8iaoFvJVSyT2SWRIqamETclFhMTNu-0OkXqW8I3qbOg/exec"

function PaletaSection() {
  const isMobile = useIsMobile()
  const [nombre, setNombre] = useState("")
  const [posicion, setPosicion] = useState("")
  const [categoria, setCategoria] = useState("")
  const [fecha, setFecha] = useState("")
  const [turnos, setTurnos] = useState<string[]>([])
  const [error, setError] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [sent, setSent] = useState(false)

  const toggle = (arr: string[], set: (v: string[]) => void, val: string) =>
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val])

  const enviar = async () => {
    if (!nombre.trim() || !posicion || !categoria || !fecha || turnos.length === 0) {
      setError("Completá tu nombre, posición, categoría, la fecha y al menos un turno.")
      return
    }
    setError("")
    setEnviando(true)
    const payload = {
      nombre,
      posicion,
      categoria,
      turnos: turnos.join(", "),
      fechaJugar: fecha ? fecha.split("-").reverse().join("/") : "",
    }
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      })
    } catch (e) {
      // si fallara, el respaldo de WhatsApp queda disponible abajo
    }
    setEnviando(false)
    setSent(true)
  }

  const resetForm = () => {
    setNombre(""); setPosicion(""); setCategoria(""); setFecha(""); setTurnos([]); setSent(false)
  }

  const waBackup = () => {
    const msg =
      `Hola! Quiero anotarme a un partido de pelota paleta.\n` +
      `Nombre: ${nombre}\nPosicion: ${posicion}\nCategoria: ${categoria}\n` +
      `Fecha: ${fecha ? fecha.split("-").reverse().join("/") : "-"}\nTurnos: ${turnos.join(", ")}`
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const chip = (active: boolean) => ({
    fontFamily: inter, fontSize: 14, fontWeight: 500, cursor: "pointer",
    padding: "11px 18px", borderRadius: 9, transition: "all 0.18s",
    border: `1.5px solid ${active ? C.amarillo : C.cardBorde}`,
    background: active ? C.amarillo : "transparent",
    color: active ? C.negro : C.gris,
  } as React.CSSProperties)

  return (
    <section id="paleta" style={{ padding: isMobile ? "72px 20px" : "110px 40px", background: "#111" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <SectionTitle eyebrow="Cancha de Trinquete" title="Armá tu partido"
          sub="Anotate con tu posición, categoría y los turnos en los que podés jugar. Dani coordina el partido y te avisa." />

        <div style={{ background: C.card, border: `1px solid ${C.cardBorde}`, borderRadius: 16, padding: isMobile ? 22 : 36 }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: isMobile ? "20px 4px" : "30px 10px" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,211,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <CheckCircle2 size={34} color={C.amarillo} />
              </div>
              <h3 style={{ fontFamily: oswald, fontSize: 26, fontWeight: 700, textTransform: "uppercase", color: C.blanco, marginBottom: 12 }}>¡Quedaste anotado!</h3>
              <p style={{ fontFamily: inter, fontSize: 15, color: C.gris, lineHeight: 1.7, maxWidth: 420, margin: "0 auto 26px" }}>
                Tu disponibilidad se registró correctamente. Dani te va a contactar para coordinar el partido.
              </p>
              <button onClick={resetForm} style={{ fontFamily: oswald, fontSize: 14, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, cursor: "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "12px 28px", borderRadius: 8 }}>Anotar otro jugador</button>
            </div>
          ) : (
          <>
          {/* Nombre */}
          <label style={{ display: "block", fontFamily: oswald, fontSize: 15, letterSpacing: "0.05em", textTransform: "uppercase", color: C.blanco, marginBottom: 10 }}>Tu nombre</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Juan Pérez"
            style={{ width: "100%", boxSizing: "border-box", fontFamily: inter, fontSize: 15, color: C.blanco, background: "#0d0d0d", border: `1.5px solid ${C.cardBorde}`, borderRadius: 9, padding: "13px 16px", outline: "none", marginBottom: 26 }} />

          {/* Posición */}
          <label style={{ display: "block", fontFamily: oswald, fontSize: 15, letterSpacing: "0.05em", textTransform: "uppercase", color: C.blanco, marginBottom: 10 }}>Posición</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap" }}>
            {POSICIONES.map(p => (
              <button key={p} onClick={() => setPosicion(p)} style={{ ...chip(posicion === p), flex: isMobile ? "1 1 100%" : 1 }}>{p}</button>
            ))}
          </div>

          {/* Categoría */}
          <label style={{ display: "block", fontFamily: oswald, fontSize: 15, letterSpacing: "0.05em", textTransform: "uppercase", color: C.blanco, marginBottom: 10 }}>Categoría</label>
          <div style={{ display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap" }}>
            {CATEGORIAS.map(c => (
              <button key={c} onClick={() => setCategoria(c)} style={{ ...chip(categoria === c), flex: isMobile ? "1 1 calc(50% - 5px)" : 1 }}>{c}</button>
            ))}
          </div>

          {/* Fecha específica */}
          <label style={{ display: "block", fontFamily: oswald, fontSize: 15, letterSpacing: "0.05em", textTransform: "uppercase", color: C.blanco, marginBottom: 4 }}>Fecha que querés jugar</label>
          <p style={{ fontFamily: inter, fontSize: 12, color: C.grisTenue, marginBottom: 12 }}>Elegí el día puntual (ej: el martes que viene).</p>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            min={(() => { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth()+1).padStart(2,"0")}-${String(h.getDate()).padStart(2,"0")}` })()}
            style={{ width: "100%", boxSizing: "border-box", fontFamily: inter, fontSize: 15, color: C.blanco, background: "#0d0d0d", border: `1.5px solid ${C.cardBorde}`, borderRadius: 9, padding: "13px 16px", outline: "none", marginBottom: 26, colorScheme: "dark" }} />

          {/* Turnos */}
          <label style={{ display: "block", fontFamily: oswald, fontSize: 15, letterSpacing: "0.05em", textTransform: "uppercase", color: C.blanco, marginBottom: 4 }}>Turnos disponibles</label>
          <p style={{ fontFamily: inter, fontSize: 12, color: C.grisTenue, marginBottom: 12 }}>Elegí los que te sirvan.</p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 8, marginBottom: 28 }}>
            {TURNOS.map(t => (
              <button key={t} onClick={() => toggle(turnos, setTurnos, t)}
                style={{ ...chip(turnos.includes(t)), padding: "13px 8px", fontSize: 14, textAlign: "center", fontFamily: oswald, fontWeight: 600, whiteSpace: "nowrap" }}>
                {t}
              </button>
            ))}
          </div>

          {error && <p style={{ fontFamily: inter, fontSize: 13, color: "#ff6b6b", marginBottom: 16, textAlign: "center" }}>{error}</p>}

          <button onClick={enviar} disabled={enviando} style={{
            width: "100%", fontFamily: oswald, fontSize: 17, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
            cursor: enviando ? "default" : "pointer", color: C.negro, background: C.amarillo, border: "none", padding: "16px", borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 28px rgba(255,211,0,0.25)", opacity: enviando ? 0.7 : 1,
          }}>
            <Send size={18} /> {enviando ? "Enviando..." : "Anotarme"}
          </button>
          <p style={{ fontFamily: inter, fontSize: 12, color: C.grisTenue, textAlign: "center", marginTop: 14 }}>
            ¿Algún problema? <span onClick={waBackup} style={{ color: C.amarillo, cursor: "pointer", textDecoration: "underline" }}>Anotate por WhatsApp</span>
          </p>
          </>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── Galería ── */
const fotos = ["/gym1.jpg", "/gym2.jpg", "/gym3.jpg", "/gym4.jpg"]

function GaleriaSection() {
  const isMobile = useIsMobile()
  return (
    <section id="galeria" style={{ padding: isMobile ? "72px 20px" : "110px 40px", background: C.negro }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionTitle eyebrow="El lugar" title="Conocé el gimnasio" sub="Vení a entrenar, estamos abiertos en estos horarios:" />

        {/* Horarios en texto */}
        <div style={{ textAlign: "center", maxWidth: 640, margin: "-26px auto 44px" }}>
          <p style={{ fontFamily: inter, fontSize: isMobile ? 14 : 15.5, color: C.gris, lineHeight: 1.9, marginBottom: 8 }}>
            🏋️ <strong style={{ color: C.blanco }}>Musculación:</strong> Lunes a Viernes 8:00AM-11:00AM. Luego se vuelve a abrir 15:00PM-21:30PM. Sábados 8:00AM-11:00AM. Domingos cerrado.
          </p>
          <p style={{ fontFamily: inter, fontSize: isMobile ? 14 : 15.5, color: C.gris, lineHeight: 1.9 }}>
            🚴 <strong style={{ color: C.blanco }}>Spinning:</strong> Consultá los horarios.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
          {fotos.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ aspectRatio: "3/4", overflow: "hidden", borderRadius: 10, border: `1px solid ${C.cardBorde}` }}>
              <img src={f} alt={`Gimnasio ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Footer / Contacto ── */
function Footer() {
  const isMobile = useIsMobile()
  return (
    <footer id="contacto" style={{ background: "#080808", borderTop: `2px solid ${C.amarillo}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "56px 20px 40px" : "72px 40px 44px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr 1fr", gap: isMobile ? 36 : 50, marginBottom: 44 }}>
          <div>
            <h3 style={{ fontFamily: oswald, fontSize: 26, fontWeight: 700, textTransform: "uppercase", color: C.blanco, marginBottom: 4 }}>
              Trinquete <span style={{ color: C.amarillo }}>Maldonado</span>
            </h3>
            <p style={{ fontFamily: inter, fontSize: 14, color: C.gris, lineHeight: 1.7, maxWidth: 320, marginTop: 12 }}>
              Gimnasio de barrio con cancha de pelota paleta, musculación y spinning. Vení a entrenar y a jugar.
            </p>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
              <Clock size={15} color={C.amarillo} />
              <p style={{ fontFamily: oswald, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: C.amarillo, fontWeight: 600 }}>Horarios</p>
            </div>
            {[
              { dia: "Lunes a Viernes", hs: "8:00 – 11:00 · 15:00 – 21:30" },
              { dia: "Sábados", hs: "8:00 – 11:00" },
              { dia: "Domingos", hs: "Cerrado" },
            ].map(({ dia, hs }) => (
              <div key={dia} style={{ marginBottom: 12 }}>
                <p style={{ fontFamily: inter, fontSize: 11, color: C.grisTenue, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>{dia}</p>
                <p style={{ fontFamily: oswald, fontSize: 17, fontWeight: 600, color: hs === "Cerrado" ? C.grisTenue : C.blanco }}>{hs}</p>
              </div>
            ))}
          </div>

          <div>
            <p style={{ fontFamily: oswald, fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: C.amarillo, fontWeight: 600, marginBottom: 18 }}>Contacto</p>
            {[
              { icon: Phone, text: "+54 9 11 4162-6719", href: `https://wa.me/${WA}` },
              { icon: MapPin, text: "Barrio Maldonado", href: "#" },
              { icon: AtSign, text: "@trinquetemaldonado", href: "https://instagram.com/trinquetemaldonado" },
            ].map(({ icon: Icon, text, href }) => (
              <a key={text} href={href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                <Icon size={15} color={C.amarillo} />
                <span style={{ fontFamily: inter, fontSize: 14, color: C.gris }}>{text}</span>
              </a>
            ))}
          </div>
        </div>

        <div style={{ paddingTop: 24, borderTop: `1px solid ${C.cardBorde}`, display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", gap: 10 }}>
          <p style={{ fontFamily: inter, fontSize: 12, color: C.grisTenue }}>© 2026 Trinquete Maldonado. Todos los derechos reservados.</p>
          <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Hola! Quería consultar por el gimnasio.")}`} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily: oswald, fontSize: 13, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600, color: C.negro, background: C.amarillo, padding: "9px 20px", borderRadius: 7 }}>
            Escribinos por WhatsApp
          </a>
        </div>
      </div>
    </footer>
  )
}

/* ── Main ── */
export default function TrinqueteLanding() {
  return (
    <main style={{ background: C.negro, minHeight: "100vh" }}>
      <Navbar />
      <HeroGeometric
        onPrimary={() => scrollTo("paleta")}
        onSecondary={() => window.open(`https://wa.me/${WA}?text=${encodeURIComponent("Hola! Quiero anotarme al gimnasio. Me pueden pasar info?")}`, "_blank")}
        onTertiary={() => scrollTo("servicios")}
      />
      <ServiciosSection />
      <PaletaSection />
      <GaleriaSection />
      <Footer />
    </main>
  )
}

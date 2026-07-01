"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

const YELLOW = "#FFD300"
const oswald = "'Oswald', sans-serif"
const inter = "'Inter', sans-serif"

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const ck = () => setM(window.innerWidth < 900)
    ck(); window.addEventListener("resize", ck)
    return () => window.removeEventListener("resize", ck)
  }, [])
  return m
}

interface HeroProps {
  onPrimary?: () => void
  onSecondary?: () => void
  onTertiary?: () => void
}

export function HeroGeometric({ onPrimary, onSecondary, onTertiary }: HeroProps) {
  const isMobile = useIsMobile()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = true
    const attempt = () => vid.play().catch(() => {})
    attempt()
    document.addEventListener("touchstart", attempt, { once: true })
    document.addEventListener("click", attempt, { once: true })
    return () => {
      document.removeEventListener("touchstart", attempt)
      document.removeEventListener("click", attempt)
    }
  }, [isMobile])

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.9, delay: 0.25 + i * 0.15, ease: [0.25, 0.4, 0.25, 1] as const },
    }),
  }

  return (
    <div style={{
      position: "relative",
      minHeight: isMobile ? "95vh" : "100vh", height: isMobile ? "auto" : "100vh",
      width: "100%", overflow: "hidden",
      background: "#0d0d0d", display: "flex", alignItems: isMobile ? "flex-start" : "center",
    }}>
      {/* ── FONDO: video en celular, imagen en PC ── */}
      {isMobile ? (
        <video
          ref={videoRef}
          autoPlay muted loop playsInline preload="auto"
          poster="/hero.png"
          {...{ "webkit-playsinline": "true" } as any}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
            transform: "scale(1.24)", transformOrigin: "left top",
            filter: "grayscale(1) contrast(1.08) brightness(0.95)",
          }}
        >
          <source src="/hero-mobile.mp4" type="video/mp4" />
        </video>
      ) : (
        <img src="/hero.png" alt="Cancha de pelota paleta — Trinquete Maldonado"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center",
          }} />
      )}

      {/* oscurecido para legibilidad del texto */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: isMobile
          ? "linear-gradient(180deg, rgba(13,13,13,0.1) 0%, rgba(13,13,13,0.1) 50%, rgba(13,13,13,0.4) 100%)"
          : "linear-gradient(90deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.4) 30%, transparent 60%)",
      }} />

      {/* Panel negro angular a la izquierda (marco tipo deportivo, solo PC) */}
      {!isMobile && (
        <>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "46%", zIndex: 1, pointerEvents: "none",
            background: "rgba(10,10,10,0.6)", clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)" }} />
          {/* borde angular oscuro a la derecha */}
          <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: "16%", zIndex: 1, pointerEvents: "none",
            background: "rgba(10,10,10,0.55)", clipPath: "polygon(28% 0, 100% 0, 100% 100%, 0 100%)" }} />
        </>
      )}

      {/* ── Acentos amarillos, estilo deportivo ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", overflow: "hidden" }}>
        {/* Franjas diagonales arriba a la derecha (bold) */}
        <div style={{ position: "absolute", top: -80, right: -40, width: 620, height: 420, overflow: "hidden" }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ position: "absolute", top: -30 + i * 30, right: -60, width: 760, height: [20, 10, 16, 8, 13][i],
              background: YELLOW, opacity: [1, 0.55, 0.85, 0.4, 0.7][i], transform: "rotate(-42deg)", transformOrigin: "right center" }} />
          ))}
        </div>
        {/* Franjas amarillas junto a la diagonal del panel izquierdo (solo PC) */}
        {!isMobile && (
          <>
            <div style={{ position: "absolute", top: "-8%", left: "43%", width: 13, height: "125%", background: YELLOW, opacity: 0.9, transform: "rotate(13deg)", transformOrigin: "top center" }} />
            <div style={{ position: "absolute", top: "-8%", left: "46.5%", width: 6, height: "125%", background: YELLOW, opacity: 0.5, transform: "rotate(13deg)", transformOrigin: "top center" }} />
          </>
        )}
        {/* Franjas diagonales abajo a la derecha */}
        <div style={{ position: "absolute", bottom: -60, right: "8%", width: 300, height: 240, overflow: "hidden" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ position: "absolute", bottom: i * 26, right: -40, width: 400, height: [14, 9, 7][i],
              background: YELLOW, opacity: [0.7, 0.4, 0.25][i], transform: "rotate(-42deg)", transformOrigin: "right center" }} />
          ))}
        </div>
        {/* Estrellas sparkle */}
        <svg width={isMobile ? 24 : 34} height={isMobile ? 24 : 34} viewBox="0 0 24 24" fill={YELLOW} style={{ position: "absolute", right: "11%", top: "24%", opacity: 0.9 }}><path d="M12 0c1 8 3 11 12 12-9 1-11 4-12 12-1-8-3-11-12-12 9-1 11-4 12-12z" /></svg>
        <svg width={isMobile ? 15 : 20} height={isMobile ? 15 : 20} viewBox="0 0 24 24" fill={YELLOW} style={{ position: "absolute", right: "5%", top: "15%", opacity: 0.6 }}><path d="M12 0c1 8 3 11 12 12-9 1-11 4-12 12-1-8-3-11-12-12 9-1 11-4 12-12z" /></svg>
      </div>

      {/* Logo del Trinquete (tal cual, separado de los bordes) */}
      <img src="/logo.png" alt="Trinquete Maldonado" style={{
        position: "absolute", bottom: isMobile ? 16 : 22, right: isMobile ? 16 : 22, zIndex: 4, pointerEvents: "none",
        height: isMobile ? 92 : 110, width: "auto", display: "block",
      }} />

      {/* ── CONTENIDO (texto bien a la izquierda) ── */}
      <div style={{
        position: "relative", zIndex: 10, width: "100%",
        padding: isMobile ? "96px 24px 64px" : "0 0 0 72px",
      }}>
        <motion.div
          initial={{ opacity: 0, x: isMobile ? 0 : -30, y: isMobile ? 20 : 0 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ maxWidth: isMobile ? "100%" : 520, textAlign: isMobile ? "center" : "left" }}>
          <motion.h1 custom={0} variants={fadeUp} initial="hidden" animate="visible"
            style={{
              fontFamily: "'Anton', sans-serif", fontWeight: 400, color: "#fff",
              fontSize: isMobile ? "clamp(56px, 16vw, 74px)" : "clamp(46px, 7vw, 84px)", lineHeight: 1.0,
              textTransform: "uppercase", letterSpacing: "0.01em", marginBottom: 22,
              textShadow: "0 2px 14px rgba(0,0,0,0.45)",
            }}>
            Trinquete<br /><span style={{ color: YELLOW }}>Maldonado</span>
          </motion.h1>

          <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible"
            style={{
              fontFamily: inter, fontSize: "clamp(13px, 1.6vw, 16px)",
              color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em",
              lineHeight: 1.7, marginBottom: 18, maxWidth: 430,
              marginLeft: isMobile ? "auto" : 0, marginRight: isMobile ? "auto" : 0,
              textShadow: "0 2px 10px rgba(0,0,0,0.8)",
            }}>
            Gimnasio de buen ambiente para entrenar a tu ritmo. Equipamiento completo y profes que te acompañan en cada paso.
          </motion.p>

          <motion.p custom={1} variants={fadeUp} initial="hidden" animate="visible"
            style={{
              fontFamily: inter, fontSize: "clamp(13px, 1.5vw, 15px)",
              color: YELLOW, letterSpacing: "0.06em", fontWeight: 600,
              textTransform: "uppercase", marginBottom: 34,
              textShadow: "0 2px 8px rgba(0,0,0,0.9)",
            }}>
            📍 Elustondo 1242
          </motion.p>

          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
            style={{ display: "flex", gap: 12, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center" }}>
            <button onClick={onPrimary} style={{
              fontFamily: oswald, fontSize: isMobile ? 14 : 15, letterSpacing: "0.06em", textTransform: "uppercase",
              fontWeight: 700, cursor: "pointer", color: "#0A0A0A", background: YELLOW, border: "none",
              padding: "15px 28px", borderRadius: 6, boxShadow: "0 8px 28px rgba(255,211,0,0.35)",
              width: isMobile ? "100%" : "auto",
            }}>Arma tu partido de pelota-paleta</button>
            <button onClick={onSecondary} style={{
              fontFamily: oswald, fontSize: isMobile ? 14 : 15, letterSpacing: "0.06em", textTransform: "uppercase",
              fontWeight: 700, cursor: "pointer", color: "#fff", background: "rgba(0,0,0,0.45)",
              border: "2px solid rgba(255,255,255,0.5)", padding: "15px 28px", borderRadius: 6,
              width: isMobile ? "100%" : "auto",
            }}>Anotate al gimnasio</button>
            <button onClick={onTertiary} style={{
              fontFamily: oswald, fontSize: isMobile ? 14 : 15, letterSpacing: "0.06em", textTransform: "uppercase",
              fontWeight: 700, cursor: "pointer", color: "#fff", background: "rgba(0,0,0,0.45)",
              border: "2px solid rgba(255,255,255,0.5)", padding: "15px 28px", borderRadius: 6,
              width: isMobile ? "100%" : "auto",
            }}>Ver servicios</button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default HeroGeometric

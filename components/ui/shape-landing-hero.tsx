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
      minHeight: isMobile ? "90vh" : "100vh", height: isMobile ? "auto" : "100vh",
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

      {/* oscurecido para legibilidad (más fuerte en mobile) */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
        background: isMobile
          ? "linear-gradient(180deg, rgba(13,13,13,0.1) 0%, rgba(13,13,13,0.1) 50%, rgba(13,13,13,0.4) 100%)"
          : "none",
      }} />

      {/* Logo del Trinquete: tapa la marca de agua de Gemini (esquina inf. derecha) */}
      <div style={{
        position: "absolute", bottom: 12, right: 12, zIndex: 4, pointerEvents: "none",
        background: "#fff", borderRadius: 8, padding: "6px 10px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
      }}>
        <img src="/logo.png" alt="Trinquete Maldonado" style={{ height: isMobile ? 42 : 48, width: "auto", display: "block" }} />
      </div>

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
            }}>Sumate a un partido de pelota-paleta</button>
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

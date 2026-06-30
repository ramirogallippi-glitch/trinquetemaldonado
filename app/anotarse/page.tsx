"use client"

import dynamic from "next/dynamic"
import Link from "next/link"

const PaletaForm = dynamic(
  () => import("../../components/ui/trinquete-landing").then(m => m.PaletaSection),
  { ssr: false }
)

const C = { amarillo: "#FFD300", negro: "#0A0A0A" }
const oswald = "'Oswald', sans-serif"

export default function AnotarsePage() {
  return (
    <main style={{ background: C.negro, minHeight: "100vh", color: "#fff" }}>
      {/* Navbar simple con volver */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50, background: "#fff", borderBottom: `3px solid ${C.amarillo}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 60,
      }}>
        <Link href="/" style={{ fontFamily: oswald, fontWeight: 700, fontSize: 16, textTransform: "uppercase", color: C.negro, textDecoration: "none" }}>
          ← Volver al inicio
        </Link>
        <span style={{ fontFamily: oswald, fontSize: 16, fontWeight: 700, textTransform: "uppercase", color: C.negro }}>
          Anotarme
        </span>
      </nav>

      <PaletaForm />
    </main>
  )
}

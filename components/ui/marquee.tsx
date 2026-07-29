"use client"

import React from "react"

interface MarqueeProps {
  children: React.ReactNode
  duration?: number
  pauseOnHover?: boolean
  direction?: "left" | "right"
  fade?: boolean
  fadeAmount?: number
  style?: React.CSSProperties
}

// Marquee (banda deslizante) hecho con estilos inline — no depende de Tailwind.
export function Marquee({
  children,
  duration = 22,
  pauseOnHover = false,
  direction = "left",
  fade = true,
  fadeAmount = 8,
  style,
}: MarqueeProps) {
  const [paused, setPaused] = React.useState(false)
  const items = React.Children.toArray(children)

  const mask = fade
    ? `linear-gradient(to right, transparent 0%, #000 ${fadeAmount}%, #000 ${100 - fadeAmount}%, transparent 100%)`
    : undefined

  const anim = direction === "left" ? "tm-scroll" : "tm-scroll-rev"

  return (
    <>
      <style>{`
        @keyframes tm-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes tm-scroll-rev { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>
      <div
        onMouseEnter={() => pauseOnHover && setPaused(true)}
        onMouseLeave={() => pauseOnHover && setPaused(false)}
        style={{ display: "flex", width: "100%", overflow: "hidden", maskImage: mask, WebkitMaskImage: mask, ...style }}
      >
        <div style={{ display: "flex", flexShrink: 0, animation: `${anim} ${duration}s linear infinite`, animationPlayState: paused ? "paused" : "running" }}>
          {items.map((item, i) => (
            <div key={`a-${i}`} style={{ display: "flex", flexShrink: 0 }}>{item}</div>
          ))}
          {items.map((item, i) => (
            <div key={`b-${i}`} style={{ display: "flex", flexShrink: 0 }}>{item}</div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Marquee

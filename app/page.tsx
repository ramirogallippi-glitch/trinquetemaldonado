"use client"

import dynamic from "next/dynamic"

const TrinqueteLanding = dynamic(() => import("../components/ui/trinquete-landing"), { ssr: false })

export default function Home() {
  return <TrinqueteLanding />
}

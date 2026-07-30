import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://trinquetemaldonado-8zrr.vercel.app"),
  title: "Trinquete Maldonado — Gimnasio · Pelota Paleta · Spinning",
  description:
    "Gimnasio de barrio con cancha profesional de pelota paleta, sala de musculación y spinning. Anotate a jugar y armá tu partido.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://trinquetemaldonado-8zrr.vercel.app",
    siteName: "Trinquete Maldonado",
    title: "Trinquete Maldonado — Pelota Paleta, Musculación y Spinning",
    description:
      "Cancha profesional de pelota paleta, musculación y spinning. Anotate a jugar y armá tu partido.",
    images: [{ url: "/gym1.jpg", alt: "Trinquete Maldonado" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trinquete Maldonado — Pelota Paleta, Musculación y Spinning",
    description:
      "Cancha profesional de pelota paleta, musculación y spinning. Anotate a jugar y armá tu partido.",
    images: ["/gym1.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

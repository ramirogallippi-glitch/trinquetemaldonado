# Trinquete Maldonado — Web del gimnasio

Sitio del gimnasio **Trinquete Maldonado** (pelota paleta, musculación, spinning).
Hecho con **Next.js 16 + React 19 + TypeScript**. Estilos **inline** (no usa Tailwind).
Gestor de paquetes: **pnpm**.

## Cómo correrlo
- Instalar dependencias: `pnpm install`
- Levantar en desarrollo: `pnpm dev` → http://localhost:3000
- Si `pnpm dev` falla por una verificación interna de pnpm, correr Next directo:
  `node node_modules/next/dist/bin/next dev`

## Páginas / estructura
- `app/page.tsx` → carga la landing (`components/ui/trinquete-landing.tsx`)
- `components/ui/trinquete-landing.tsx` → landing: hero, servicios, sección **"Armado de paleta"**
  (elige entre Desafío 2v2 o Anotarse individual), galería y footer
- `components/ui/shape-landing-hero.tsx` → hero (video en mobile / imagen en desktop + botones)
- `app/anotarse/page.tsx` → formulario para **anotarse individualmente** a un partido de paleta
- `app/desafios/page.tsx` → **Muro de Desafíos** 2 vs 2 (una dupla publica, otra acepta)
- `app/panel/page.tsx` → **Panel de Dani**: agrupa los anotados individuales por
  fecha / turno / categoría para armar partidos; al enviar por WhatsApp borra a esos jugadores

## Datos (Google Sheets vía Apps Script)
- **Anotados individuales** → planilla individual (constante `SHEET_URL`).
  El Panel los lee con `doGet` y los borra al armar un partido (acción `quitar` en el Apps Script).
- **Desafíos 2v2** → planilla aparte (constante `DESAFIOS_URL` en `app/desafios/page.tsx`).
- Los anotados con fecha vencida se borran solos con la función `limpiarVencidos`
  del Apps Script (tiene un disparador/trigger diario).

## Claves de acceso
- Panel de Dani y Muro de Desafíos: `trinquete2026`

## Trabajo entre máquinas (PC y notebook)
Este proyecto se edita desde dos computadoras. Para no desincronizar:
- **Antes de empezar:** `git pull`
- **Al terminar:** `git add .` → `git commit -m "..."` → `git push`

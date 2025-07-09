import { NextResponse } from "next/server"

export async function GET() {
  const manifest = {
    name: "Vaquitapp - Divide gastos entre amigos",
    short_name: "Vaquitapp",
    description:
      "Vaquitapp 🐮 te ayuda a dividir los gastos entre amigos de forma simple, informal y rápida. Ideal para juntadas, viajes y todo lo que implique compartir gastos.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22c55e",
    orientation: "portrait",
    scope: "/",
    lang: "es",
    dir: "ltr",
    categories: ["finance", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    id: "/",
    prefer_related_applications: false,
    related_applications: [],
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}

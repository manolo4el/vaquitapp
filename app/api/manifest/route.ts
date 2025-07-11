import { NextResponse } from "next/server"

export async function GET() {
  const manifest = {
    name: "Vaquitapp - Gastos entre amigos",
    short_name: "Vaquitapp",
    description: "Organiza y divide gastos entre amigos de forma fácil y rápida",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#22c55e",
    orientation: "portrait-primary",
    scope: "/",
    lang: "es",
    dir: "ltr",
    categories: ["finance", "productivity", "social"],
    iarc_rating_id: "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",
    prefer_related_applications: false,
    related_applications: [],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
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
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/mobile-1.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Dashboard principal",
      },
      {
        src: "/screenshots/mobile-2.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Agregar gasto",
      },
      {
        src: "/screenshots/desktop-1.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Vista de escritorio",
      },
    ],
    shortcuts: [
      {
        name: "Agregar Gasto",
        short_name: "Nuevo Gasto",
        description: "Agregar un nuevo gasto rápidamente",
        url: "/add-expense",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
      {
        name: "Mis Grupos",
        short_name: "Grupos",
        description: "Ver todos mis grupos de gastos",
        url: "/groups",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
          },
        ],
      },
    ],
    launch_handler: {
      client_mode: "navigate-existing",
    },
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}

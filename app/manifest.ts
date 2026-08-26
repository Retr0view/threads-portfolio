import { siteConfig } from "@/lib/site-config"
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteConfig.name} - Portfolio`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#1c1917",
    orientation: "portrait-primary",
    categories: ["portfolio", "design", "business"],
    lang: siteConfig.language,
    dir: "ltr",
    icons: [
      {
        src: "/og-assets/favicon 32.jpg",
        sizes: "32x32",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/og-assets/favicon 64.jpg",
        sizes: "64x64",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/og-assets/favicon 128.jpg",
        sizes: "128x128",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  }
}

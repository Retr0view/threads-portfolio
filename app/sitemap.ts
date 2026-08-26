import contentRevision from "@/lib/last-commit-date.json"
import { siteConfig } from "@/lib/site-config"
import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteConfig.url,
      lastModified: contentRevision.date,
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}



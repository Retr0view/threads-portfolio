import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const baseUrl = process.env.METADATA_BASE_URL ?? "http://127.0.0.1:3000"
const canonicalUrl = "https://riantouag.com"
const description = "Senior product designer who designs in code with founders and startups, from early ideas through launch, with an engineer's eye and a focus on craft."
const oldDescription = [
  "Senior product designer with an engineer's eye.",
  "Making things that work the way people expect them to.",
].join(" ")

function decodeHtml(value) {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([^\s=<>]+)="([^"]*)"/g)].map(([, name, value]) => [
      name,
      decodeHtml(value),
    ]),
  )
}

function findTag(document, tagName, attribute, value) {
  for (const match of document.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))) {
    const parsed = attributes(match[0])
    if (parsed[attribute] === value) {
      return parsed
    }
  }

  assert.fail(`Missing <${tagName}> with ${attribute}="${value}"`)
}

async function fetchText(path) {
  const response = await fetch(new URL(path, baseUrl))
  assert.equal(response.status, 200, `${path} returned ${response.status}`)
  return response.text()
}

test("metadata routes share the canonical public identity", async () => {
  const [html, manifestText, robotsText, sitemapText, revisionText] = await Promise.all([
    fetchText("/"),
    fetchText("/manifest.webmanifest"),
    fetchText("/robots.txt"),
    fetchText("/sitemap.xml"),
    readFile(new URL("../lib/last-commit-date.json", import.meta.url), "utf8"),
  ])

  assert.equal(findTag(html, "link", "rel", "canonical").href, canonicalUrl)
  assert.equal(findTag(html, "meta", "name", "description").content, description)
  assert.equal(findTag(html, "meta", "property", "og:url").content, canonicalUrl)
  assert.equal(findTag(html, "meta", "property", "og:title").content, "Rian Touag - Senior Product Designer")
  assert.equal(findTag(html, "meta", "property", "og:description").content, description)
  assert.equal(findTag(html, "meta", "name", "twitter:title").content, "Rian Touag - Senior Product Designer")
  assert.equal(findTag(html, "meta", "name", "twitter:description").content, description)

  const jsonLdMatch = html.match(
    /<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i,
  )
  assert.ok(jsonLdMatch, "Missing JSON-LD graph")
  const jsonLd = JSON.parse(decodeHtml(jsonLdMatch[1]))
  assert.equal(jsonLd["@context"], "https://schema.org")
  assert.ok(jsonLd["@graph"].length >= 4)
  for (const node of jsonLd["@graph"].filter((entry) => entry.description)) {
    assert.equal(node.description, description)
  }
  assert.ok(jsonLd["@graph"].every((entry) => entry.url === undefined || entry.url === canonicalUrl))

  const manifest = JSON.parse(manifestText)
  assert.equal(manifest.name, "Rian Touag - Portfolio")
  assert.equal(manifest.short_name, "Rian Touag")
  assert.equal(manifest.description, description)
  assert.equal(manifest.start_url, "/")

  assert.match(robotsText, /^User-Agent: \*$/m)
  assert.match(robotsText, /^Allow: \/$/m)
  assert.match(robotsText, /^Sitemap: https:\/\/riantouag\.com\/sitemap\.xml$/m)

  const revision = JSON.parse(revisionText).date
  assert.match(sitemapText, /<loc>https:\/\/riantouag\.com<\/loc>/)
  assert.match(sitemapText, new RegExp(`<lastmod>${revision}<\\/lastmod>`))
  assert.equal(await fetchText("/sitemap.xml"), sitemapText)

  const publicOutput = [html, manifestText, robotsText, sitemapText].join("\n")
  assert.doesNotMatch(publicOutput, new RegExp(oldDescription.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
  assert.doesNotMatch(publicOutput, /yourdomain\.com/)
})

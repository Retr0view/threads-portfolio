import { expect, test, type CDPSession, type Page } from "@playwright/test"

const measuredLcpGroupId = "neutron-rebrand"
const lowerWorkGroupIds = ["neutron-ui", "structured", "highlight"]

function isPortfolioImageUrl(requestUrl: string) {
  const url = new URL(requestUrl)
  return url.pathname === "/_next/image" && url.searchParams.get("url")?.startsWith("/images/")
}

async function getPortfolioPreloads(page: Page) {
  return page.locator('link[rel="preload"][as="image"]').evaluateAll((links) =>
    links
      .map((element) => {
        const link = element as HTMLLinkElement
        return {
          fetchPriority: link.fetchPriority,
          imageSrcset: decodeURIComponent(link.imageSrcset),
        }
      })
      .filter(({ imageSrcset }) => imageSrcset.includes("url=/images/"))
  )
}

for (const viewport of [
  { height: 844, name: "mobile", width: 390 },
  { height: 900, name: "desktop", width: 1440 },
]) {
  test(`only the measured portfolio LCP image is preloaded at ${viewport.name} width`, async ({
    browserName,
    page,
  }) => {
    await page.setViewportSize({ height: viewport.height, width: viewport.width })

    const portfolioRequests: Array<{ priority: string; url: string }> = []
    let client: CDPSession | null = null
    if (browserName === "chromium") {
      client = await page.context().newCDPSession(page)
      await client.send("Network.enable")
      await client.send("Network.setCacheDisabled", { cacheDisabled: true })
      client.on("Network.requestWillBeSent", (event) => {
        const requestEvent = event as {
          request: { initialPriority: string; url: string }
          type: string
        }
        if (requestEvent.type === "Image" && isPortfolioImageUrl(requestEvent.request.url)) {
          portfolioRequests.push({
            priority: requestEvent.request.initialPriority,
            url: requestEvent.request.url,
          })
        }
      })
    }

    const imageWarnings: string[] = []
    page.on("console", (message) => {
      if (message.type() === "warning" && /deprecated|priority/i.test(message.text())) {
        imageWarnings.push(message.text())
      }
    })

    await page.goto("/")
    await page.waitForLoadState("networkidle")

    const portfolioPreloads = await getPortfolioPreloads(page)
    expect(portfolioPreloads).toHaveLength(1)
    expect(portfolioPreloads[0]).toEqual(
      expect.objectContaining({
        fetchPriority: "high",
        imageSrcset: expect.stringContaining("/images/Neutron Rebrand/neutron brand 1.jpg"),
      })
    )

    const lcpImage = page.locator(
      `[data-work-group-id="${measuredLcpGroupId}"] [data-carousel-image-index="0"] img`
    )
    await expect(lcpImage).toHaveAttribute("fetchpriority", "high")
    await expect(lcpImage).not.toHaveAttribute("loading", "lazy")

    const selectedGroupLazyImages = page.locator(
      `[data-work-group-id="${measuredLcpGroupId}"] [data-carousel-image-index]:not([data-carousel-image-index="0"]) img`
    )
    await expect(selectedGroupLazyImages).toHaveCount(2)
    for (const image of await selectedGroupLazyImages.all()) {
      await expect(image).toHaveAttribute("loading", "lazy")
      await expect(image).not.toHaveAttribute("fetchpriority", "high")
    }

    for (const workGroupId of lowerWorkGroupIds) {
      const firstImage = page.locator(
        `[data-work-group-id="${workGroupId}"] [data-carousel-image-index="0"] img`
      )
      await expect(firstImage).toHaveAttribute("loading", "lazy")
      await expect(firstImage).not.toHaveAttribute("fetchpriority", "high")
    }

    if (client) {
      expect(portfolioRequests.filter(({ priority }) => priority === "High")).toHaveLength(1)
      expect(
        decodeURIComponent(portfolioRequests.find(({ priority }) => priority === "High")!.url)
      ).toContain("url=/images/Neutron Rebrand/neutron brand 1.jpg")
      await client.detach()
    }
    expect(imageWarnings).toEqual([])
  })
}

import { expect, test, type CDPSession, type ConsoleMessage, type Locator, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

let browserErrors: string[]
let analyticsRequests: string[]
let allowExpectedImageFailure: boolean

function captureBrowserErrors(page: Page) {
  browserErrors = []
  analyticsRequests = []
  allowExpectedImageFailure = false
  page.on("console", (message: ConsoleMessage) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  page.on("pageerror", (error) => browserErrors.push(error.message))
  page.on("request", (request) => {
    if (request.url().includes("visitors.now")) analyticsRequests.push(request.url())
  })
}

function isRawGalleryOriginal(requestUrl: string) {
  const { pathname } = new URL(requestUrl)
  const decodedPath = decodeURIComponent(pathname)
  return decodedPath.startsWith("/images/") && /\.jpe?g$/i.test(decodedPath)
}

function getLightboxOptimizerRequest(requestUrl: string) {
  const url = new URL(requestUrl)
  if (url.pathname !== "/_next/image" || url.searchParams.get("q") !== "95") return null
  const source = url.searchParams.get("url")
  const width = url.searchParams.get("w")
  if (!source || !width) return null

  return {
    identity: `${source}|w=${width}|q=95`,
    source,
  }
}

async function waitForBrowserIdle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => resolve(), { timeout: 2000 })
          return
        }

        setTimeout(resolve, 0)
      })
  )
  await page.waitForLoadState("networkidle")
}

async function getTranslateX(locator: Locator) {
  return locator.evaluate((element) => {
    const transform = getComputedStyle(element).transform
    return transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m41
  })
}

async function nextAnimationFrame(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
}

async function dispatchChromiumTouchSwipe(
  client: CDPSession,
  page: Page,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const touchPoint = (x: number, y: number) => ({
    force: 1,
    id: 1,
    radiusX: 1,
    radiusY: 1,
    x,
    y,
  })

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touchPoint(start.x, start.y)],
  })

  for (let step = 1; step <= 8; step += 1) {
    const progress = step / 8
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [touchPoint(start.x + (end.x - start.x) * progress, start.y + (end.y - start.y) * progress)],
    })
    await nextAnimationFrame(page)
  }

  await client.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  })
}

async function dispatchSyntheticTouchMove(
  locator: Locator,
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  return locator.evaluate(
    (element, points) => {
      const dispatch = (type: string, point?: { x: number; y: number }) => {
        const event = new Event(type, { bubbles: true, cancelable: true })
        Object.defineProperty(event, "touches", {
          value: point ? [{ clientX: point.x, clientY: point.y }] : [],
        })
        element.dispatchEvent(event)
        return event.defaultPrevented
      }

      dispatch("touchstart", points.start)
      const defaultPrevented = dispatch("touchmove", points.end)
      dispatch("touchend")
      return defaultPrevented
    },
    { start, end }
  )
}

async function getVisibleCenter(page: Page, locator: Locator) {
  const box = await locator.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()

  const left = Math.max(0, box!.x)
  const right = Math.min(viewport!.width, box!.x + box!.width)
  const top = Math.max(0, box!.y)
  const bottom = Math.min(viewport!.height, box!.y + box!.height)
  expect(right).toBeGreaterThan(left)
  expect(bottom).toBeGreaterThan(top)
  return { x: (left + right) / 2, y: (top + bottom) / 2 }
}

async function dragWithMouse(page: Page, locator: Locator, deltaX: number) {
  const start = await getVisibleCenter(page, locator)

  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  for (let step = 1; step <= 8; step += 1) {
    await page.mouse.move(start.x + deltaX * (step / 8), start.y)
    await nextAnimationFrame(page)
  }
  await page.mouse.up()
}

async function isTrackWithinHorizontalConstraints(locator: Locator) {
  return locator.evaluate((element) => {
    const transform = getComputedStyle(element).transform
    const x = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m41
    const wrapperWidth = element.parentElement?.clientWidth ?? 0
    const maxOffset = Math.max(0, element.scrollWidth - wrapperWidth)
    return x <= 1 && x >= -maxOffset - 1
  })
}

async function getMaxHorizontalOffset(locator: Locator) {
  return locator.evaluate((element) => {
    const wrapperWidth = element.parentElement?.clientWidth ?? 0
    return Math.max(0, element.scrollWidth - wrapperWidth)
  })
}

test.beforeEach(async ({ page }) => {
  captureBrowserErrors(page)
})

test.afterEach(() => {
  const unexpectedErrors = allowExpectedImageFailure
    ? browserErrors.filter((message) => !message.includes("Failed to load resource"))
    : browserErrors
  expect(unexpectedErrors).toEqual([])
  expect(analyticsRequests).toEqual([])
})

test("homepage loads its primary content without browser errors", async ({ page }) => {
  await page.goto("/")

  await expect(page.locator("main")).toBeVisible()
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeAttached()
  await expect(page.getByText("Neutron Rebrand", { exact: true })).toBeVisible()
})

test("gallery intent makes deduplicated optimizer requests without raw originals", async ({ page }) => {
  const imageRequests: string[] = []
  page.on("request", (request) => {
    if (request.resourceType() === "image") imageRequests.push(request.url())
  })

  await page.goto("/")
  await waitForBrowserIdle(page)
  expect(imageRequests.filter(isRawGalleryOriginal)).toEqual([])

  const threeImageCarousel = page.locator('[data-work-group-id="neutron-rebrand"] [data-carousel-image-index="0"]')
  await threeImageCarousel.hover()
  await page.waitForLoadState("networkidle")
  await threeImageCarousel.click()
  await expect(page.getByTestId("image-lightbox")).toBeVisible()
  await expect(page.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loaded")
  await page.keyboard.press("ArrowRight")
  await expect(page.getByAltText("Neutron Rebrand, image 2 of 3")).toBeVisible()
  await page.keyboard.press("ArrowLeft")
  await expect(page.getByAltText("Neutron Rebrand, image 1 of 3")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByTestId("image-lightbox")).toHaveCount(0)

  const twoImageCarousel = page.locator('[data-work-group-id="highlight"] [data-carousel-image-index="0"]')
  await twoImageCarousel.hover()
  await page.waitForLoadState("networkidle")
  await twoImageCarousel.click()
  await expect(page.getByTestId("image-lightbox")).toBeVisible()
  await expect(page.getByTestId("lightbox-image-frame")).toHaveAttribute("data-image-state", "loaded")
  await page.keyboard.press("ArrowRight")
  await expect(page.getByAltText("Highlight AI, image 2 of 2")).toBeVisible()
  await page.keyboard.press("ArrowLeft")
  await expect(page.getByAltText("Highlight AI, image 1 of 2")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByTestId("image-lightbox")).toHaveCount(0)
  await page.waitForLoadState("networkidle")

  expect(imageRequests.filter(isRawGalleryOriginal)).toEqual([])

  const optimizerRequests = imageRequests
    .map(getLightboxOptimizerRequest)
    .filter((request): request is NonNullable<typeof request> => request !== null)
  const expectedSources = [
    "/images/Neutron Rebrand/neutron brand 1.jpg",
    "/images/Neutron Rebrand/neutron brand 2.jpg",
    "/images/Neutron Rebrand/neutron brand 3.jpg",
    "/images/Highlight/Highlight casestudy 1.jpg",
    "/images/Highlight/Highlight casestudy 2.jpg",
  ]

  expect(new Set(optimizerRequests.map(({ identity }) => identity)).size).toBe(optimizerRequests.length)
  expect(optimizerRequests.map(({ source }) => source).sort()).toEqual(expectedSources.sort())
})

test("reduced motion renders the granular introduction in its completed state", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/")

  const paragraphs = page.getByTestId("intro-biography").locator("p")
  await expect(paragraphs).toHaveCount(3)
  await expect(paragraphs.first()).toHaveText(
    "I design in code, working with founders to turn rough ideas into real products."
  )
  await expect(paragraphs.nth(1)).toHaveText(
    "As a senior product designer with an engineer’s eye, I stay close from the first prototype through launch and whatever comes next."
  )
  await expect(paragraphs.nth(2)).toHaveText(
    "To me, craft lives in the details: every interaction, edge case, and small decision. Get them right, and they add up to an experience that simply feels right."
  )

  const opener = page.getByRole("button", {
    name: "Open image 1 of 3 for Neutron Rebrand",
  })
  await opener.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog", { name: "Image viewer for Neutron Rebrand" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Close image viewer" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(opener).toBeFocused()
})

test("vertical mouse-wheel input over a carousel continues scrolling the page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 })
  await page.goto("/")
  const carousel = page.getByTestId("carousel-track").first()
  await carousel.scrollIntoViewIfNeeded()
  await carousel.hover()
  const startingScroll = await page.evaluate(() => window.scrollY)

  await page.mouse.wheel(0, 400)

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(startingScroll)
})

test("desktop horizontal pointer drag still translates the carousel", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Open image 1 of 3 for Neutron Rebrand" })).toBeVisible()
  const carousel = page.getByTestId("carousel-track").first()
  await carousel.scrollIntoViewIfNeeded()
  const startingX = await getTranslateX(carousel)
  const startingUrl = page.url()

  await dragWithMouse(page, carousel, -180)

  await expect.poll(() => getTranslateX(carousel)).toBeLessThan(startingX)
  expect(page.url()).toBe(startingUrl)
})

test.describe("touch-capable mobile carousel", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 700 },
  })

  test("advertises native vertical panning and keeps the horizontal overscroll hint", async ({ page }) => {
    await page.goto("/")
    const carousel = page.getByTestId("carousel-track").first()

    await expect(carousel).toHaveCSS("touch-action", "pan-y")
    await expect(carousel).toHaveCSS("overscroll-behavior-x", "contain")
  })

  test("native Chromium touch scrolling works from the middle of the carousel", async ({ browserName, page }) => {
    test.skip(browserName !== "chromium", "Playwright exposes compositor touch swipes only through Chromium CDP")
    await page.goto("/")
    const carousel = page.getByTestId("carousel-track").nth(1)
    await carousel.scrollIntoViewIfNeeded()
    const start = await getVisibleCenter(page, carousel)
    const startingScroll = await page.evaluate(() => window.scrollY)
    const client = await page.context().newCDPSession(page)

    await dispatchChromiumTouchSwipe(client, page, start, {
      x: start.x + 4,
      y: Math.max(30, start.y - 220),
    })
    await client.detach()

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(startingScroll)
  })

  test("native Chromium horizontal touch translates the track without app navigation", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "Playwright exposes compositor touch swipes only through Chromium CDP")
    await page.goto("/")
    const carousel = page.locator('[data-work-group-id="neutron-rebrand"] [data-testid="carousel-track"]')
    await carousel.scrollIntoViewIfNeeded()
    const start = await getVisibleCenter(page, carousel)
    const startingX = await getTranslateX(carousel)
    const startingUrl = page.url()
    const client = await page.context().newCDPSession(page)

    await dispatchChromiumTouchSwipe(client, page, start, {
      x: start.x - 140,
      y: start.y + 4,
    })
    await client.detach()

    await expect.poll(() => getTranslateX(carousel)).toBeLessThan(startingX)
    expect(page.url()).toBe(startingUrl)
  })

  test("synthetic touch events characterize vertical, diagonal, and horizontal cancellation", async ({ page }) => {
    await page.goto("/")
    const carousel = page.getByTestId("carousel-track").first()

    expect(await dispatchSyntheticTouchMove(carousel, { x: 180, y: 100 }, { x: 184, y: 140 })).toBe(false)
    expect(await dispatchSyntheticTouchMove(carousel, { x: 180, y: 100 }, { x: 200, y: 140 })).toBe(false)
    expect(await dispatchSyntheticTouchMove(carousel, { x: 180, y: 100 }, { x: 188, y: 102 })).toBe(false)
    expect(await dispatchSyntheticTouchMove(carousel, { x: 180, y: 100 }, { x: 220, y: 104 })).toBe(true)
  })

  test("synthetic touch interception includes the left viewport edge", async ({ page }) => {
    await page.goto("/")
    const carousel = page.getByTestId("carousel-track").first()

    expect(await dispatchSyntheticTouchMove(carousel, { x: 0, y: 100 }, { x: 30, y: 104 })).toBe(true)
  })

  test("a Playwright touchscreen tap does not open the desktop lightbox or move the track", async ({ page }) => {
    await page.goto("/")
    const carousel = page.locator('[data-work-group-id="neutron-rebrand"] [data-testid="carousel-track"]')
    const image = page.locator('[data-work-group-id="neutron-rebrand"] [data-carousel-image-index="0"]')
    const startingX = await getTranslateX(carousel)

    await expect(page.getByRole("button", { name: /Open image .* for Neutron Rebrand/ })).toHaveCount(0)
    await expect(
      page.locator('[data-work-group-id="neutron-rebrand"]').getByAltText("Neutron Rebrand, image 1 of 3")
    ).toBeVisible()

    await image.tap()

    await expect(page.getByTestId("image-lightbox")).toHaveCount(0)
    await expect.poll(() => getTranslateX(carousel)).toBe(startingX)
  })

  test("native Chromium drag constraints remain valid after a mobile orientation-sized resize", async ({
    browserName,
    page,
  }) => {
    test.skip(browserName !== "chromium", "Playwright exposes compositor touch swipes only through Chromium CDP")
    await page.goto("/")
    const carousel = page.locator('[data-work-group-id="neutron-rebrand"] [data-testid="carousel-track"]')
    await carousel.scrollIntoViewIfNeeded()
    const startingUrl = page.url()
    const narrowMaxOffset = await getMaxHorizontalOffset(carousel)
    const client = await page.context().newCDPSession(page)

    await page.setViewportSize({ width: 600, height: 390 })
    await expect.poll(() => getMaxHorizontalOffset(carousel)).toBeGreaterThan(narrowMaxOffset)
    await carousel.scrollIntoViewIfNeeded()
    const wideMaxOffset = await getMaxHorizontalOffset(carousel)
    for (let swipe = 0; swipe < 8 && (await getTranslateX(carousel)) >= -narrowMaxOffset; swipe += 1) {
      const start = await getVisibleCenter(page, carousel)
      await dispatchChromiumTouchSwipe(client, page, start, {
        x: start.x - 140,
        y: start.y + 4,
      })
    }
    await expect.poll(() => getTranslateX(carousel)).toBeLessThan(-narrowMaxOffset)
    await expect.poll(() => isTrackWithinHorizontalConstraints(carousel)).toBe(true)

    await page.setViewportSize({ width: 390, height: 700 })
    await expect(carousel).toBeVisible()
    await expect.poll(() => getMaxHorizontalOffset(carousel)).toBeLessThan(wideMaxOffset)
    await carousel.scrollIntoViewIfNeeded()
    let start = await getVisibleCenter(page, carousel)
    await dispatchChromiumTouchSwipe(client, page, start, {
      x: start.x - 140,
      y: start.y + 4,
    })
    await expect.poll(() => isTrackWithinHorizontalConstraints(carousel)).toBe(true)

    for (let swipe = 0; swipe < 10 && (await getTranslateX(carousel)) <= -1; swipe += 1) {
      start = await getVisibleCenter(page, carousel)
      await dispatchChromiumTouchSwipe(client, page, start, {
        x: start.x + 140,
        y: start.y + 4,
      })
    }
    await client.detach()

    await expect.poll(() => getTranslateX(carousel)).toBeGreaterThan(-1)
    await expect.poll(() => isTrackWithinHorizontalConstraints(carousel)).toBe(true)
    expect(page.url()).toBe(startingUrl)
  })
})

test("the complete lightbox journey is keyboard-only and focus-contained", async ({ page }) => {
  await page.goto("/")
  await page.evaluate(() => {
    document.body.style.overflow = "clip"
  })
  const opener = page.getByRole("button", {
    name: "Open image 2 of 3 for Neutron Rebrand",
  })
  await opener.focus()
  await page.keyboard.press("Enter")

  const dialog = page.getByRole("dialog", {
    name: "Image viewer for Neutron Rebrand",
  })
  const close = dialog.getByRole("button", { name: "Close image viewer" })
  const previous = dialog.getByRole("button", { name: "Previous image" })
  const next = dialog.getByRole("button", { name: "Next image" })
  const dots = [1, 2, 3].map((index) => dialog.getByRole("button", { name: `Go to image ${index}` }))

  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute("aria-modal", "true")
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden")
  await expect(page.getByAltText("Neutron Rebrand, image 2 of 3")).toBeVisible()
  await expect(dialog.getByRole("status")).toHaveText("Image 2 of 3 for Neutron Rebrand")
  await expect(close).toBeFocused()

  await page.keyboard.press("Tab")
  await expect(previous).toBeFocused()
  await expect(previous).toHaveCSS("opacity", "1")
  await expect(previous).toHaveCSS("pointer-events", "auto")
  await page.keyboard.press("Enter")
  await expect(page.getByAltText("Neutron Rebrand, image 1 of 3")).toBeVisible()
  await expect(previous).toBeFocused()

  for (const dot of dots) {
    await page.keyboard.press("Tab")
    await expect(dot).toBeFocused()
  }
  await page.keyboard.press("Enter")
  await expect(page.getByAltText("Neutron Rebrand, image 3 of 3")).toBeVisible()
  await expect(dots[2]).toBeFocused()

  await page.keyboard.press("Tab")
  await expect(next).toBeFocused()
  await expect(next).toHaveCSS("opacity", "1")
  await expect(next).toHaveCSS("pointer-events", "auto")
  await page.keyboard.press("Enter")
  await expect(page.getByAltText("Neutron Rebrand, image 1 of 3")).toBeVisible()
  await expect(next).toBeFocused()

  await page.keyboard.press("Tab")
  await expect(close).toBeFocused()
  await page.keyboard.press("Shift+Tab")
  await expect(next).toBeFocused()

  await page.keyboard.press("ArrowRight")
  await expect(page.getByAltText("Neutron Rebrand, image 2 of 3")).toBeVisible()
  await page.keyboard.press("End")
  await expect(page.getByAltText("Neutron Rebrand, image 3 of 3")).toBeVisible()
  await page.keyboard.press("Home")
  await expect(page.getByAltText("Neutron Rebrand, image 1 of 3")).toBeVisible()
  await page.keyboard.press("ArrowLeft")
  await expect(page.getByAltText("Neutron Rebrand, image 3 of 3")).toBeVisible()
  await page.keyboard.press("Escape")

  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("clip")

  await page.keyboard.press("Space")
  await expect(dialog).toBeVisible()
  await expect(page.getByAltText("Neutron Rebrand, image 2 of 3")).toBeVisible()
  await expect(close).toBeFocused()
  await page.keyboard.press("Enter")
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

test("lightbox controls stay attached to the image at the 620px desktop breakpoint", async ({ page }) => {
  await page.setViewportSize({ width: 620, height: 700 })
  await page.goto("/")
  const opener = page.getByRole("button", {
    name: "Open image 1 of 3 for Neutron Rebrand",
  })
  await opener.focus()
  await page.keyboard.press("Enter")
  const dialog = page.getByRole("dialog", {
    name: "Image viewer for Neutron Rebrand",
  })
  const imageFrame = page.getByTestId("lightbox-image-frame")
  const frameBox = await imageFrame.boundingBox()
  const previousBox = await dialog.getByRole("button", { name: "Previous image" }).boundingBox()
  const nextBox = await dialog.getByRole("button", { name: "Next image" }).boundingBox()
  const closeBox = await dialog.getByRole("button", { name: "Close image viewer" }).boundingBox()
  const indicatorsBox = await page.getByTestId("lightbox-indicators").boundingBox()

  expect(frameBox).not.toBeNull()
  expect(previousBox).not.toBeNull()
  expect(nextBox).not.toBeNull()
  expect(closeBox).not.toBeNull()
  expect(indicatorsBox).not.toBeNull()

  for (const controlName of ["Close image viewer", "Previous image", "Next image"]) {
    const box = await dialog.getByRole("button", { name: controlName }).boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(620)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    expect(box!.y + box!.height).toBeLessThanOrEqual(700)
  }

  expect(previousBox!.x + previousBox!.width).toBeLessThanOrEqual(frameBox!.x)
  expect(nextBox!.x).toBeGreaterThanOrEqual(frameBox!.x + frameBox!.width)
  expect(closeBox!.x).toBeGreaterThanOrEqual(frameBox!.x + frameBox!.width)
  expect(indicatorsBox!.y).toBeGreaterThan(frameBox!.y + frameBox!.height)
  expect(indicatorsBox!.y - (frameBox!.y + frameBox!.height)).toBeLessThanOrEqual(28)

  const activeIndicator = dialog
    .getByRole("button", { name: "Go to image 1" })
    .locator("span")
  const inactiveIndicator = dialog
    .getByRole("button", { name: "Go to image 2" })
    .locator("span")
  await expect(activeIndicator).toHaveCSS("width", "24px")
  await expect(inactiveIndicator).toHaveCSS("width", "10px")

  await page.mouse.click(8, 8)
  await expect(dialog).toHaveCount(0)
})

test("the open gallery dialog has no relevant automated accessibility violations", async ({ page }) => {
  await page.goto("/")
  const opener = page.getByRole("button", {
    name: "Open image 1 of 3 for Neutron Rebrand",
  })
  await opener.focus()
  await page.keyboard.press("Enter")
  await expect(page.getByRole("dialog", { name: "Image viewer for Neutron Rebrand" })).toBeVisible()

  const results = await new AxeBuilder({ page })
    .include('[data-work-group-id="neutron-rebrand"]')
    .withRules([
      "aria-allowed-attr",
      "aria-allowed-role",
      "aria-dialog-name",
      "aria-hidden-focus",
      "aria-prohibited-attr",
      "aria-required-attr",
      "aria-roles",
      "aria-valid-attr-value",
      "aria-valid-attr",
      "button-name",
      "focus-order-semantics",
      "nested-interactive",
    ])
    .analyze()

  expect(results.violations).toEqual([])
})

test("the lightbox renders an accessible error and recovers through navigation", async ({ page }) => {
  allowExpectedImageFailure = true
  await page.route("**/_next/image?**", async (route) => {
    const requestUrl = new URL(route.request().url())
    const imageUrl = requestUrl.searchParams.get("url") ?? ""
    if (requestUrl.searchParams.get("q") === "95" && imageUrl.includes("neutron brand 1.jpg")) {
      await route.fulfill({ status: 500, body: "forced image failure" })
      return
    }
    await route.continue()
  })
  await page.goto("/")
  await page.locator('[data-work-group-id="neutron-rebrand"] [data-carousel-image-index="0"]').click()
  const dialog = page.getByRole("dialog", {
    name: "Image viewer for Neutron Rebrand",
  })
  const imageFrame = page.getByTestId("lightbox-image-frame")
  const errorMessage = dialog.getByText("Could not load image 1 of 3 for Neutron Rebrand.")

  await expect(imageFrame).toHaveAttribute("data-image-state", "error")
  await expect(errorMessage).toBeVisible()
  await expect(errorMessage).toHaveAttribute("role", "status")
  await expect(errorMessage).toHaveAttribute("aria-live", "polite")
  await expect(errorMessage).toHaveAttribute("aria-atomic", "true")
  await expect(dialog.getByRole("button", { name: "Close image viewer" })).toBeEnabled()
  await expect(dialog.getByRole("button", { name: "Previous image" })).toBeEnabled()
  await expect(dialog.getByRole("button", { name: "Next image" })).toBeEnabled()
  for (const index of [1, 2, 3]) {
    await expect(dialog.getByRole("button", { name: `Go to image ${index}` })).toBeEnabled()
  }

  const errorStateA11y = await new AxeBuilder({ page })
    .include('[data-testid="image-lightbox"]')
    .withRules([
      "aria-allowed-attr",
      "aria-allowed-role",
      "aria-dialog-name",
      "aria-hidden-focus",
      "aria-prohibited-attr",
      "aria-required-attr",
      "aria-roles",
      "aria-valid-attr-value",
      "aria-valid-attr",
      "button-name",
      "focus-order-semantics",
      "nested-interactive",
    ])
    .analyze()
  expect(errorStateA11y.violations).toEqual([])

  await page.keyboard.press("ArrowRight")
  await expect(page.getByAltText("Neutron Rebrand, image 2 of 3")).toBeVisible()
  await expect(imageFrame).toHaveAttribute("data-image-state", "loaded")
  await expect(errorMessage).toHaveCount(0)

  await page.keyboard.press("ArrowLeft")
  await expect(imageFrame).toHaveAttribute("data-image-state", "error")
  await expect(errorMessage).toBeVisible()

  await dialog.getByRole("button", { name: "Close image viewer" }).click()
  await expect(dialog).toHaveCount(0)
})

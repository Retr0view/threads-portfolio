import { createIntroAnimationSchedule } from "@/lib/intro-animation"
import { describe, expect, it } from "vitest"

const paragraphs = [
  "I design in code, working with founders to turn rough ideas into real products.",
  "As a senior product designer with an engineer’s eye, I stay close from the first prototype through launch and whatever comes next.",
  "To me, craft lives in the details: every interaction, edge case, and small decision. Get them right, and they add up to an experience that simply feels right.",
] as const

describe("createIntroAnimationSchedule", () => {
  it("derives the original granular timing across all current paragraphs", () => {
    const schedule = createIntroAnimationSchedule(paragraphs)

    expect(schedule.paragraphs.map(({ text, wordCount }) => ({ text, wordCount }))).toEqual([
      { text: paragraphs[0], wordCount: 14 },
      { text: paragraphs[1], wordCount: 22 },
      { text: paragraphs[2], wordCount: 28 },
    ])
    expect(schedule.paragraphs.map(({ start }) => start)).toEqual([
      expect.closeTo(0.25),
      expect.closeTo(0.83),
      expect.closeTo(1.57),
    ])
    expect(schedule.paragraphs.map(({ end }) => end)).toEqual([
      expect.closeTo(0.71),
      expect.closeTo(1.45),
      expect.closeTo(2.31),
    ])
    expect(schedule.bioEnd).toBeCloseTo(2.31)
    expect(schedule.entranceComplete).toBeCloseTo(2.41)
  })

  it("handles an empty biography without inventing animation time", () => {
    expect(createIntroAnimationSchedule([])).toEqual({
      paragraphs: [],
      bioEnd: 0,
      entranceComplete: 0.1,
    })
  })
})

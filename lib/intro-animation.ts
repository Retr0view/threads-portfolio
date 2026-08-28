import { ANIMATION } from "@/lib/constants"

export interface IntroParagraphSchedule {
  text: string
  wordCount: number
  start: number
  end: number
}

export interface IntroAnimationSchedule {
  paragraphs: IntroParagraphSchedule[]
  bioEnd: number
  entranceComplete: number
}

export function createIntroAnimationSchedule(
  paragraphTexts: readonly string[]
): IntroAnimationSchedule {
  let paragraphStart = ANIMATION.FIRST_PARAGRAPH_START

  const paragraphs = paragraphTexts.map((text) => {
    const wordCount = text.split(" ").length
    const end = paragraphStart
      + (wordCount - 1) * ANIMATION.WORD_STAGGER
      + ANIMATION.WORD_DURATION
    const paragraph = { text, wordCount, start: paragraphStart, end }
    paragraphStart = end + ANIMATION.PARAGRAPH_GAP
    return paragraph
  })

  const bioEnd = paragraphs.at(-1)?.end ?? 0
  return {
    paragraphs,
    bioEnd,
    entranceComplete: bioEnd + ANIMATION.BIO_ANIMATION_END_OFFSET,
  }
}

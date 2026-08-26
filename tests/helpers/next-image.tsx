import React, { forwardRef, type ImgHTMLAttributes } from "react"

type MockImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  blurDataURL?: string
  fill?: boolean
  preload?: boolean
  priority?: boolean
  quality?: number
}

type MockGetImagePropsInput = {
  src: string
  sizes?: string
  quality?: number
}

const MockNextImage = forwardRef<HTMLImageElement, MockImageProps>(
  ({ blurDataURL, fill, preload, priority, quality, ...props }, ref) => {
    void blurDataURL
    void fill
    void quality
    return React.createElement("img", {
      ...props,
      "data-preload": preload || priority ? "true" : undefined,
      ref,
    })
  }
)

MockNextImage.displayName = "MockNextImage"

export function getImageProps({ src, sizes, quality = 75 }: MockGetImagePropsInput) {
  const optimizedSource = `/_next/image?url=${encodeURIComponent(src)}&w=1200&q=${quality}`

  return {
    props: {
      src: optimizedSource,
      sizes,
      srcSet: `${optimizedSource} 1200w`,
    },
  }
}

export default MockNextImage

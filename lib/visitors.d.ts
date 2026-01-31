declare global {
  interface Window {
    visitors?: {
      track: (event: string, properties?: Record<string, string | number>) => void
    }
  }
}

export { }


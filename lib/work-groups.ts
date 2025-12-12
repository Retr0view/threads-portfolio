export interface WorkGroup {
  id: string
  name: string
  company: string
  description: string
  logoPath: string
  imageFolder: string
  images: string[]
}

export const workGroups: WorkGroup[] = [
  {
    id: "neutron-rebrand",
    name: "Neutron Rebrand",
    company: "Neutron",
    description: `Brand direction in collaboration with <span class="underline">Studio Koto</span>, 2025`,
    logoPath: "/logos/neutron.svg",
    imageFolder: "/images/Neutron Rebrand",
    images: [], // Will be populated when images are added
  },
  {
    id: "neutron-ui",
    name: "Neutron Web & App",
    company: "Neutron",
    description: "Head of Design, 2023 - 2025",
    logoPath: "/logos/neutron.svg",
    imageFolder: "/images/Neutron UI",
    images: [], // Will be populated when images are added
  },
  {
    id: "structured",
    name: "Structured",
    company: "Structured",
    description: `Brand direction in collaboration with <span class="underline">Locomotive</span>, 2025`,
    logoPath: "/logos/structured.svg",
    imageFolder: "/images/Structured",
    images: [], // Will be populated when images are added
  },
  {
    id: "highlight",
    name: "Highlight AI casestudy",
    company: "Highlight",
    description: "Design experiment, 2025",
    logoPath: "/logos/highlight.svg",
    imageFolder: "/images/Highlight",
    images: [], // Will be populated when images are added
  },
]


export interface WorkGroup {
  id: string
  name: string
  company: string
  description: string
  logoPath: string
  imageFolder: string
  images: string[]
  placeholderImage: string
}

export const workGroups: WorkGroup[] = [
  {
    id: "neutron-rebrand",
    name: "Neutron Rebrand",
    company: "Neutron",
    description: `Brand direction in collaboration with <a href="https://koto.com/" class="underline" target="_blank" rel="noopener noreferrer">Studio Koto</a>, 2025`,
    logoPath: "/logos/neutron.png",
    imageFolder: "/images/Neutron Rebrand",
    images: [
      "neutron brand 1.jpg",
      "neutron brand 2.jpg",
      "neutron brand 3.jpg",
    ],
    placeholderImage: "/images/Neutron Rebrand/image 58.jpg",
  },
  {
    id: "neutron-ui",
    name: "Neutron Web & App",
    company: "Neutron",
    description: "Head of Design, 2023 - 2025",
    logoPath: "/logos/neutron.png",
    imageFolder: "/images/Neutron UI",
    images: [
      "neutron app 1.jpg",
      "neutron app 2.jpg",
      "neutron app 3.jpg",
    ],
    placeholderImage: "/images/Neutron Rebrand/image 58.jpg",
  },
  {
    id: "structured",
    name: "Structured",
    company: "Structured",
    description: `Brand direction in collaboration with <a href="https://locomotive.ca/en" class="underline" target="_blank" rel="noopener noreferrer">Locomotive</a>, 2025`,
    logoPath: "/logos/structured.png",
    imageFolder: "/images/Structured",
    images: [
      "structured brand 1.jpg",
      "structured brand 2.jpg",
      "structured brand 3.jpg",
    ],
    placeholderImage: "/images/Neutron Rebrand/image 58.jpg",
  },
  {
    id: "highlight",
    name: "Highlight AI casestudy",
    company: "Highlight",
    description: "Design experiment, 2025",
    logoPath: "/logos/highlight.png",
    imageFolder: "/images/Highlight",
    images: [
      "Highlight casestudy 1.jpg",
      "Highlight casestudy 2.jpg",
    ],
    placeholderImage: "/images/Neutron Rebrand/image 58.jpg",
  },
]


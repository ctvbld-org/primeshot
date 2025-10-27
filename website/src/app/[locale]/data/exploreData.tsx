// data/exploreData.ts
export interface ExploreItem {
    id: number;
    image: string;
    aspectRatio: '1:1' | '2:3' | '3:2';
    resolution: string;
    model: string;
    style: string;
    scene: string;
    wardrobe: string;
    color: string;
    category: string;
  }

export interface StyleFilter {
  name: string;
  description: string;
  ctaLink: string;
}
  
  export const exploreData: ExploreItem[] = [
    {
      id: 1,
      image: "/placeholders/styles/crosswall-9-w960.webp",
      aspectRatio: "1:1",
      resolution: "2K",
      model: "Primeshot v1",
      style:"Crosswall",
      scene: "minimalist-hallway",
      wardrobe: "layr_m_03",
      color: "brown",
      category: "Corporate",
    }
  ];

export const styleFilters: Record<string, StyleFilter> = {
  "Corporate": {
    name: "Corporate",
    description: "Professional and approachable with a modern edge. Ideal for LinkedIn, corporate headshots, team pages and pitch decks.",
    ctaLink: "/pricing"
  },
  "Blindlight": {
    name: "Blindlight",
    description: "Striking and cinematic with bold shadows and light. Perfect for expressive portraits, profiles and creative branding.",
    ctaLink: "/pricing"
  },
  "Golden Noir": {
    name: "Golden Noir",
    description: "Moody and dramatic with rich tones and contrast. A cinematic portrait style for bold personal branding and editorial use.",
    ctaLink: "/pricing"
  },
  "Studio Pro": {
    name: "Studio Pro",
    description: "Clean and polished with timeless studio lighting. A versatile choice for professional headshots, personal branding and actors' portfolios.",
    ctaLink: "/pricing"
  }
};

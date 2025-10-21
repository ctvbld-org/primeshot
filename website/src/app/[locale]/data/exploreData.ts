// Types
export type AspectRatio = '1:1' | '2:3' | '3:2' | '9:16';

export interface ExploreItem {
  id: string;
  image: string;
  aspectRatio: AspectRatio;
  resolution: string;
  model: string;
  prompt: string;
  category: string;
}

export interface StyleFilter {
  name: string;
  description: string;
  ctaLink: string;
}

// Style filter data
export const styleFilters: Record<string, StyleFilter> = {
  "Professional": {
    name: "Professional",
    description: "Polished, business-ready headshots perfect for LinkedIn, corporate profiles, and professional portfolios.",
    ctaLink: "/experience#styles"
  },
  "Creative": {
    name: "Creative",
    description: "Artistic and expressive portraits that showcase your unique personality and creative vision.",
    ctaLink: "/experience#styles"
  },
  "Casual": {
    name: "Casual",
    description: "Relaxed and approachable portraits ideal for social media and personal branding.",
    ctaLink: "/experience#styles"
  },
  "Cinematic": {
    name: "Cinematic",
    description: "Dramatic, film-inspired portraits with stunning lighting and composition.",
    ctaLink: "/experience#styles"
  },
  "Fashion": {
    name: "Fashion",
    description: "High-fashion editorial style portraits with striking poses and sophisticated aesthetics.",
    ctaLink: "/experience#styles"
  },
  "Vintage": {
    name: "Vintage",
    description: "Timeless portraits with classic photography aesthetics and nostalgic appeal.",
    ctaLink: "/experience#styles"
  }
};

// Explore data - sample items
// TODO: Replace with actual image URLs from your CDN
export const exploreData: ExploreItem[] = [
  {
    id: "1",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "2:3",
    resolution: "1024x1365",
    model: "Professional",
    prompt: "Professional corporate headshot with modern office background",
    category: "Professional"
  },
  {
    id: "2",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "2:3",
    resolution: "1024x1365",
    model: "Creative",
    prompt: "Artistic portrait with dramatic lighting and creative composition",
    category: "Creative"
  },
  {
    id: "3",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "2:3",
    resolution: "1024x1365",
    model: "Casual",
    prompt: "Relaxed outdoor portrait with natural lighting",
    category: "Casual"
  },
  {
    id: "4",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "9:16",
    resolution: "1024x1365",
    model: "Cinematic",
    prompt: "Cinematic portrait with moody atmosphere and film-inspired color grading",
    category: "Cinematic"
  },
  {
    id: "5",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "2:3",
    resolution: "1024x1365",
    model: "Fashion",
    prompt: "High-fashion editorial portrait with striking pose and elegant styling",
    category: "Fashion"
  },
  {
    id: "6",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "2:3",
    resolution: "1024x1365",
    model: "Vintage",
    prompt: "Classic vintage portrait with timeless photography aesthetics",
    category: "Vintage"
  },
  {
    id: "7",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "2:3",
    resolution: "1024x1365",
    model: "Professional",
    prompt: "Corporate headshot with minimalist background and professional attire",
    category: "Professional"
  },
  {
    id: "8",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "1:1",
    resolution: "1024x1024",
    model: "Creative",
    prompt: "Experimental portrait with unique perspective and artistic expression",
    category: "Creative"
  },
  {
    id: "9",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "3:2",
    resolution: "1024x1365",
    model: "Casual",
    prompt: "Approachable lifestyle portrait with warm, natural tones",
    category: "Casual"
  },
  {
    id: "10",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "9:16",
    resolution: "1024x1365",
    model: "Cinematic",
    prompt: "Film noir inspired portrait with dramatic shadows and contrast",
    category: "Cinematic"
  },
  {
    id: "11",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "2:3",
    resolution: "1024x1365",
    model: "Fashion",
    prompt: "Contemporary fashion portrait with bold styling and modern aesthetics",
    category: "Fashion"
  },
  {
    id: "12",
    image: "/images/explore/Golden-Noir-01.png",
    aspectRatio: "2:3",
    resolution: "1024x1365",
    model: "Vintage",
    prompt: "Retro-inspired portrait with period-appropriate styling and color treatment",
    category: "Vintage"
  }
];


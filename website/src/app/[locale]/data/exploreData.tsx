// data/exploreData.ts
export interface ExploreItem {
    id: number;
    image: string;
    aspectRatio: '1:1' | '2:3' | '3:2';
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
  
  export const exploreData: ExploreItem[] = [
    {
      id: 1,
      image: "/images/explore/image-1.png",
      aspectRatio: "3:2",
      resolution: "2K",
      model: "Primeshot v1",
      prompt: "Professional headshot in modern office setting with warm lighting",
      category: "Corporate",
    },
    {
      id: 2,
      image: "/images/explore/image-2.png",
      aspectRatio: "2:3",
      resolution: "1K",
      model: "Primeshot v1",
      prompt: "Artistic portrait with dramatic lighting and creative composition",
      category: "Studio Pro",
    },
    {
      id: 3,
      image: "/images/explore/image-3.png",
      aspectRatio: "1:1",
      resolution: "1K",
      model: "Primeshot v1",
      prompt: "Smart casual look perfect for business casual environments",
      category: "Corporate",
    },
    {
        id: 4,
        image: "/images/explore/image-4.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Expressive artistic portrait with unique styling and mood",
        category: "Studio Pro"
      },
      {
        id: 5,
        image: "/images/explore/image-5.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Executive headshot with sophisticated background and professional attire",
        category: "Corporate"
      },
      {
        id: 6,
        image: "/images/explore/image-6.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Clean, minimalist portrait with focus on facial expression",
        category: "Blindlight"
      },
      {
        id: 7,
        image: "/images/explore/image.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Tech professional headshot suitable for LinkedIn and company profiles",
        category: "Corporate"
      },
      {
        id: 8,
        image: "/images/explore/image_720.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Professional studio lighting with perfect shadow and highlight balance",
        category: "Studio Pro"
      },
      {
        id: 9,
        image: "/images/explore/image_720-1.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Simple, clean portrait with focus on natural expression",
        category: "Blindlight"
      },
      {
        id: 10,
        image: "/images/explore/image_720-2.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Elite corporate headshot for senior executives and leadership",
        category: "Corporate"
      },
      {
        id: 11,
        image: "/images/explore/image_720-3.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Bold and creative portrait with vibrant colors and dynamic composition",
        category: "Studio Pro"
      },
      {
        id: 12,
        image: "/images/explore/image_720-4.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Essential minimalist portrait focusing on core elements",
        category: "Blindlight"
      },
      {
        id: 13,
        image: "/images/explore/app-images-9.webp",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Contemporary business casual look for modern professionals",
        category: "Corporate"
      },
      {
        id: 14,
        image: "/images/explore/image-7.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Visionary artistic portrait with surreal elements and mood",
        category: "Studio Pro"
      },
      {
        id: 15,
        image: "/images/explore/image-6.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Confident startup founder in modern office environment",
        category: "Corporate"
      },
      {
        id: 16,
        image: "/images/explore/image-3.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "High contrast dramatic lighting with cinematic composition",
        category: "Studio Pro"
      },
      {
        id: 17,
        image: "/images/explore/image-4.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Ultra minimal composition focusing on essential forms",
        category: "Blindlight"
      },
      {
        id: 18,
        image: "/images/explore/image-5.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Distinguished executive portrait for corporate leadership",
        category: "Corporate"
      },
      {
        id: 19,
        image: "/images/explore/image-6.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Abstract conceptual portrait exploring identity and form",
        category: "Studio Pro"
      },
      {
        id: 20,
        image: "/images/explore/image.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Innovative tech leader with modern aesthetic",
        category: "Corporate"
      },
      {
        id: 21,
        image: "/images/explore/image_720.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Geometric composition with clean lines and minimal elements",
        category: "Blindlight"
      },
      {
        id: 22,
        image: "/images/explore/image_720-1.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Trendsetting fashion portrait with contemporary styling",
        category: "Studio Pro"
      },
      {
        id: 23,
        image: "/images/explore/image_720-2.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Classic corporate headshot for business profiles",
        category: "Corporate"
      },
      {
        id: 24,
        image: "/images/explore/image_720-3.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Peaceful minimalist portrait with serene composition",
        category: "Golden Noir"
      },
      // Additional Studio Pro items to reach 10
      {
        id: 25,
        image: "/images/explore/image-7.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Surreal portrait blending reality with dreamlike elements",
        category: "Studio Pro"
      },
      {
        id: 26,
        image: "/images/explore/image.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Vibrant creative portrait with explosive color palette",
        category: "Studio Pro"
      },
      // Additional Minimalist items to reach 10
      {
        id: 27,
        image: "/images/explore/image-7.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Ultra-clean minimalist portrait with pristine composition",
        category: "Blindlight"
      },
      {
        id: 28,
        image: "/images/explore/image-1.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Powerful minimalist portrait conveying quiet confidence",
        category: "Blindlight"
      },
      {
        id: 29,
        image: "/images/explore/image-5.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Intensely focused minimalist portrait with sharp clarity",
        category: "Blindlight"
      },
      {
        id: 30,
        image: "/images/explore/image-6.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Minimalist portrait capturing the pure essence of expression",
        category: "Blindlight"
      },
      {
        id: 31,
        image: "/images/explore/image.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Masterful minimalist portrait with expert composition",
        category: "Blindlight"
      },
      // Additional Photography items to reach 10
      {
        id: 32,
        image: "/images/explore/image_720.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Beautiful golden hour photography with magical lighting",
        category: "Golden Noir"
      },
      {
        id: 33,
        image: "/images/explore/image_720-1.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Candid street photography capturing authentic urban life",
        category: "Golden Noir"
      },
      {
        id: 34,
        image: "/images/explore/image_720-2.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Stunning nature photography with perfect light and composition",
        category: "Golden Noir"
      },
      {
        id: 35,
        image: "/images/explore/image_720-3.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Elegant architectural photography with stunning composition",
        category: "Golden Noir"
      },
      {
        id: 36,
        image: "/images/explore/image-1.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Powerful documentary photography capturing real moments",
        category: "Golden Noir"
      },
      {
        id: 37,
        image: "/images/explore/image-2.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Fine art photography with artistic vision and technique",
        category: "Golden Noir"
      },
      {
        id: 38,
        image: "/images/explore/image-3.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Environmental portrait photography telling a complete story",
        category: "Golden Noir"
      },
      {
        id: 39,
        image: "/images/explore/image-4.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Timeless black and white photography with classic composition",
        category: "Golden Noir"
      },
      {
        id: 40,
        image: "/images/explore/image-5.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Lifestyle photography capturing authentic life moments",
        category: "Golden Noir"
      },
      // New category: Business - 12 items
      {
        id: 41,
        image: "/images/explore/image-6.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Modern executive portrait for contemporary business leaders",
        category: "Studio Pro"
      },
      {
        id: 42,
        image: "/images/explore/image.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Visionary corporate portrait showcasing leadership qualities",
        category: "Studio Pro"
      },
      {
        id: 43,
        image: "/images/explore/image_720.png",
        aspectRatio: "3:2",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Dynamic startup founder portrait with entrepreneurial energy",
        category: "Studio Pro"
      },
      {
        id: 44,
        image: "/images/explore/image_720-1.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Commanding boardroom presence portrait for executives",
        category: "Studio Pro"
      },
      {
        id: 45,
        image: "/images/explore/image_720-2.png",
        aspectRatio: "3:2",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Innovative tech professional portrait for modern companies",
        category: "Studio Pro"
      },
      {
        id: 46,
        image: "/images/explore/image_720-3.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Trustworthy financial expert portrait for banking and finance",
        category: "Studio Pro"
      },
      {
        id: 47,
        image: "/images/explore/image-1.png",
        aspectRatio: "1:1",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Authoritative legal professional portrait conveying expertise",
        category: "Studio Pro"
      },
      {
        id: 48,
        image: "/images/explore/image-2.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Compassionate healthcare leader portrait for medical professionals",
        category: "Studio Pro"
      },
      {
        id: 49,
        image: "/images/explore/image-3.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Professional real estate agent portrait for property industry",
        category: "Studio Pro"
      },
      {
        id: 50,
        image: "/images/explore/image-4.png",
        aspectRatio: "1:1",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Creative marketing director portrait for advertising agencies",
        category: "Studio Pro"
      },
      {
        id: 51,
        image: "/images/explore/image-5.png",
        aspectRatio: "1:1",
        resolution: "2K",
        model: "Primeshot v1",
        prompt: "Knowledgeable consultant portrait for professional services",
        category: "Studio Pro"
      },
      {
        id: 52,
        image: "/images/explore/image-6.png",
        aspectRatio: "2:3",
        resolution: "1K",
        model: "Primeshot v1",
        prompt: "Specialized industry expert portrait for niche professionals",
        category: "Studio Pro"
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

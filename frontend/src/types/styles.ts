export interface Style {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  preview_images: string[];
  available_genders: string[];
  available_backgrounds: string[];
  available_clothing: string[];
  available_clothing_colors: string[];
  created_at: string;
  updated_at: string;
  translations: {
    [lang: string]: {
      name: string;
      tagline: string;
      description: string;
    }
  };
}

export interface OptionItem {
  id: string;
  label: string;
  imageUrl?: string;
  translations: {
    [lang: string]: {
      label: string;
    }
  };
}

export interface Option {
  category: string;
  label: string;
  description: string | null;
  options: OptionItem[];
  created_at: string;
  updated_at: string;
  translations: {
    [lang: string]: {
      label: string;
      description: string;
    }
  };
}

export type StyleId = Style['id'];
export type OptionCategory = Option['category']; 
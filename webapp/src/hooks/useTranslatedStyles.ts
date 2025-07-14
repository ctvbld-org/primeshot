import { useTranslation } from 'react-i18next';
import type { Scene, Wardrobe, Color } from '@/types/styles';

function getTranslatedField<T extends { translations?: { [lang: string]: { [key: string]: string } } }>(
  item: T,
  field: keyof T,
  lang: string,
  translationField: string = field as string
): string {
  if (
    item.translations?.[lang]?.[translationField] &&
    typeof item.translations[lang][translationField] === 'string'
  ) {
    return item.translations[lang][translationField];
  }
  return item[field] as string;
}

export function useTranslatedScene(scene: Scene | null | undefined) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!scene) return null;

  const translatedScene: Scene = {
    ...scene,
    label: getTranslatedField(scene, 'label', currentLang)
  };

  return translatedScene;
}

export function useTranslatedScenes(scenes: Scene[] | null | undefined) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!scenes) return null;

  return scenes.map(scene => ({
    ...scene,
    label: getTranslatedField(scene, 'label', currentLang)
  }));
}

export function useTranslatedWardrobe(wardrobe: Wardrobe | null | undefined) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!wardrobe) return null;

  const translatedWardrobe: Wardrobe = {
    ...wardrobe,
    label: getTranslatedField(wardrobe, 'label', currentLang)
  };

  return translatedWardrobe;
}

export function useTranslatedWardrobes(wardrobes: Wardrobe[] | null | undefined) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!wardrobes) return null;

  return wardrobes.map(wardrobe => ({
    ...wardrobe,
    label: getTranslatedField(wardrobe, 'label', currentLang)
  }));
}

export function useTranslatedColor(color: Color | null | undefined) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!color) return null;

  const translatedColor: Color = {
    ...color,
    label: getTranslatedField(color, 'label', currentLang)
  };

  return translatedColor;
}

export function useTranslatedColors(colors: Color[] | null | undefined) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!colors) return null;

  return colors.map(color => ({
    ...color,
    label: getTranslatedField(color, 'label', currentLang)
  }));
} 
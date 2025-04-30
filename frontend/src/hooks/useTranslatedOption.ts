import { useTranslation } from 'react-i18next';
import type { Option, OptionItem } from '@/types/styles';

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

export function useTranslatedOption(option: Option | null | undefined) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!option) return null;

  const translatedOption: Option = {
    ...option,
    label: getTranslatedField(option, 'label', currentLang),
    description: getTranslatedField(option, 'description', currentLang),
    options: option.options.map(item => ({
      ...item,
      label: getTranslatedField(item, 'label', currentLang)
    }))
  };

  return translatedOption;
}

export function useTranslatedOptions(options: Option[] | null | undefined) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  if (!options) return null;

  return options.map(option => ({
    ...option,
    label: getTranslatedField(option, 'label', currentLang),
    description: getTranslatedField(option, 'description', currentLang),
    options: option.options.map(item => ({
      ...item,
      label: getTranslatedField(item, 'label', currentLang)
    }))
  }));
} 
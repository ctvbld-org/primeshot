import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/auth-context';
import i18n from '@/i18n';
import { t } from 'i18next';

// Language name mapping
const languageLabels: Record<string, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  nl: 'Nederlands',
  pt: 'Português',
  ja: '日本語',
  zh: '中文'
};

type Language = {
  label: string;
  value: string;
};

// Get languages dynamically from i18n config
const languages: Language[] = (i18n.options.supportedLngs || [])
  .filter((lng: string) => lng !== 'cimode') // Filter out i18next's internal language
  .map((lng: string) => ({
    label: languageLabels[lng] || lng,
    value: lng
  }));

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(i18n.language);
  const { user } = useAuth();

  // Load user's preferred language on mount
  useEffect(() => {
    async function loadLanguagePreference() {
      if (!user) {
        // For non-authenticated users, use the i18next default
        setValue(i18n.language);
        return;
      }
      
      try {
        console.log('Loading language preference...');
        const supabase = createClient();
        const { data, error } = await supabase
          .rpc('get_language_preference');
        
        if (error) {
          console.error('Error loading language preference:', error);
          // Use i18next default on error
          setValue(i18n.language);
        } else if (data) {
          console.log('Loaded language preference:', data);
          setValue(data);
          i18n.changeLanguage(data);
        }
      } catch (error) {
        console.error('Error in loadLanguagePreference:', error);
        // Use i18next default on error
        setValue(i18n.language);
      }
    }
    
    loadLanguagePreference();
  }, [user, i18n]);

  // Update language preference in database and i18n
  const handleLanguageChange = async (newValue: string) => {
    console.log('Changing language to:', newValue);
    setValue(newValue);
    i18n.changeLanguage(newValue);
    setOpen(false);

    if (user) {
      try {
        console.log('Updating language preference in database...');
        const supabase = createClient();
        const { error } = await supabase
          .rpc('update_language_preference', {
            new_language: newValue
          });
        
        if (error) {
          console.error('Error updating language preference:', error);
        } else {
          console.log('Language preference updated successfully');
        }
      } catch (error) {
        console.error('Error in handleLanguageChange:', error);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          className="flex items-center justify-center cursor-pointer h-8 w-auto px-3 text-white text-sm font-normal"
        >
          {value
            ? languages.find((language) => language.value === value)?.label
            : t('language')}
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[100px] p-1">
        <div className="flex flex-col gap-1">
          {languages.map((language) => (
            <button
              key={language.value}
              className="flex items-center justify-between cursor-pointer px-3 py-2 text-sm"
              onClick={() => handleLanguageChange(language.value)}
            >
              <span>{language.label}</span>
              {value === language.value && (
                <Check className="h-4 w-4" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
} 
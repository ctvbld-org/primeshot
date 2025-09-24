# Search all the natural english sentence(s) in the targeted file(s) to translate them in English (en-GB), French (fr-FR), Spanish (es-ES), Italian (it-IT), Portugese (pt-PT), German (de-DE), Dutch (nl-NL), Chinese Simplified (zh-CN), Japanese (ja-JP) and perform the following:

## 1. Create translation key(s) in the appropriate **namespace file**.
   * **Feature-specific copy** → `webapp/src/locales/{lang}/{namespace}.json` (or the equivalent `website/` path).
   * **Shared copy used by more than one project** → `common/locales/{lang}/{namespace}.json` (published as `@primeshot/common`).
   
   Example: a new **upload** page string that is only used in the SPA goes to `webapp/src/locales/en-GB/upload.json`; a string that is reused by both the SPA and the marketing site goes to `common/locales/en-GB/common.json`.

## 2. Replace all the sentence(s) with the newly created translation key(s).

## 3. Make sure that the import and the variation variable exist:
        import { useTranslation } from 'react-i18next'
        const { t } = useTranslation('[replace_with_translation_json]')

## 4. Translate all the new language key(s) in every languages defined in frontend/locales/ making sure that every files reflect the "en-GB" version and that there are no missing keys.

## 5. Once done, perform a quality check and make sure that all natural sentences are translated in all languages (en-GB, fr-FR, es-ES, it-IT, pt-PT, de-DE, nl-NL, zh-CN, ja-JP).

## 6. Conventions and Policies
- Use region-specific language codes across the project (e.g., `en-GB`, `zh-CN`).
- There is no i18n fallback configured; ensure all keys exist in all supported languages.
- Persist user language in DB via `public.user_settings.preferred_language` (same region code). Use RPCs `get_user_language`/`set_user_language`.

## Related Rules
- See @professional-translation-guidelines.md for translation quality
- See @project_structure.mdc for file organization 
- See @i18n.mdc and @translations.mdc for patterns and type-safety 
# Search all the natural english sentence(s) in the targeted file(s) to translate them in English, French, Spanish, Italian, Portugese, German, Dutch, Chinese, Japanese and perform the following:

## 1. Create translation key(s) in the appropriate **namespace file**.
   * **Feature-specific copy** → `webapp/src/locales/{lang}/{namespace}.json` (or the equivalent `website/` path).
   * **Shared copy used by more than one project** → `common/locales/{lang}/{namespace}.json` (published as `@primeshot/common`).
   
   Example: a new **upload** page string that is only used in the SPA goes to `webapp/src/locales/en/upload.json`; a string that is reused by both the SPA and the marketing site goes to `common/locales/en/common.json`.

## 2. Replace all the sentence(s) with the newly created translation key(s).

## 3. Make sure that the import and the variation variable exist:
        import { useTranslation } from 'react-i18next'
        const { t } = useTranslation('[replace_with_translation_json]')

## 4. Translate all the new language key(s) in every languages defined in frontend/locales/ making sure that every files reflect the "en" version and that there are no missing keys.

## 5. Once done, perform a quality check and make sure that all natural sentences are translated in all languages (English, French, Spanish, Italian, Portugese, German, Dutch, Chinese, Japanese).

## Do all the steps on by one and come back to this document for cross referencing what you need to do next.

## Related Rules
- See @professional-translation-guidelines.md for how to translate properly
- See @project_structure.mdc for file organization 
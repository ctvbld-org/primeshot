# Search all the natural english sentence(s) in the targeted file(s) to translate them in English (en), French (fr), Spanish (es), Italian (it), Portuguese (pt), German (de), Dutch (nl), Chinese Simplified (cn), Japanese (jp) and perform the following:

## 1. Create translation key(s) in the appropriate **namespace file**.
   * **Feature-specific copy** → `webapp/src/locales/{lang}/{namespace}.json` (or the equivalent `website/` path).
   * **Shared copy used by more than one project** → `common/locales/{lang}/{namespace}.json` (published as `@primeshot/common`).
   
   Example: a new **upload** page string that is only used in the SPA goes to `common/locales/en/upload.json`; a string that is reused by both the SPA and the marketing site goes to `common/locales/en/common.json`.

## 2. Replace all the sentence(s) with the newly created translation key(s).

## 3. Make sure that the import and the variation variable exist:
        import { useTranslation } from 'react-i18next'
        const { t } = useTranslation('[replace_with_translation_json]')

## 4. Translate all the new language key(s) in every languages defined in common/locales/ making sure that every files reflect the "en" version and that there are no missing keys.

## 5. If creating a new translation namespace file, register it in the i18n configuration:
   * Add import statements for all languages in `common/i18n.ts`
   * Add the namespace to the `resources` object for each language
   * Add the namespace to the `ns` array in `common/i18n.ts`, `common/i18n-client.ts`, and `common/i18n-server.ts`
   * Rebuild the common package with `cd common && npm run build`

## 6. Once done, perform a quality check and make sure that all natural sentences are translated in all languages (en, fr, es, it, pt, de, nl, cn, jp).

## 7. Tone of Voice Requirements
All translations must reflect Primeshot's brand voice: **professional yet friendly, simple yet premium, playful yet trustworthy**. Think of a talented photographer friend who:
- **Clear**: Short, simple, direct language
- **Premium**: Polished but never stiff
- **Friendly**: Approachable and warm
- **Reassuring**: Builds trust at every step
- **Playful**: Subtle wit, never cheesy

### Key Principles for All Languages:
- **Speak human, not technical**: Avoid AI/ML jargon; use everyday words
- **Outcome over feature**: Emphasize results (confidence, professional image)
- **Respect user's photos**: Treat uploads as personal and valuable
- **Concise always**: Users should grasp value in one glance

## 8. Conventions and Policies
- Use simplified country codes across the project (e.g., `en`, `cn`, `fr`, `es`, `it`, `pt`, `de`, `nl`, `jp`).
- There is no i18n fallback configured; ensure all keys exist in all supported languages.
- Persist user language in DB via `public.user_settings.preferred_language` (same country code). Use RPCs `get_user_language`/`set_user_language`.

## Related Rules
- See @professional-translation-guidelines.md for translation quality
- See @project_structure.mdc for file organization 
- See @i18n.mdc and @translations.mdc for patterns and type-safety 
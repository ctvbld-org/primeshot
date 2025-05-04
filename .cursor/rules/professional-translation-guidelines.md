# Professional Translation Quality Guidelines

## Core Translation Principles

When translating content from English to target languages (French, Spanish, Italian, Portugese, German, Dutch, Chinese, Japanese), adhere to these professional translation principles:

### 1. Accuracy and Meaning Preservation

- Preserve the original meaning, intent, and tone of the source text
- Maintain the same level of formality or informality as the source
- Accurately convey technical information without distortion
- Preserve emphasis, urgency, or persuasive elements from the source text
- Ensure numerical information, measurements, and data remain accurate

### 2. Natural Language Flow

- Create translations that sound natural to native speakers
- Avoid literal word-for-word translations that sound awkward or mechanical
- Follow natural sentence structure and grammar conventions of the target language
- Use idioms and expressions native to the target language when appropriate
- Adjust word order and phrasing to match what would be expected in the target language

### 3. Cultural Appropriateness and Localization

- Adapt content to be culturally relevant and sensitive to the target audience
- Consider cultural connotations of words, colors, symbols, and metaphors
- Adjust examples or references to be culturally appropriate
- Be aware of regional variations within languages (e.g., European vs. Latin American Spanish)
- Consider societal norms, taboos, and sensitivities specific to each culture

### 4. Technical Translation Considerations

- Use industry-standard terminology for AI, photography, and technology terms
- Maintain consistent terminology throughout the translation
- Properly handle specialized vocabulary related to image processing, machine learning, etc.
- Preserve formatting, variables, and placeholder syntax (e.g., `{{name}}`, `{count}`)
- Understand and correctly translate UI/UX terminology

### 5. Contextual Awareness

- Consider the physical context where text appears (buttons, forms, headers, tooltips)
- Account for space constraints in UI elements (some languages expand when translated)
- Understand the user journey and how the text supports user actions
- Ensure calls-to-action maintain their clarity and persuasive impact
- Preserve the relationship between related text elements

## Language-Specific Guidelines

### French (fr)

- Use appropriate formal ("vous") or informal ("tu") address based on context
- Be mindful of gender agreement for nouns and adjectives
- Maintain proper use of French punctuation, including spaces before double punctuation marks
- Consider character expansion (English text can expand 15-30% when translated to French)

### Spanish (es)

- Use appropriate formal ("usted") or informal ("tú") address consistently
- Pay attention to subjunctive mood usage where appropriate
- Consider regional variations if targeting specific Spanish-speaking markets
- Be mindful of gender in language and provide inclusive options where possible

### Italian (it)

- Use appropriate formal ("Lei") or informal ("tu") address based on context
- Pay attention to gender and number agreement throughout texts
- Maintain proper formatting of dates, times, and numbers according to Italian conventions
- Be attentive to false friends between English and Italian

### Dutch (nl)

- Use appropriate formal ("u") or informal ("je/jij") address based on context
- Be aware that Dutch can be more direct and concise than English
- Pay attention to word order differences, especially in subordinate clauses
- Consider separable verbs and their placement in different sentence structures
- Be mindful of false friends between English and Dutch
- Account for text expansion (English text typically expands 10-20% when translated to Dutch)

### Portuguese (pt)

- Specify whether using European Portuguese (pt-PT) or Brazilian Portuguese (pt-BR)
- Use appropriate formal ("você"/"o senhor"/"a senhora") or informal ("tu") address based on context and region
- Pay attention to significant differences in vocabulary and grammar between European and Brazilian Portuguese
- Be mindful of gender agreement for nouns, adjectives, and past participles
- Consider text expansion (English text can expand 15-30% when translated to Portuguese)
- Use the appropriate placement of pronouns, which differs between European and Brazilian Portuguese

### German (de)

- Use appropriate formal ("Sie") or informal ("du") address based on context
- Account for text expansion (English text can expand 20-35% when translated to German)
- Pay attention to compound words and technical terminology
- Maintain proper capitalization rules for nouns
- Consider word order in complex sentences

### Chinese (zh)

- Use Simplified or Traditional Chinese based on target market
- Consider cultural nuances and avoid direct translations of idioms or metaphors
- Be aware that Chinese is often more concise than English
- Pay attention to appropriate level of formality
- Consider how concepts unfamiliar to Chinese culture should be explained

### Japanese (ja)

- Use appropriate levels of formality (keigo) based on context
- Consider character limits as Japanese may be more concise than English
- Be mindful of cultural concepts that may not have direct equivalents
- Pay special attention to politeness levels and honorifics
- Structure sentences according to Japanese grammatical patterns

## Quality Assurance Checklist

Before finalizing translations, verify that they:

- Maintain the same meaning as the source text
- Sound natural to native speakers
- Use correct grammar, spelling, and punctuation
- Preserve all variables and placeholders
- Maintain consistent terminology
- Are culturally appropriate and sensitive
- Follow the technical specifications of the project
- Meet length constraints for UI elements
- Preserve formatting, styles, and emphasis where needed
- Function correctly in context (e.g., as buttons, form labels, error messages)

## Examples of Quality Translations

### Example 1: Button and Action Text

**English Original:**
```json
{
  "buttons": {
    "uploadPhotos": "Upload Photos",
    "startSession": "Start Photo Session",
    "saveChanges": "Save Changes"
  }
}
```

**Quality French Translation:**
```json
{
  "buttons": {
    "uploadPhotos": "Télécharger des photos",
    "startSession": "Démarrer la séance photo",
    "saveChanges": "Enregistrer les modifications"
  }
}
```

### Example 2: Technical Feature Description

**English Original:**
```json
{
  "features": {
    "aiGeneration": "Our AI analyzes your photos to create professional portraits with your likeness.",
    "styleCustomization": "Choose from 20+ photography styles to match your professional needs."
  }
}
```

**Quality Japanese Translation:**
```json
{
  "features": {
    "aiGeneration": "AIがあなたの写真を分析し、あなたに似たプロフェッショナルなポートレートを作成します。",
    "styleCustomization": "20種類以上の写真スタイルから選択して、プロフェッショナルなニーズに合わせることができます。"
  }
}
```

### Example 3: Form Validation Message

**English Original:**
```json
{
  "validation": {
    "minPhotos": "Please upload at least {{count}} photos for best results.",
    "poorQuality": "Some photos don't meet our quality requirements. Try uploading clearer images."
  }
}
```

**Quality German Translation:**
```json
{
  "validation": {
    "minPhotos": "Bitte laden Sie für optimale Ergebnisse mindestens {{count}} Fotos hoch.",
    "poorQuality": "Einige Fotos entsprechen nicht unseren Qualitätsanforderungen. Versuchen Sie, klarere Bilder hochzuladen."
  }
}
```

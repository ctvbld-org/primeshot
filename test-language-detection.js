/**
 * Test script for language detection logic
 * Run with: node test-language-detection.js
 */

const SUPPORTED = ['en','cn','es','fr','pt','de','jp','it','nl'];

function parseAcceptLanguage(header) {
  if (!header) return null;
  
  // Parse Accept-Language header (e.g., "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7")
  const parts = header.split(',').map(s => s.trim());
  
  // Build array of languages with their quality values
  const languages = [];
  
  for (const part of parts) {
    const [tag, qValue] = part.split(';');
    const quality = qValue ? parseFloat(qValue.replace('q=', '')) : 1.0;
    
    if (tag && !isNaN(quality)) {
      languages.push({ lang: tag.trim(), quality });
    }
  }
  
  // Sort by quality (highest first)
  languages.sort((a, b) => b.quality - a.quality);
  
  // Try to find a supported language
  for (const { lang } of languages) {
    const normalized = mapToSupported(lang);
    if (normalized) {
      return normalized;
    }
  }
  
  return null;
}

function mapToSupported(tag) {
  if (!tag) return null;
  const lower = tag.toLowerCase().trim();
  
  // Exact match first (e.g., "fr" -> "fr")
  const exact = SUPPORTED.find(l => l.toLowerCase() === lower);
  if (exact) return exact;
  
  // Map base language to a default region (e.g., "fr-FR" -> "fr")
  const base = lower.split('-')[0];
  switch (base) {
    case 'en': return 'en';
    case 'zh': return 'cn';
    case 'es': return 'es';
    case 'fr': return 'fr';
    case 'pt': return 'pt';
    case 'de': return 'de';
    case 'ja': return 'jp';
    case 'it': return 'it';
    case 'nl': return 'nl';
    default: return null;
  }
}

// Test cases
console.log('🧪 Testing Language Detection\n');

const testCases = [
  { header: 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7', expected: 'fr', desc: 'French OS (typical)' },
  { header: 'fr-FR', expected: 'fr', desc: 'French (simple)' },
  { header: 'fr', expected: 'fr', desc: 'French (bare)' },
  { header: 'en-US,en;q=0.9', expected: 'en', desc: 'English US' },
  { header: 'de-DE,de;q=0.9,en;q=0.8', expected: 'de', desc: 'German' },
  { header: 'es-ES,es;q=0.9', expected: 'es', desc: 'Spanish' },
  { header: 'pt-BR,pt;q=0.9', expected: 'pt', desc: 'Portuguese (Brazil)' },
  { header: 'zh-CN,zh;q=0.9', expected: 'cn', desc: 'Chinese (Simplified)' },
  { header: 'ja-JP,ja;q=0.9', expected: 'jp', desc: 'Japanese' },
  { header: 'it-IT,it;q=0.9', expected: 'it', desc: 'Italian' },
  { header: 'nl-NL,nl;q=0.9', expected: 'nl', desc: 'Dutch' },
  { header: 'ko-KR,ko;q=0.9,en;q=0.8', expected: 'en', desc: 'Korean (fallback to English)' },
  { header: null, expected: null, desc: 'No header' },
  { header: '', expected: null, desc: 'Empty header' },
];

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = parseAcceptLanguage(testCase.header);
  const success = result === testCase.expected;
  
  if (success) {
    passed++;
    console.log(`✅ ${testCase.desc}`);
    console.log(`   Input:    "${testCase.header}"`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Got:      "${result}"\n`);
  } else {
    failed++;
    console.log(`❌ ${testCase.desc}`);
    console.log(`   Input:    "${testCase.header}"`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Got:      "${result}"\n`);
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✨ All tests passed!\n');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed\n');
  process.exit(1);
}


#!/usr/bin/env node

/**
 * Pricing Synchronization Script
 * 
 * This script ensures that pricing constants remain in sync between 
 * the frontend and Supabase Edge Functions.
 * 
 * Usage:
 *   node scripts/sync-pricing.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// File paths
const SOURCE_FILE = path.join(__dirname, '..', 'src', 'lib', 'constants', 'pricing.ts');
const TARGET_FILE = path.join(__dirname, '..', 'supabase', 'functions', '_shared', 'pricing.ts');

// Ensure directories exist
if (!fs.existsSync(path.dirname(TARGET_FILE))) {
  fs.mkdirSync(path.dirname(TARGET_FILE), { recursive: true });
}

// Read source file
console.log(`Reading source file: ${SOURCE_FILE}`);
const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf8');

// Extract pricing version from source
const versionMatch = sourceContent.match(/PRICING_VERSION\s*=\s*['"]([^'"]+)['"]/);
if (!versionMatch) {
  console.error('Could not find PRICING_VERSION in source file');
  process.exit(1);
}
const version = versionMatch[1];

// Prepare target file content
const timestamp = new Date().toISOString();
let targetContent = sourceContent;

// Update import/export statements for Edge Function compatibility
targetContent = targetContent
  // Change the header comment
  .replace(/\/\*\*[\s\S]*?\*\//, `/**
 * PRICING_VERSION: ${version}
 * This is a copy of the frontend/src/lib/constants/pricing.ts file
 * Last synchronized: ${timestamp}
 * 
 * SHARED PRICING CONSTANTS
 * 
 * This file serves as the single source of truth for pricing information
 * across Supabase Edge Functions.
 * 
 * IMPORTANT: When updating pricing, this file should be kept in sync with
 * frontend/src/lib/constants/pricing.ts to maintain consistency.
 */`);

// Rename calculateSimplePrice to calculatePrice for Edge Functions
targetContent = targetContent.replace(
  /export function calculateSimplePrice/g, 
  'export function calculatePrice'
);

// Remove the comment block about copying to Edge Functions
targetContent = targetContent.replace(
  /\/\*\*\s*\n\s*\* Use this comment block.*?\/\s*\*\//s,
  ''
);

// Save the target file
console.log(`Writing target file: ${TARGET_FILE}`);
fs.writeFileSync(TARGET_FILE, targetContent);

// Verify files are in sync (comparing the PRICING object)
const sourceMatch = sourceContent.match(/export const PRICING: PricingConstants = ({[\s\S]*?});/);
const targetMatch = targetContent.match(/export const PRICING: PricingConstants = ({[\s\S]*?});/);

if (!sourceMatch || !targetMatch) {
  console.error('Could not extract PRICING constants for comparison');
} else {
  const sourcePricing = JSON.stringify(eval(`(${sourceMatch[1]})`));
  const targetPricing = JSON.stringify(eval(`(${targetMatch[1]})`));
  
  if (sourcePricing === targetPricing) {
    console.log('✅ Pricing constants are in sync!');
  } else {
    console.error('❌ Pricing constants differ between source and target!');
    process.exit(1);
  }
}

console.log(`Pricing synchronized successfully (version ${version})`);

// Add git staging command suggestion
console.log('\nTo commit these changes:');
console.log('git add src/lib/constants/pricing.ts supabase/functions/_shared/pricing.ts');

// Add deployment suggestion  
console.log('\nRemember to deploy Edge Functions to apply pricing changes:');
console.log('cd frontend && supabase functions deploy update_order_amount'); 
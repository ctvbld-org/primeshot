#!/usr/bin/env node

/**
 * Test script to verify Resend Audience integration
 * 
 * Usage:
 *   node test-resend-audience.js test@example.com
 * 
 * Prerequisites:
 *   - RESEND_API_KEY set in environment
 *   - RESEND_AUDIENCE_ID set in environment
 */

const { Resend } = require('resend');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);
const audienceId = process.env.RESEND_AUDIENCE_ID;

// Get test email from command line args
const testEmail = process.argv[2];

if (!testEmail) {
  console.error('❌ Error: Please provide a test email address');
  console.log('Usage: node test-resend-audience.js test@example.com');
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error('❌ Error: RESEND_API_KEY not found in environment');
  console.log('Make sure you have a .env.local file with RESEND_API_KEY set');
  process.exit(1);
}

if (!audienceId) {
  console.error('❌ Error: RESEND_AUDIENCE_ID not found in environment');
  console.log('Make sure you have a .env.local file with RESEND_AUDIENCE_ID set');
  console.log('See RESEND_SETUP.md for setup instructions');
  process.exit(1);
}

console.log('🧪 Testing Resend Audience Integration\n');
console.log(`📧 Test Email: ${testEmail}`);
console.log(`🎯 Audience ID: ${audienceId}\n`);

async function testAudienceIntegration() {
  try {
    console.log('1️⃣ Adding contact to Resend Audience...');
    
    const result = await resend.contacts.create({
      email: testEmail,
      audienceId: audienceId,
    });

    console.log('✅ Success! Contact added to audience');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    console.log('\n2️⃣ Verifying contact exists...');
    
    // Try to get the contact
    const contact = await resend.contacts.get({
      id: result.data.id,
      audienceId: audienceId,
    });
    
    console.log('✅ Contact verified!');
    console.log('📊 Contact details:', JSON.stringify(contact, null, 2));
    
    console.log('\n✨ Integration test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Check your Resend Dashboard to see the contact');
    console.log('2. Test the waitlist form on your website');
    console.log('3. Monitor logs for "Contact added to Resend Audience" messages');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message?.includes('already exists') || 
        error.message?.includes('Contact already exists')) {
      console.log('\n⚠️  Note: This contact already exists in the audience');
      console.log('This is expected behavior - the integration handles this gracefully');
      console.log('Try with a different email address if you want to test adding a new contact');
    } else {
      console.error('\nFull error:', error);
      console.log('\nTroubleshooting tips:');
      console.log('- Verify your RESEND_API_KEY is valid');
      console.log('- Verify your RESEND_AUDIENCE_ID is correct (should start with "aud_")');
      console.log('- Check that your API key has permissions for audiences and contacts');
      console.log('- See RESEND_SETUP.md for more help');
    }
    
    process.exit(1);
  }
}

testAudienceIntegration();


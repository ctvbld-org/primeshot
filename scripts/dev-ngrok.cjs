// dev-ngrok.js
const ngrok = require('ngrok');
const { execSync } = require('child_process');
const path = require('path');

// Load environment variables from .env file in project root
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
  // dotenv not installed, that's ok - will use system env vars
}

(async function() {
  try {
    // Configuration options for ngrok
    const config = {
      addr: 54321,
      proto: 'http'
    };

    // Configure fixed URL based on your ngrok setup
    if (process.env.NGROK_URL) {
      // Static subdomain (free accounts) - e.g., 'amazed-doberman-worthy.ngrok-free.app'
      config.url = process.env.NGROK_URL;
      console.log(`[ngrok] Using static subdomain: ${process.env.NGROK_URL}`);
    } else if (process.env.NGROK_DOMAIN) {
      // Reserved domain (paid accounts) - e.g., 'myapp.ngrok.io'
      config.domain = process.env.NGROK_DOMAIN;
      console.log(`[ngrok] Using reserved domain: ${process.env.NGROK_DOMAIN}`);
    } else if (process.env.NGROK_HOSTNAME) {
      // Custom hostname (paid accounts) - e.g., 'dev.yourdomain.com'
      config.hostname = process.env.NGROK_HOSTNAME;
      console.log(`[ngrok] Using custom hostname: ${process.env.NGROK_HOSTNAME}`);
    } else {
      console.log('[ngrok] Using dynamic URL (no fixed URL configured)');
    }

    // Optional: Set authtoken if provided
    if (process.env.NGROK_AUTHTOKEN) {
      config.authtoken = process.env.NGROK_AUTHTOKEN;
    }

    const url = await ngrok.connect(config);
    console.log(`\n[ngrok] Tunnel started: ${url}`);
    console.log('[ngrok] Update your Modal env SUPABASE_URL_DEV with this URL.');

    // Try to update Modal env automatically if CLI is available
    try {
      execSync(`modal environment update SUPABASE_URL_DEV ${url}`, { stdio: 'inherit' });
      console.log('[ngrok] Modal env SUPABASE_URL_DEV updated automatically.');
    } catch (e) {
      console.log('[ngrok] Could not update Modal env automatically. Please set SUPABASE_URL_DEV manually.');
    }

    // Keep the tunnel open
    console.log('[ngrok] Tunnel is running. Press Ctrl+C to stop.');
    
  } catch (err) {
    console.error('[ngrok] Failed to start ngrok:', err);
    if (err.message.includes('domain') || err.message.includes('hostname')) {
      console.error('[ngrok] Domain/hostname error. Make sure:');
      console.error('  - You have a paid ngrok account');
      console.error('  - The domain is properly reserved in your ngrok dashboard');
      console.error('  - Your authtoken is set (NGROK_AUTHTOKEN)');
    }
    process.exit(1);
  }
})(); 
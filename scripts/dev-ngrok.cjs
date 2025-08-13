// dev-ngrok.js
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
    // Dynamically import ESM-only @ngrok/ngrok SDK
    const ngrok = (await import('@ngrok/ngrok')).default;

    const forwardOpts = {
      addr: 54321,
      authtoken: process.env.NGROK_AUTHTOKEN,
    };

    const fixedDomain= process.env.NGROK_DOMAIN || 'amazed-doberman-worthy.ngrok-free.app'

    if (fixedDomain) {
      forwardOpts.domain = fixedDomain; // reserved domain
      console.log(`[ngrok] Using reserved domain: ${fixedDomain}`);
    } else {
      console.log('[ngrok] No domain/hostname set – tunnel will be dynamic each run.');
    }

    const listener = await ngrok.forward(forwardOpts);
    const url = listener.url();
    console.log(`\n[ngrok] Tunnel started: ${url}`);

    // Keep the tunnel open
    console.log('[ngrok] Tunnel is running. Press Ctrl+C to stop.');
    // Keep the process alive
    process.stdin.resume();
    
  } catch (err) {
    console.error('[ngrok] Failed to start ngrok:', err);
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('domain') || msg.includes('hostname')) {
      console.error('[ngrok] Domain/hostname error. Make sure:');
      console.error('  - You have a paid ngrok account');
      console.error('  - The domain is properly reserved in your ngrok dashboard');
      console.error('  - Your authtoken is set (NGROK_AUTHTOKEN)');
    }
    process.exit(1);
  }
})();
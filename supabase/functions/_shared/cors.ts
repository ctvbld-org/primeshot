// CORS headers for Edge Functions
export function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '';
  
  // Check if origin is allowed
  const isAllowed = isOriginAllowed(origin);
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://primeshot.ai',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// Check if origin is allowed (primeshot.ai domain and all subdomains + localhost)
function isOriginAllowed(origin: string): boolean {
  // Allow localhost for development (any port)
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
    return true;
  }
  
  // Allow primeshot.ai and all its subdomains
  if (origin === 'https://primeshot.ai' || origin.endsWith('.primeshot.ai')) {
    // Ensure it's HTTPS for security
    return origin.startsWith('https://');
  }
  
  return false;
}

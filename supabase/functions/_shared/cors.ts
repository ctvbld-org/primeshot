// CORS headers for Edge Functions
export function getCorsHeaders(request: Request) {
  const origin = request.headers.get('Origin') || '';
  
  // Check if origin is allowed
  const isAllowed = isOriginAllowed(origin);
  
  const headers: Record<string, string> = {
    // For credentials requests, the value must be the specific origin (not *)
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://primeshot.ai',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey, x-requested-with, accept',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Vary': 'Origin',
  };

  // Required by Chrome for private network requests from secure contexts to local addresses
  if (isAllowed && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
    headers['Access-Control-Allow-Private-Network'] = 'true';
  }

  return headers;
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

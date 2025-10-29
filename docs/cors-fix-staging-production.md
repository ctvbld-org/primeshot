# CORS Fix for Staging and Production

## Problem
The webapp API was blocking requests from the frontend due to missing CORS (Cross-Origin Resource Sharing) headers. This occurred because:

1. The frontend and API are on different domains
2. CORS headers were only configured for development (`localhost`)
3. Staging and production environments had no explicit CORS configuration

## Environment Domains

### Staging
- **Frontend:** `https://staging.primeshot.ai`
- **API:** `https://staging-webapp.primeshot.ai`

### Production
- **Frontend:** `https://primeshot.ai` and `https://www.primeshot.ai`
- **API:** `https://primeshot-webapp.vercel.app`

### Development
- **Frontend:** `http://localhost:4000` (website), `http://localhost:3001` (webapp)
- **API:** `http://localhost:3000` or `http://localhost:3001`

## Solution

### 1. Updated `webapp/src/lib/security-middleware.ts`

Modified the `getAllowedOrigins()` function to explicitly allow cross-origin requests between frontend and API domains for each environment:

```typescript
function getAllowedOrigins(request: NextRequest, overrides?: string[]): string[] {
  // ... existing code ...

  // Production/Staging environment - allow cross-origin requests from frontend domains
  const allowedOrigins = [currentOrigin];

  // Staging environment
  if (url.host === 'staging-webapp.primeshot.ai') {
    allowedOrigins.push('https://staging.primeshot.ai');
  }

  // Production environment
  if (url.host === 'primeshot-webapp.vercel.app' || url.host.includes('primeshot-webapp')) {
    allowedOrigins.push('https://primeshot.ai');
    allowedOrigins.push('https://www.primeshot.ai');
  }

  // Also allow if request is FROM the frontend to the API
  if (url.host === 'staging.primeshot.ai') {
    allowedOrigins.push('https://staging-webapp.primeshot.ai');
  }
  
  if (url.host === 'primeshot.ai' || url.host === 'www.primeshot.ai') {
    allowedOrigins.push('https://primeshot-webapp.vercel.app');
  }

  return allowedOrigins;
}
```

### 2. Cleaned Up `webapp/src/app/api/payment/subscription-checkout/route.ts`

Removed hardcoded CORS headers that were:
- Only working in development
- Redundant with the centralized security middleware
- Not handling staging/production environments

The route now relies entirely on the security middleware's CORS handling via `createSecuredHandler()`.

### 3. How It Works

All API routes use the `createSecuredHandler()` wrapper with security presets:

```typescript
const securedPOST = createSecuredHandler(
  handlePOST,
  SECURITY_PRESETS.PAYMENT_OPERATION
);

export async function POST(request: NextRequest) {
  return await securedPOST(request);
}
```

The security middleware:
1. Automatically handles preflight OPTIONS requests
2. Checks the request's `Origin` header
3. Dynamically determines allowed origins based on the API's hostname
4. Sets appropriate CORS headers on all responses:
   - `Access-Control-Allow-Origin`
   - `Access-Control-Allow-Methods`
   - `Access-Control-Allow-Headers`
   - `Access-Control-Allow-Credentials`

## Testing

### Staging
1. Navigate to `https://staging.primeshot.ai`
2. Sign in and navigate to any page that makes API calls (e.g., pricing, payment, subscription)
3. Open browser DevTools → Network tab
4. Look for API requests to `staging-webapp.primeshot.ai`
5. Verify no CORS errors appear in the console
6. Check response headers include:
   - `Access-Control-Allow-Origin: https://staging.primeshot.ai`
   - `Access-Control-Allow-Credentials: true`

### Production
1. Navigate to `https://primeshot.ai`
2. Follow the same steps as staging
3. Verify API requests to `primeshot-webapp.vercel.app` work without CORS errors
4. Check response headers include:
   - `Access-Control-Allow-Origin: https://primeshot.ai`

### Development
1. Run the website locally: `npm run dev` (typically port 4000)
2. Run the webapp locally: `npm run dev` (typically port 3000 or 3001)
3. Navigate between local instances
4. Verify localhost CORS still works

## Routes Affected

All API routes now have proper CORS handling, including:
- `/api/subscription/*` - All subscription management endpoints
- `/api/payment/*` - Payment and checkout endpoints
- `/api/pricing/*` - Pricing information endpoints
- `/api/credits/*` - Credit balance and transactions
- `/api/inference/*` - AI generation endpoints
- All other authenticated API routes

## Security Considerations

The CORS implementation:
- ✅ Only allows specific, trusted origins (no wildcard `*`)
- ✅ Requires credentials for authenticated requests
- ✅ Handles preflight OPTIONS requests correctly
- ✅ Works with the existing authentication and rate limiting
- ✅ Maintains security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- ✅ Is environment-aware (development vs staging vs production)

## Deployment Notes

No environment variables need to be set - the CORS configuration is automatic based on the hostname. However, ensure these environment variables are set correctly:

- `NEXT_PUBLIC_APP_URL` - Your frontend URL (for redirects, not CORS)
- `NEXT_PUBLIC_WEBSITE_URL` - Your marketing website URL (for reference)

## Future Enhancements

If you need to add new domains (e.g., a new staging environment), update the `getAllowedOrigins()` function in `webapp/src/lib/security-middleware.ts`.

Example:
```typescript
// New staging environment
if (url.host === 'dev-webapp.primeshot.ai') {
  allowedOrigins.push('https://dev.primeshot.ai');
}
```


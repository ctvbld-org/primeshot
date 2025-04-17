# Stripe Webhook Security Setup Guide

This guide explains how to properly set up and secure your Stripe webhooks to ensure payment events are properly verified and processed securely.

## Why Webhook Signature Verification Is Critical

Webhook endpoints are public URLs that receive data from Stripe. Without proper verification:
- Anyone could send fake payment events to your system
- Attackers could trigger order fulfillment without paying
- Sensitive customer data could be compromised

Stripe's webhook signature verification ensures that webhook events genuinely come from Stripe and haven't been tampered with.

## Environment Setup

1. Add the webhook secret to your environment variables:

```bash
# In your .env.local file
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
```

2. How to obtain your webhook secret:

   a. **Using the Stripe Dashboard:**
      - Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
      - Create a new endpoint with URL: `https://your-domain.com/api/payment/webhook`
      - After creating, reveal and copy the "Signing Secret"

   b. **Using the Stripe CLI (for local development):**
      ```bash
      # Install Stripe CLI from https://stripe.com/docs/stripe-cli
      stripe login
      stripe listen --forward-to http://localhost:3000/api/payment/webhook
      ```
      The CLI will display a webhook signing secret - copy this value to your `.env.local` file.

## Implementation Details

Our webhook handler implementation (`frontend/src/app/api/payment/webhook/route.ts`) includes these security features:

1. **Raw Body Access**: The webhook handler accesses the raw request body for verification
2. **Signature Extraction**: We extract the `stripe-signature` header from incoming requests
3. **Verification**: We use Stripe's SDK to verify the signature matches the expected value
4. **Error Handling**: Failed verification returns 401 Unauthorized responses
5. **Logging**: Verification attempts and their results are logged for monitoring

## Testing Webhook Security

1. Using the Stripe CLI for local testing:

```bash
# Forward events to your local webhook handler
stripe listen --forward-to http://localhost:3000/api/payment/webhook

# In another terminal, trigger test events
stripe trigger payment_intent.succeeded
```

2. Verify signature failures by sending an invalid signature:

```bash
curl -X POST http://localhost:3000/api/payment/webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: invalid_signature" \
  -d '{"type":"payment_intent.succeeded"}'
```

This should return a 401 Unauthorized response.

## Common Issues and Troubleshooting

1. **"No signatures found" Error**:
   - Check that your webhook endpoint is configured to receive the raw body
   - Ensure `stripe-signature` header is being passed correctly

2. **"No webhook secret provided" Error**:
   - Verify environment variables are properly loaded
   - Check for typos in your .env file

3. **"Signature timestamp outside tolerance zone" Error**:
   - This happens when there's a time drift between Stripe's servers and yours
   - Ensure your server's time is synchronized

4. **"Signature verification failed" Error**:
   - Double-check your webhook secret
   - Ensure you're using the correct secret for the environment (test/live)

## Security Best Practices

1. **Never log the full webhook payload** - it may contain sensitive information
2. **Store webhook secrets securely** - use environment variables, never hardcode them
3. **Set appropriate tolerance durations** - default is 5 minutes
4. **Implement idempotency** - handle duplicate events gracefully
5. **Respond with 200 status codes** even for events you don't process
6. **Monitor for verification failures** - they may indicate attack attempts

## Verification Checklist

- [ ] STRIPE_WEBHOOK_SECRET is set in the environment
- [ ] The webhook endpoint is properly configured in Stripe Dashboard
- [ ] Signature verification is implemented in the webhook handler
- [ ] Testing confirms valid signatures are accepted
- [ ] Testing confirms invalid signatures are rejected
- [ ] Monitoring is in place for verification failures

By following these steps, your payment webhook system will be properly secured against unauthorized or fraudulent requests. 
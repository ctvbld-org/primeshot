# Payment System Testing Guide

This guide will help you test the payment system implementation. Follow these steps to ensure everything works as expected.

## Prerequisites

1. Set up the Stripe environment:
   - Create a Stripe account if you don't have one at [stripe.com](https://stripe.com)
   - Get your API keys from the Stripe Dashboard > Developers > API keys
   - Add the following to your `.env.local` file:
     ```
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY
     STRIPE_SECRET_KEY=sk_test_YOUR_KEY
     ```

2. Set up Stripe CLI for webhook testing:
   - Install Stripe CLI: [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli)
   - Run `stripe login` to authenticate
   - Start forwarding events: `stripe listen --forward-to http://localhost:3000/api/payment/webhook`
   - Copy the webhook signing secret and add to `.env.local`:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY
     ```

3. Start the development server:
   ```
   npm run dev
   ```

## Test Flow

### 1. Style Creation and Draft Order

1. **Create styles**:
   - Navigate to `/app/shoot`
   - Create at least one style (e.g., "Professional", "Casual")
   - **Expected result**: Styles are created and saved in the database

2. **Verify draft order creation**:
   - In your database, check that a draft order has been created
   - Verify the order amount is calculated correctly based on the number of styles:
     - 1 style: $29.00 (Individual Tier)
     - 2-3 styles: $49.00 (Professional Tier)
     - 4-6 styles: $79.00 (Studio Tier)
     - 7+ styles: $79.00 + $15.00 per style over 6 (Studio Tier + add-ons)

### 2. Payment Page

1. **Access payment page**:
   - Navigate to `/app/payment`
   - **Expected result**: The page loads with your styles and pricing information

2. **Check pricing display**:
   - Verify the package tier is displayed correctly
   - Verify the total headshots count is accurate
   - Verify the price matches the expected amount

3. **Continue to payment**:
   - Click "Continue to Payment"
   - **Expected result**: The Stripe Elements form loads

### 3. Payment Process

1. **Enter test card information**:
   - Card number: `4242 4242 4242 4242` (successful payment)
   - Expiration: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

2. **Submit payment**:
   - Click "Pay Now"
   - **Expected result**: Processing state appears

3. **Successful payment**:
   - **Expected result**: Redirect to success page
   - Verify order status has been updated to "paid"
   - Verify styles have been updated to "processing"

### 4. Webhook Testing

1. **Trigger test events**:
   - With Stripe CLI running, use the following to test webhooks:
     ```
     stripe trigger payment_intent.succeeded
     ```

2. **Verify webhook handling**:
   - Check order and style statuses have been updated
   - Verify user progress has been updated to mark payment as completed

### 5. Error Handling

1. **Test declined payment**:
   - Card number: `4000 0000 0000 0002` (generic decline)
   - **Expected result**: Error message appears

2. **Test 3D Secure authentication**:
   - Card number: `4000 0000 0000 3220` (3D Secure 2 authentication required)
   - **Expected result**: 3D Secure modal appears, authentication succeeds

3. **Test network errors**:
   - Temporarily disable your internet connection
   - Try to make a payment
   - **Expected result**: Error message appears when network fails

## Test Cards

Stripe provides several test cards for different scenarios:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 0002 | Generic decline |
| 4000 0000 0000 9995 | Insufficient funds decline |
| 4000 0000 0000 3220 | 3D Secure 2 authentication required |
| 4000 0025 0000 3155 | 3D Secure 2 authentication required (challenge flow) |

## Debugging Tips

1. Check Stripe Dashboard for payment attempts
2. Check browser console for errors
3. Check server logs for webhook events
4. Make sure all environment variables are set correctly

## Verification Checklist

- [ ] Styles are created and linked to orders
- [ ] Draft order is created with correct pricing
- [ ] Payment page displays correct pricing information
- [ ] Stripe Elements form loads properly
- [ ] Successful payments update order status
- [ ] Failed payments show appropriate errors
- [ ] Webhooks update order and style status
- [ ] User progress is updated after payment

## Known Issues

- If you encounter "Payment Intent Secret Not Found" error, check that your Stripe API keys are correct
- If webhooks are not working, verify the webhook secret and ensure the Stripe CLI is running 
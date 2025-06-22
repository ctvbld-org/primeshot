# System Patterns

## System Architecture

The system follows a modern full-stack architecture with:

- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Supabase for database, authentication, and edge functions
- **AI Components**: Modal containers for training and inference
- **State Management**: Zustand for client-side state
- **UI Components**: Radix UI with custom styling



**Auto-update 2025-06-19**:
Detected changes in:
- frontend/src/app/api/app-images/route.ts
- frontend/src/app/api/payment/create-checkout-session/route.ts
- frontend/src/app/api/payment/webhook/route.ts
- frontend/src/app/api/proxy/update-order-amount/route.ts
- frontend/src/app/api/styles/route.ts
- frontend/src/app/api/upload-chunk/route.ts
- frontend/src/app/api/user-images/route.ts
- frontend/src/app/app/albums/page.tsx
- frontend/src/app/app/layout.tsx
- frontend/src/app/app/page.tsx
- frontend/src/app/app/payment/error/page.tsx
- frontend/src/app/app/review/page.module.css
- frontend/src/app/app/review/page.tsx
- frontend/src/app/app/settings/page.tsx
- frontend/src/app/app/settings/profile/page.module.css
- frontend/src/app/app/settings/profile/page.tsx
- frontend/src/app/app/settings/settings-content.tsx
- frontend/src/app/app/settings/settings-form.tsx
- frontend/src/app/app/shoot/page.module.css
- frontend/src/app/app/shoot/page.tsx
- frontend/src/app/app/styles/page.module.css
- frontend/src/app/app/styles/page.tsx
- frontend/src/app/app/upload/page.tsx
- frontend/src/app/auth/auth-code-error/page.tsx
- frontend/src/app/auth/callback/route.ts
- frontend/src/app/auth/signin/page.tsx
- frontend/src/app/auth/signin/signin.module.css
- frontend/src/app/auth/signout/route.ts
- frontend/src/app/auth/verify/page.tsx
- frontend/src/app/auth/verify/verify.module.css
- frontend/src/app/favicon.ico
- frontend/src/app/globals.css
- frontend/src/app/layout.tsx
- frontend/src/app/page.tsx
- frontend/src/components/animations/TiltCard.tsx
- frontend/src/components/app-header.module.css
- frontend/src/components/app-header.tsx
- frontend/src/components/auth/animated-background.module.css
- frontend/src/components/auth/animated-background.tsx
- frontend/src/components/auth/auth-guard.tsx
- frontend/src/components/icons/icon.tsx
- frontend/src/components/language-switcher.tsx
- frontend/src/components/providers/query-provider.tsx
- frontend/src/components/providers/supabase-provider.tsx
- frontend/src/components/review/form-field.module.css
- frontend/src/components/review/form-field.tsx
- frontend/src/components/review/profile-form.module.css
- frontend/src/components/review/profile-form.tsx
- frontend/src/components/review/review-footer.module.css
- frontend/src/components/review/review-footer.tsx
- frontend/src/components/review/shoot-summary.module.css
- frontend/src/components/review/shoot-summary.tsx
- frontend/src/components/shoot/shoot-footer.module.css
- frontend/src/components/shoot/shoot-footer.tsx
- frontend/src/components/skeleton/upload/page.tsx
- frontend/src/components/skeleton/upload/requirements.module.css
- frontend/src/components/skeleton/upload/requirements.tsx
- frontend/src/components/style/background-image-selector.tsx
- frontend/src/components/style/clothing-color-selector.module.css
- frontend/src/components/style/clothing-color-selector.tsx
- frontend/src/components/style/clothing-image-selector.tsx
- frontend/src/components/style/flip-card.tsx
- frontend/src/components/style/new-style-card.module.css
- frontend/src/components/style/new-style-card.tsx
- frontend/src/components/style/options-carousel.module.css
- frontend/src/components/style/options-carousel.tsx
- frontend/src/components/style/style-card.module.css
- frontend/src/components/style/style-card.tsx
- frontend/src/components/style/style-details.module.css
- frontend/src/components/style/style-details.tsx
- frontend/src/components/style/style-tabs-options.module.css
- frontend/src/components/style/style-tabs-options.tsx
- frontend/src/components/ui/accordion.tsx
- frontend/src/components/ui/alert-dialog.tsx
- frontend/src/components/ui/alert.tsx
- frontend/src/components/ui/aspect-ratio.tsx
- frontend/src/components/ui/avatar.module.css
- frontend/src/components/ui/avatar.tsx
- frontend/src/components/ui/badge.tsx
- frontend/src/components/ui/banner.tsx
- frontend/src/components/ui/button.module.css
- frontend/src/components/ui/button.tsx
- frontend/src/components/ui/card.tsx
- frontend/src/components/ui/carousel.tsx
- frontend/src/components/ui/checkbox.tsx
- frontend/src/components/ui/command.tsx
- frontend/src/components/ui/dialog.module.css
- frontend/src/components/ui/dialog.tsx
- frontend/src/components/ui/dropdown-menu.tsx
- frontend/src/components/ui/form.tsx
- frontend/src/components/ui/input.module.css
- frontend/src/components/ui/input.tsx
- frontend/src/components/ui/loader.tsx
- frontend/src/components/ui/loading-content.tsx
- frontend/src/components/ui/popover.tsx
- frontend/src/components/ui/progress.tsx
- frontend/src/components/ui/radio-group.tsx
- frontend/src/components/ui/scroll-area.tsx
- frontend/src/components/ui/select.module.css
- frontend/src/components/ui/select.tsx
- frontend/src/components/ui/separator.tsx
- frontend/src/components/ui/sheet.tsx
- frontend/src/components/ui/skeleton.tsx
- frontend/src/components/ui/table.tsx
- frontend/src/components/ui/tabs.tsx
- frontend/src/components/ui/textarea.tsx
- frontend/src/components/ui/toast.module.css
- frontend/src/components/ui/toast.tsx
- frontend/src/components/ui/toaster.tsx
- frontend/src/components/ui/tooltip.tsx
- frontend/src/components/ui/top-banner.module.css
- frontend/src/components/ui/top-banner.tsx
- frontend/src/components/ui/use-banner.tsx
- frontend/src/components/ui/use-toast.ts
- frontend/src/components/upload/file-uploader.module.css
- frontend/src/components/upload/file-uploader.tsx
- frontend/src/components/upload/image-quality-score.module.css
- frontend/src/components/upload/image-quality-score.tsx
- frontend/src/components/upload/image-tooltip.module.css
- frontend/src/components/upload/image-tooltip.tsx
- frontend/src/components/upload/rejected-images-dialog.module.css
- frontend/src/components/upload/rejected-images-dialog.tsx
- frontend/src/components/upload/upload-footer.module.css
- frontend/src/components/upload/upload-footer.tsx
- frontend/src/components/upload/upload-requirements.module.css
- frontend/src/components/upload/upload-requirements.tsx
- frontend/src/components/user-nav.tsx
- frontend/src/contexts/auth-context.tsx
- frontend/src/contexts/carousel-context.tsx
- frontend/src/contexts/language-context.tsx
- frontend/src/lib/api/config.ts
- frontend/src/lib/api/orders.ts
- frontend/src/lib/api/progress.ts
- frontend/src/lib/api/styles.ts
- frontend/src/lib/cloudfront.ts
- frontend/src/lib/constants/api.ts
- frontend/src/lib/constants/pricing.ts
- frontend/src/lib/constants/upload.ts
- frontend/src/lib/events/payment.ts
- frontend/src/lib/hooks/use-file-upload.ts
- frontend/src/lib/hooks/use-gender-filter.ts
- frontend/src/lib/hooks/use-images-loaded.ts
- frontend/src/lib/hooks/use-order-images.ts
- frontend/src/lib/hooks/use-order.ts
- frontend/src/lib/hooks/use-page-ready.ts
- frontend/src/lib/hooks/use-payment-recovery.ts
- frontend/src/lib/hooks/use-user-gender.ts
- frontend/src/lib/hooks/use-user-profile.ts
- frontend/src/lib/hooks/use-user-progress.ts
- frontend/src/lib/hooks/use-window-size.ts
- frontend/src/lib/image-quality.ts
- frontend/src/lib/logger.ts
- frontend/src/lib/pricing.ts
- frontend/src/lib/s3.ts
- frontend/src/lib/schemas.ts
- frontend/src/lib/server/hash-verification.ts
- frontend/src/lib/server/idempotency.ts
- frontend/src/lib/server/price-verification.ts
- frontend/src/lib/stripe.ts
- frontend/src/lib/supabase/client.ts
- frontend/src/lib/supabase/middleware.ts
- frontend/src/lib/types.ts
- frontend/src/lib/upload-utils.ts
- frontend/src/lib/utils.ts
- frontend/src/lib/utils/auth.ts
- frontend/src/lib/utils/get-options-image.ts
- frontend/src/lib/utils/get-styles-images.ts
- frontend/src/lib/utils/style-validation.ts
## Component Organization

Components are organized by feature and reusability:
- `src/app/` - Next.js app router pages
- `src/components/` - Reusable UI components
- `src/contexts/` - React context providers
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and configurations

## Key Design Patterns

- **Server-Side Rendering**: Using Next.js app router
- **Type Safety**: TypeScript throughout with generated Supabase types
- **Authentication**: Supabase Auth with middleware protection
- **Image Processing**: AI-powered headshot generation pipeline
- **Payment Processing**: Stripe integration for subscriptions

## Data Flow

1. User uploads photos
2. AI training process initiated via Modal
3. Style generation and processing
4. Review and payment flow
5. Final album delivery

**Auto-update 2025-01-19**:
Initial system patterns documentation created for Memory Bank script compatibility. 
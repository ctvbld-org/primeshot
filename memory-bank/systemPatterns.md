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


**Auto-update 2025-06-23**:
Detected changes in:
- frontend/src/app/api/cleanup-orphaned-uploads/route.ts
- frontend/src/app/api/cleanup-upload/route.ts
- frontend/src/app/api/upload-chunk/route.ts
- frontend/src/app/app/training/page.tsx
- frontend/src/app/app/upload/page.tsx
- frontend/src/app/favicon.ico
- frontend/src/components/training/index.ts
- frontend/src/components/training/training-progress-card.tsx
- frontend/src/components/training/training-progress-list.tsx
- frontend/src/components/upload/file-uploader.tsx
- frontend/src/contexts/realtime-context.tsx
- frontend/src/lib/api/face-models.ts
- frontend/src/lib/api/jobs.ts
- frontend/src/lib/hooks/use-face-model-images.ts
- frontend/src/lib/hooks/use-face-model.ts
- frontend/src/lib/hooks/use-file-upload.ts
- frontend/src/lib/hooks/use-user-progress.ts
- frontend/src/lib/s3.ts
- frontend/src/lib/schemas.ts
- frontend/src/lib/server/hash-verification.ts
- frontend/src/lib/types.ts
- frontend/src/lib/upload-utils.ts


**Auto-update 2025-06-25**:
Detected changes in:
- frontend/src/app/api/user-images/route.ts
- frontend/src/app/app/training/page.tsx
- frontend/src/app/globals.css
- frontend/src/components/create/countdown.tsx
- frontend/src/components/create/face_models.tsx
- frontend/src/components/create/progress_tracker.tsx
- frontend/src/components/training/training-progress-card.tsx
- frontend/src/components/training/training-progress-list.tsx
- frontend/src/components/ui/circle-progress.tsx


**Auto-update 2025-06-26**:
Detected changes in:
- frontend/src/app/app/page.tsx
- frontend/src/app/page.tsx
- frontend/src/components/training/index.ts
- frontend/src/lib/api/jobs.ts
- webapp/src/app/api/app-images/route.ts
- webapp/src/app/api/cleanup-orphaned-uploads/route.ts
- webapp/src/app/api/cleanup-upload/route.ts
- webapp/src/app/api/payment/create-checkout-session/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/proxy/update-order-amount/route.ts
- webapp/src/app/api/styles/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/app/api/user-images/route.ts
- webapp/src/app/app/albums/page.tsx
- webapp/src/app/app/layout.tsx
- webapp/src/app/app/page.tsx
- webapp/src/app/app/payment/error/page.tsx
- webapp/src/app/app/review/page.module.css
- webapp/src/app/app/review/page.tsx
- webapp/src/app/app/settings/page.tsx
- webapp/src/app/app/settings/profile/page.module.css
- webapp/src/app/app/settings/profile/page.tsx
- webapp/src/app/app/settings/settings-content.tsx
- webapp/src/app/app/settings/settings-form.tsx
- webapp/src/app/app/shoot/page.module.css
- webapp/src/app/app/shoot/page.tsx
- webapp/src/app/app/styles/page.module.css
- webapp/src/app/app/styles/page.tsx
- webapp/src/app/app/training/page.tsx
- webapp/src/app/app/upload/page.tsx
- webapp/src/app/auth/auth-code-error/page.tsx
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/auth/signin/google/route.ts
- webapp/src/app/auth/signin/page.tsx
- webapp/src/app/auth/signin/signin.module.css
- webapp/src/app/auth/signout/route.ts
- webapp/src/app/auth/verify/page.tsx
- webapp/src/app/auth/verify/verify.module.css
- webapp/src/app/favicon.ico
- webapp/src/app/globals.css
- webapp/src/app/layout.tsx
- webapp/src/app/page.tsx
- webapp/src/components/animations/TiltCard.tsx
- webapp/src/components/app-header.module.css
- webapp/src/components/app-header.tsx
- webapp/src/components/auth/animated-background.module.css
- webapp/src/components/auth/animated-background.tsx
- webapp/src/components/auth/auth-guard.tsx
- webapp/src/components/create/countdown.tsx
- webapp/src/components/create/face_models.tsx
- webapp/src/components/create/progress_tracker.tsx
- webapp/src/components/home/FloatingOptionButtons.tsx
- webapp/src/components/home/GalleryPlaceholder.tsx
- webapp/src/components/home/GenerationControls.tsx
- webapp/src/components/home/StylesCarousel.tsx
- webapp/src/components/home/floating-options.tsx
- webapp/src/components/home/styles-carousel.tsx
- webapp/src/components/icons/icon.tsx
- webapp/src/components/language-switcher.tsx
- webapp/src/components/providers/query-provider.tsx
- webapp/src/components/providers/supabase-provider.tsx
- webapp/src/components/review/form-field.module.css
- webapp/src/components/review/form-field.tsx
- webapp/src/components/review/profile-form.module.css
- webapp/src/components/review/profile-form.tsx
- webapp/src/components/review/review-footer.module.css
- webapp/src/components/review/review-footer.tsx
- webapp/src/components/review/shoot-summary.module.css
- webapp/src/components/review/shoot-summary.tsx
- webapp/src/components/shoot/shoot-footer.module.css
- webapp/src/components/shoot/shoot-footer.tsx
- webapp/src/components/skeleton/upload/page.tsx
- webapp/src/components/skeleton/upload/requirements.module.css
- webapp/src/components/skeleton/upload/requirements.tsx
- webapp/src/components/style/background-image-selector.tsx
- webapp/src/components/style/clothing-color-selector.module.css
- webapp/src/components/style/clothing-color-selector.tsx
- webapp/src/components/style/clothing-image-selector.tsx
- webapp/src/components/style/flip-card.tsx
- webapp/src/components/style/new-style-card.module.css
- webapp/src/components/style/new-style-card.tsx
- webapp/src/components/style/options-carousel.module.css
- webapp/src/components/style/options-carousel.tsx
- webapp/src/components/style/style-card.module.css
- webapp/src/components/style/style-card.tsx
- webapp/src/components/style/style-details.module.css
- webapp/src/components/style/style-details.tsx
- webapp/src/components/style/style-tabs-options.module.css
- webapp/src/components/style/style-tabs-options.tsx
- webapp/src/components/ui/accordion.tsx
- webapp/src/components/ui/alert-dialog.tsx
- webapp/src/components/ui/alert.tsx
- webapp/src/components/ui/aspect-ratio.tsx
- webapp/src/components/ui/avatar.module.css
- webapp/src/components/ui/avatar.tsx
- webapp/src/components/ui/badge.tsx
- webapp/src/components/ui/banner.tsx
- webapp/src/components/ui/button.module.css
- webapp/src/components/ui/button.tsx
- webapp/src/components/ui/card.tsx
- webapp/src/components/ui/carousel.tsx
- webapp/src/components/ui/checkbox.tsx
- webapp/src/components/ui/circle-progress.tsx
- webapp/src/components/ui/command.tsx
- webapp/src/components/ui/dialog.module.css
- webapp/src/components/ui/dialog.tsx
- webapp/src/components/ui/dropdown-menu.tsx
- webapp/src/components/ui/form.tsx
- webapp/src/components/ui/icons.tsx
- webapp/src/components/ui/input.module.css
- webapp/src/components/ui/input.tsx
- webapp/src/components/ui/label.tsx
- webapp/src/components/ui/loader.tsx
- webapp/src/components/ui/loading-content.tsx
- webapp/src/components/ui/popover.tsx
- webapp/src/components/ui/progress.tsx
- webapp/src/components/ui/radio-group.tsx
- webapp/src/components/ui/scroll-area.tsx
- webapp/src/components/ui/select.module.css
- webapp/src/components/ui/select.tsx
- webapp/src/components/ui/separator.tsx
- webapp/src/components/ui/sheet.tsx
- webapp/src/components/ui/skeleton.tsx
- webapp/src/components/ui/table.tsx
- webapp/src/components/ui/tabs.tsx
- webapp/src/components/ui/textarea.tsx
- webapp/src/components/ui/toast.module.css
- webapp/src/components/ui/toast.tsx
- webapp/src/components/ui/toaster.tsx
- webapp/src/components/ui/tooltip.tsx
- webapp/src/components/ui/top-banner.module.css
- webapp/src/components/ui/top-banner.tsx
- webapp/src/components/ui/use-banner.tsx
- webapp/src/components/ui/use-toast.ts
- webapp/src/components/upload/file-uploader.module.css
- webapp/src/components/upload/file-uploader.tsx
- webapp/src/components/upload/image-quality-score.module.css
- webapp/src/components/upload/image-quality-score.tsx
- webapp/src/components/upload/image-tooltip.module.css
- webapp/src/components/upload/image-tooltip.tsx
- webapp/src/components/upload/rejected-images-dialog.module.css
- webapp/src/components/upload/rejected-images-dialog.tsx
- webapp/src/components/upload/upload-footer.module.css
- webapp/src/components/upload/upload-footer.tsx
- webapp/src/components/upload/upload-requirements.module.css
- webapp/src/components/upload/upload-requirements.tsx
- webapp/src/components/user-nav.tsx
- webapp/src/contexts/auth-context.tsx
- webapp/src/contexts/carousel-context.tsx
- webapp/src/contexts/language-context.tsx
- webapp/src/contexts/realtime-context.tsx
- webapp/src/lib/api/config.ts
- webapp/src/lib/api/face-models.ts
- webapp/src/lib/api/jobs.ts
- webapp/src/lib/api/orders.ts
- webapp/src/lib/api/progress.ts
- webapp/src/lib/api/styles.ts
- webapp/src/lib/cloudfront.ts
- webapp/src/lib/constants/api.ts
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/constants/upload.ts
- webapp/src/lib/events/payment.ts
- webapp/src/lib/hooks/use-face-model-images.ts
- webapp/src/lib/hooks/use-face-model.ts
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/hooks/use-gender-filter.ts
- webapp/src/lib/hooks/use-images-loaded.ts
- webapp/src/lib/hooks/use-order-images.ts
- webapp/src/lib/hooks/use-order.ts
- webapp/src/lib/hooks/use-page-ready.ts
- webapp/src/lib/hooks/use-payment-recovery.ts
- webapp/src/lib/hooks/use-user-gender.ts
- webapp/src/lib/hooks/use-user-profile.ts
- webapp/src/lib/hooks/use-user-progress.ts
- webapp/src/lib/hooks/use-window-size.ts
- webapp/src/lib/image-quality.ts
- webapp/src/lib/logger.ts
- webapp/src/lib/pricing.ts
- webapp/src/lib/s3.ts
- webapp/src/lib/schemas.ts
- webapp/src/lib/server/hash-verification.ts
- webapp/src/lib/server/idempotency.ts
- webapp/src/lib/server/price-verification.ts
- webapp/src/lib/stripe.ts
- webapp/src/lib/supabase/client.ts
- webapp/src/lib/supabase/middleware.ts
- webapp/src/lib/supabase/server.ts
- webapp/src/lib/types.ts
- webapp/src/lib/upload-utils.ts
- webapp/src/lib/utils.ts
- webapp/src/lib/utils/auth.ts
- webapp/src/lib/utils/get-options-image.ts
- webapp/src/lib/utils/get-styles-images.ts
- webapp/src/lib/utils/style-validation.ts
- website/src/app/favicon.ico
- website/src/app/globals.css
- website/src/app/layout.tsx
- website/src/app/page.tsx


**Auto-update 2025-06-27**:
Detected changes in:
- webapp/src/app/app/albums/page.tsx
- webapp/src/app/app/layout.tsx
- webapp/src/app/app/payment/error/page.tsx
- webapp/src/app/app/review/page.tsx
- webapp/src/app/app/settings/profile/page.tsx
- webapp/src/app/app/settings/settings-form.tsx
- webapp/src/app/app/shoot/page.tsx
- webapp/src/app/app/styles/page.tsx
- webapp/src/app/app/training/page.tsx
- webapp/src/app/app/upload/page.tsx
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/auth/signin/google/route.ts
- webapp/src/app/auth/signin/page.tsx
- webapp/src/app/auth/signout/route.ts
- webapp/src/app/auth/verify/page.tsx
- webapp/src/app/layout.tsx
- webapp/src/app/page.tsx
- webapp/src/components/animations/TiltCard.tsx
- webapp/src/components/app-header.tsx
- webapp/src/components/auth/animated-background.tsx
- webapp/src/components/constants/animations.ts
- webapp/src/components/constants/profile-options.ts
- webapp/src/components/create/face_models.tsx
- webapp/src/components/language-switcher.tsx
- webapp/src/components/review/form-field.tsx
- webapp/src/components/review/profile-form.tsx
- webapp/src/components/review/review-footer.tsx
- webapp/src/components/shoot/shoot-footer.tsx
- webapp/src/components/skeleton/upload/page.tsx
- webapp/src/components/skeleton/upload/requirements.tsx
- webapp/src/components/style/clothing-color-selector.tsx
- webapp/src/components/style/new-style-card.tsx
- webapp/src/components/style/style-card.tsx
- webapp/src/components/style/style-details.tsx
- webapp/src/components/style/style-tabs-options.tsx
- webapp/src/components/ui/loading-content.tsx
- webapp/src/components/upload/file-uploader.tsx
- webapp/src/components/upload/image-tooltip.tsx
- webapp/src/components/upload/rejected-images-dialog.tsx
- webapp/src/components/upload/upload-footer.tsx
- webapp/src/components/upload/upload-requirements.tsx
- webapp/src/components/user-nav.tsx
- webapp/src/contexts/auth-context.tsx
- webapp/src/contexts/language-context.tsx
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/hooks/use-order.ts
- webapp/src/lib/hooks/use-payment-recovery.ts
- website/src/app/layout.tsx


**Auto-update 2025-06-28**:
Detected changes in:
- webapp/src/app/api/payment/create-checkout-session/route.ts
- webapp/src/app/layout.tsx
- webapp/src/lib/logger.ts
- website/src/app/api/waitlist/route.ts
- website/src/app/favicon.ico
- website/src/app/globals.css
- website/src/app/layout.tsx
- website/src/app/page.tsx
- website/src/components/SiteHeader.tsx
- website/src/components/SocialIcons.tsx
- website/src/components/WaitlistForm.tsx
- website/src/components/WebGLBackground.tsx
- website/src/components/WebGLImageTransition.tsx
- website/src/lib/supabase.ts


**Auto-update 2025-06-28**:
Detected changes in:
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/auth/signout/route.ts


**Auto-update 2025-07-01**:
Detected changes in:
- webapp/src/app/api/payment/create-checkout-session/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/app/review/page.tsx
- webapp/src/app/app/shoot/page.tsx
- webapp/src/app/app/styles/page.tsx
- webapp/src/app/app/upload/page.tsx
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/page.tsx
- webapp/src/components/constants/animations.ts
- webapp/src/components/home/StylesCarousel.tsx
- webapp/src/components/review/review-footer.tsx
- webapp/src/components/shoot/shoot-footer.tsx
- webapp/src/components/style/style-details.tsx
- webapp/src/lib/api/progress.ts
- webapp/src/lib/hooks/use-payment-recovery.ts
- webapp/src/lib/hooks/use-user-progress.ts
- webapp/src/lib/image-quality.ts
- website/src/app/api/waitlist/route.ts
- website/src/lib/supabase.ts
- website/src/lib/supabase/client.ts


**Auto-update 2025-07-01**:
Detected changes in:
- webapp/src/components/home/StylesCarousel.tsx


**Auto-update 2025-07-02**:
Detected changes in:
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/page.tsx
- webapp/src/components/create/face_models.tsx
- webapp/src/components/home/OptionButtons.tsx
- webapp/src/components/home/StylesCarousel.module.css
- webapp/src/components/home/StylesCarousel.tsx
- webapp/src/components/home/styles-carousel.tsx


**Auto-update 2025-07-02**:
Detected changes in:
- webapp/src/app/page.tsx
- webapp/src/components/home/OptionButtons.tsx
- webapp/src/components/home/SceneDropdown.module.css
- webapp/src/components/home/SceneDropdown.tsx
- webapp/src/components/home/StylesCarousel.tsx
- webapp/src/components/home/WardrobeDropdown.module.css
- webapp/src/components/home/WardrobeDropdown.tsx
- webapp/src/contexts/style-selection-context.tsx
- webapp/src/lib/utils/style-storage.ts


**Auto-update 2025-07-02**:
Detected changes in:
- webapp/src/app/app/training/page.tsx
- webapp/src/app/page.tsx
- webapp/src/components/face_model/countdown.tsx
- webapp/src/components/face_model/face_models.tsx
- webapp/src/components/face_model/progress_tracker.tsx
- webapp/src/components/home/WardrobeDropdown.module.css
- webapp/src/components/home/floating-options.tsx
- webapp/src/components/style/BaseDropdown.module.css
- webapp/src/components/style/OptionButtons.tsx
- webapp/src/components/style/SceneDropdown.module.css
- webapp/src/components/style/SceneDropdown.tsx
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/style/WardrobeDropdown.module.css
- webapp/src/components/style/WardrobeDropdown.tsx
- webapp/src/lib/utils/style-storage.ts


**Auto-update 2025-07-03**:
Detected changes in:
- webapp/src/app/app/styles/page.tsx
- webapp/src/app/auth/callback/route.ts
- webapp/src/components/style/SceneDropdown.tsx
- webapp/src/components/style/WardrobeDropdown.tsx
- webapp/src/components/style/style-card.tsx
- webapp/src/contexts/style-selection-context.tsx
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/utils/style-storage.ts


**Auto-update 2025-07-07**:
Detected changes in:
- webapp/src/app/api/credits/balance/route.ts
- webapp/src/app/api/credits/transactions/route.ts
- webapp/src/app/api/payment/credit-pack-checkout/route.ts
- webapp/src/app/api/payment/subscription-checkout/route.ts
- webapp/src/app/api/payment/webhook/debug/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/payment/webhook/route.ts.backup
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/globals.css
- webapp/src/app/layout.tsx
- webapp/src/app/page.tsx
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/face_model/face_models.tsx
- webapp/src/components/home/GenerationControls.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/CreditPackPricing.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/providers/intent-handler.tsx
- webapp/src/contexts/DialogServiceContext.tsx
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/constants/stripe-reference.ts
- webapp/src/lib/services/creditService.ts


**Auto-update 2025-07-07**:
Detected changes in:
- webapp/src/app/api/credits/transactions/route.ts
- webapp/src/app/api/payment/create-checkout-session/route.ts
- webapp/src/app/api/payment/credit-pack-checkout/route.ts
- webapp/src/app/api/payment/subscription-checkout/route.ts
- webapp/src/app/api/payment/webhook/debug/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/auth/callback/route.ts
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/constants/stripe-reference.ts
- webapp/src/lib/services/creditService.ts
- webapp/src/lib/supabase/server.ts


**Auto-update 2025-07-07**:
Detected changes in:
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/payment/webhook/route.ts.backup
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/CreditPackPricing.tsx
- webapp/src/lib/services/creditService.ts


**Auto-update 2025-07-07**:
Detected changes in:
- webapp/src/app/api/payment/create-checkout-session/route.ts
- webapp/src/app/api/proxy/update-order-amount/route.ts
- webapp/src/app/app/albums/page.tsx
- webapp/src/app/app/shoot/page.module.css
- webapp/src/app/app/shoot/page.tsx
- webapp/src/app/app/styles/page.module.css
- webapp/src/app/app/styles/page.tsx
- webapp/src/app/app/training/page.tsx
- webapp/src/components/language-switcher.tsx
- webapp/src/components/review/shoot-summary.tsx
- webapp/src/components/shoot/shoot-footer.module.css
- webapp/src/components/shoot/shoot-footer.tsx
- webapp/src/components/style/background-image-selector.tsx
- webapp/src/components/style/clothing-color-selector.module.css
- webapp/src/components/style/clothing-color-selector.tsx
- webapp/src/components/style/clothing-image-selector.tsx
- webapp/src/components/style/flip-card.tsx
- webapp/src/components/style/new-style-card.module.css
- webapp/src/components/style/new-style-card.tsx
- webapp/src/components/style/options-carousel.module.css
- webapp/src/components/style/options-carousel.tsx
- webapp/src/components/style/style-card.module.css
- webapp/src/components/style/style-card.tsx
- webapp/src/components/style/style-details.module.css
- webapp/src/components/style/style-details.tsx
- webapp/src/components/style/style-tabs-options.module.css
- webapp/src/components/style/style-tabs-options.tsx
- webapp/src/components/user-nav.tsx
- webapp/src/lib/api/orders.ts
- webapp/src/lib/api/styles.ts
- webapp/src/lib/constants/api.ts
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/hooks/use-payment-recovery.ts
- webapp/src/lib/pricing.ts
- webapp/src/lib/server/price-verification.ts
- webapp/src/lib/stripe.ts
- website/src/app/api/waitlist/route.ts
- website/src/lib/supabase/admin-client.ts


**Auto-update 2025-07-07**:
Detected changes in:
- webapp/src/app/api/credits/balance/route.ts
- webapp/src/app/api/credits/transactions/route.ts
- webapp/src/app/api/styles/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/lib/api/client.ts
- webapp/src/lib/upload-utils.ts


**Auto-update 2025-07-08**:
Detected changes in:
- webapp/src/app/app/review/page.tsx
- webapp/src/components/face_model/face_models.tsx
- webapp/src/components/home/GenerationControls.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/upload/upload-footer.tsx
- webapp/src/lib/api/client.ts
- webapp/src/lib/hooks/use-file-upload.ts


**Auto-update 2025-07-08**:
Detected changes in:
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/face_model/FaceModelSelector.module.css
- webapp/src/components/face_model/face_models.tsx
- webapp/src/components/home/GenerationControls.module.css
- webapp/src/components/home/GenerationControls.tsx
- webapp/src/components/style/SceneDropdown.tsx
- webapp/src/components/style/WardrobeDropdown.tsx
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/constants/stripe-reference.ts
- webapp/src/lib/services/creditService.ts


**Auto-update 2025-07-08**:
Detected changes in:
- webapp/src/components/home/GenerationControls.module.css


**Auto-update 2025-07-08**:
Detected changes in:
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/face_model/FaceModelSelector.tsx
- webapp/src/components/face_model/FaceModelUploadDialog.tsx
- webapp/src/components/face_model/steps/FaceModelNameStep.tsx
- webapp/src/components/face_model/steps/ProfileFormStep.tsx
- webapp/src/components/face_model/steps/TrainingProgressStep.tsx
- webapp/src/components/face_model/steps/UploadPhotosStep.tsx
- webapp/src/components/face_model/steps/UploadProgressStep.tsx
- webapp/src/components/face_model/steps/UploadRequirementsStep.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/ui/confetti.tsx
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/constants/stripe-reference.ts
- webapp/src/lib/constants/stripe-reference_old.ts


**Auto-update 2025-07-10**:
Detected changes in:
- webapp/src/app/globals.css
- webapp/src/app/page.tsx
- webapp/src/components/face_model/FaceModelSelector.tsx
- webapp/src/components/face_model/FaceModelUploadDialog.tsx
- webapp/src/components/face_model/face_models.tsx
- webapp/src/components/face_model/steps/UploadPhotosStep.tsx
- webapp/src/components/upload/rejected-images-dialog.tsx
- webapp/src/components/upload/upload-footer.tsx
- webapp/src/components/upload/upload-requirements.tsx
- webapp/src/contexts/DialogServiceContext.tsx
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/image-quality.ts


**Auto-update 2025-07-12**:
Detected changes in:
- webapp/src/app/api/cleanup-face-model/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/pricing/credit-costs/route.ts
- webapp/src/app/api/pricing/credit-packs/route.ts
- webapp/src/app/api/pricing/face-model-limit/[planName]/route.ts
- webapp/src/app/api/pricing/subscriptions/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/app/app/review/page.tsx
- webapp/src/components/constants/profile-options.ts
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/face_model/FaceModelSelector.tsx
- webapp/src/components/face_model/FaceModelUploadDialog.tsx
- webapp/src/components/face_model/progress_tracker.tsx
- webapp/src/components/face_model/steps/ProfileFormStep.tsx
- webapp/src/components/face_model/steps/TrainingProgressStep.tsx
- webapp/src/components/face_model/steps/UploadPhotosStep.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/review/form-field.tsx
- webapp/src/components/review/profile-form.module.css
- webapp/src/components/review/profile-form.tsx
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/hooks/use-face-model.ts
- webapp/src/lib/image-quality.ts
- webapp/src/lib/services/creditService.ts
- webapp/src/lib/upload-utils.ts


**Auto-update 2025-07-13**:
Detected changes in:
- webapp/src/app/api/payment/subscription-checkout/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/pricing/face-model-limit/[planName]/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/api/subscription/customer-portal/route.ts
- webapp/src/app/api/subscription/preview-upgrade/route.ts
- webapp/src/app/app/upload/page.tsx
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/face_model/FaceModelSelector.tsx
- webapp/src/components/face_model/FaceModelUploadDialog.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/pricing/UpgradeConfirmationDialog.tsx
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/hooks/use-order.ts


**Auto-update 2025-07-14**:
Detected changes in:
- webapp/src/app/api/cleanup-face-model/route.ts
- webapp/src/app/api/payment/subscription-checkout/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/pricing/face-model-training-cost/route.ts
- webapp/src/app/api/subscription/preview-upgrade/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/app/globals.css
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/face_model/FaceModelSelector.tsx
- webapp/src/components/face_model/FaceModelUploadDialog.tsx
- webapp/src/components/face_model/progress_tracker.tsx
- webapp/src/components/face_model/steps/FaceModelNameStep.tsx
- webapp/src/components/face_model/steps/ProfileFormStep.tsx
- webapp/src/components/face_model/steps/TrainingProgressStep.tsx
- webapp/src/components/home/GenerationControls.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/pricing/UpgradeConfirmationDialog.tsx
- webapp/src/lib/api/face-models.ts
- webapp/src/lib/services/confirmationService.ts


**Auto-update 2025-07-14**:
Detected changes in:
- webapp/src/app/api/cleanup-orphaned-uploads/route.ts
- webapp/src/app/api/styles/route.ts
- webapp/src/app/app/layout.tsx
- webapp/src/app/app/page.tsx
- webapp/src/app/app/payment/error/page.tsx
- webapp/src/app/app/review/page.module.css
- webapp/src/app/app/review/page.tsx
- webapp/src/app/app/settings/page.tsx
- webapp/src/app/app/settings/profile/page.module.css
- webapp/src/app/app/settings/profile/page.tsx
- webapp/src/app/app/settings/settings-content.tsx
- webapp/src/app/app/settings/settings-form.tsx
- webapp/src/app/app/upload/page.tsx
- webapp/src/components/animations/TiltCard.tsx
- webapp/src/components/animations/confetti.tsx
- webapp/src/components/auth/animated-background.module.css
- webapp/src/components/auth/animated-background.tsx
- webapp/src/components/review/review-footer.module.css
- webapp/src/components/review/review-footer.tsx
- webapp/src/components/review/shoot-summary.module.css
- webapp/src/components/review/shoot-summary.tsx
- webapp/src/components/style/SceneDropdown.tsx
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/style/WardrobeDropdown.tsx
- webapp/src/contexts/style-selection-context.tsx
- webapp/src/lib/api/config.ts
- webapp/src/lib/events/payment.ts
- webapp/src/lib/hooks/use-gender-filter.ts
- webapp/src/lib/hooks/use-order-images.ts
- webapp/src/lib/hooks/use-order.ts
- webapp/src/lib/hooks/use-user-gender.ts
- webapp/src/lib/utils/get-styles-images.ts
- webapp/src/lib/utils/style-storage.ts
- webapp/src/lib/utils/style-validation.ts


**Auto-update 2025-07-15**:
Detected changes in:
- admin/src/app/api/translate/route.ts
- admin/src/app/api/upload/route.ts
- admin/src/app/dashboard/page.tsx
- admin/src/app/globals.css
- admin/src/app/layout.tsx
- admin/src/app/page.tsx
- admin/src/app/styles/page.tsx
- admin/src/app/subscriptions/page.tsx
- admin/src/components/dashboard/subscription-analytics.tsx
- admin/src/components/dashboard/top-users-leaderboard.tsx
- admin/src/components/dashboard/usage-analytics.tsx
- admin/src/components/dashboard/user-analytics.tsx
- admin/src/components/dashboard/waitlist-widget.tsx
- admin/src/components/layout/admin-header.tsx
- admin/src/components/layout/sidebar.tsx
- admin/src/components/providers/query-provider.tsx
- admin/src/components/styles/color-form-dialog.tsx
- admin/src/components/styles/colors-table.tsx
- admin/src/components/styles/scene-form-dialog.tsx
- admin/src/components/styles/scenes-table.tsx
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/components/styles/styles-table.tsx
- admin/src/components/styles/wardrobe-form-dialog.tsx
- admin/src/components/styles/wardrobes-table.tsx
- admin/src/components/subscriptions/credit-cost-form-dialog.tsx
- admin/src/components/subscriptions/credit-costs-table.tsx
- admin/src/components/subscriptions/credit-pack-form-dialog.tsx
- admin/src/components/subscriptions/credit-packs-table.tsx
- admin/src/components/subscriptions/subscription-form-dialog.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- admin/src/components/ui/data-table-pagination.tsx
- admin/src/components/ui/data-table.tsx
- admin/src/components/ui/image-upload.tsx
- admin/src/components/ui/multi-select.tsx
- admin/src/components/ui/translation-dialog.tsx
- admin/src/lib/supabase/client.ts
- admin/src/lib/supabase/server.ts
- admin/src/lib/upload.ts
- webapp/src/components/style/WardrobeDropdown.tsx
- webapp/src/lib/utils/get-styles-images.ts


**Auto-update 2025-08-05**:
Detected changes in:
- admin/src/app/api/credit-costs/[id]/route.ts
- admin/src/app/api/credit-costs/route.ts
- admin/src/app/api/credit-packs/[id]/route.ts
- admin/src/app/api/credit-packs/route.ts
- admin/src/app/api/images/delete/route.ts
- admin/src/app/api/styles/[id]/route.ts
- admin/src/app/api/subscriptions/[id]/route.ts
- admin/src/app/api/subscriptions/route.ts
- admin/src/app/api/sync/compare/route.ts
- admin/src/app/api/sync/execute/route.ts
- admin/src/app/api/translate/route.ts
- admin/src/app/api/upload/route.ts
- admin/src/app/auth/auth-code-error/page.tsx
- admin/src/app/auth/callback/route.ts
- admin/src/app/auth/signout/route.ts
- admin/src/app/auth/verify/page.tsx
- admin/src/app/auth/verify/verify.module.css
- admin/src/app/dashboard/page.tsx
- admin/src/app/favicon.ico
- admin/src/app/globals.css
- admin/src/app/layout.tsx
- admin/src/app/styles/page.tsx
- admin/src/app/styles/tabs.module.css
- admin/src/app/subscriptions/page.tsx
- admin/src/components/dashboard/realtime-status.tsx
- admin/src/components/dashboard/revenue-analytics.tsx
- admin/src/components/dashboard/subscription-analytics.tsx
- admin/src/components/dashboard/top-users-leaderboard.tsx
- admin/src/components/dashboard/usage-analytics.tsx
- admin/src/components/dashboard/user-analytics.tsx
- admin/src/components/dashboard/waitlist-widget.tsx
- admin/src/components/layout/ProductionWarningBanner.tsx
- admin/src/components/layout/admin-header.tsx
- admin/src/components/layout/nav.module.css
- admin/src/components/layout/nav.tsx
- admin/src/components/layout/sidebar.tsx
- admin/src/components/styles/color-form-dialog.tsx
- admin/src/components/styles/colors-table.tsx
- admin/src/components/styles/scene-form-dialog.tsx
- admin/src/components/styles/scenes-table.tsx
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/components/styles/styles-table.tsx
- admin/src/components/styles/wardrobe-form-dialog.tsx
- admin/src/components/styles/wardrobes-table.tsx
- admin/src/components/subscriptions/credit-cost-form-dialog.tsx
- admin/src/components/subscriptions/credit-costs-table.tsx
- admin/src/components/subscriptions/credit-pack-form-dialog.tsx
- admin/src/components/subscriptions/credit-packs-table.tsx
- admin/src/components/subscriptions/subscription-form-dialog.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- admin/src/components/sync/changes-summary.tsx
- admin/src/components/sync/sync-button.tsx
- admin/src/components/sync/sync-dialog.tsx
- admin/src/components/sync/sync-progress.tsx
- admin/src/components/ui/data-table.tsx
- admin/src/components/ui/image-upload.tsx
- admin/src/components/ui/multi-select.tsx
- admin/src/components/ui/translation-dialog.tsx
- admin/src/contexts/RealtimeAnalyticsContext.tsx
- admin/src/lib/get-options-image.ts
- admin/src/lib/get-styles-images.ts
- admin/src/lib/supabase/client.ts
- admin/src/lib/supabase/middleware.ts
- admin/src/lib/supabase/multi-env.ts
- admin/src/lib/supabase/server.ts
- admin/src/lib/sync/detector.ts
- admin/src/lib/sync/engine.ts
- admin/src/lib/sync/types.ts
- admin/src/lib/translation.ts
- admin/src/lib/upload.ts
- admin/src/lib/utils.ts
- webapp/src/app/globals.css
- webapp/src/app/layout.tsx
- webapp/src/lib/utils/get-styles-images.ts


**Auto-update 2025-08-09**:
Detected changes in:
- admin/src/components/subscriptions/subscription-form-dialog.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- webapp/src/app/api/cleanup-character/route.ts
- webapp/src/app/api/cleanup-face-model/route.ts
- webapp/src/app/api/pricing/character-limit/[planName]/route.ts
- webapp/src/app/api/pricing/credit-costs/route.ts
- webapp/src/app/api/pricing/subscriptions/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/app/globals.css
- webapp/src/app/page.tsx
- webapp/src/components/character/CharacterSelector.module.css
- webapp/src/components/character/CharacterSelector.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/Countdown.tsx
- webapp/src/components/character/ProgressTracker.tsx
- webapp/src/components/character/training/CharacterNameStep.tsx
- webapp/src/components/character/training/ThumbnailStyles.module.css
- webapp/src/components/character/training/TrainingProgressStep.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/character/training/UploadProgressStep.tsx
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/face_model/FaceModelUploadDialog.tsx
- webapp/src/components/face_model/steps/FaceModelNameStep.tsx
- webapp/src/components/face_model/steps/ProfileFormStep.tsx
- webapp/src/components/face_model/steps/TrainingProgressStep.tsx
- webapp/src/components/face_model/steps/UploadPhotosStep.tsx
- webapp/src/components/face_model/steps/UploadProgressStep.tsx
- webapp/src/components/face_model/steps/UploadRequirementsStep.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/upload/FileUploader.module.css
- webapp/src/components/upload/FileUploader.tsx
- webapp/src/components/upload/ImageQualityScore.module.css
- webapp/src/components/upload/ImageQualityScore.tsx
- webapp/src/components/upload/ImageTooltip.module.css
- webapp/src/components/upload/ImageTooltip.tsx
- webapp/src/components/upload/RejectedImagesContent.module.css
- webapp/src/components/upload/RejectedImagesContent.tsx
- webapp/src/components/upload/RequirementsContent.tsx
- webapp/src/components/upload/UploadFooter.module.css
- webapp/src/components/upload/UploadFooter.tsx
- webapp/src/components/upload/UploadRequirements.module.css
- webapp/src/components/upload/UploadRequirements.tsx
- webapp/src/components/upload/rejected-images-dialog.tsx
- webapp/src/lib/api/characters.ts
- webapp/src/lib/api/face-models.ts
- webapp/src/lib/api/jobs.ts
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/constants/upload.ts
- webapp/src/lib/hooks/use-character-images.ts
- webapp/src/lib/hooks/use-character.ts
- webapp/src/lib/hooks/use-face-model.ts
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/image-quality.ts
- webapp/src/lib/s3.ts
- webapp/src/lib/schemas.ts
- webapp/src/lib/services/creditService.ts
- webapp/src/lib/types.ts
- webapp/src/lib/upload-utils.ts
- webapp/src/lib/websocket/connection-manager.ts


**Auto-update 2025-08-09**:
Detected changes in:
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/ThumbnailStyles.module.css


**Auto-update 2025-08-10**:
Detected changes in:
- webapp/src/app/api/cleanup-character/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/app/api/user-images/route.ts
- webapp/src/components/character/CharacterSelector.tsx
- webapp/src/components/character/training/TrainingProgressStep.tsx
- webapp/src/lib/hooks/use-character-images.ts
- webapp/src/lib/image-quality.ts
- webapp/src/lib/s3.ts


**Auto-update 2025-08-12**:
Detected changes in:
- admin/src/components/styles/wardrobe-form-dialog.tsx
- admin/src/components/styles/wardrobes-table.tsx
- admin/src/components/subscriptions/credit-cost-form-dialog.tsx
- admin/src/components/subscriptions/subscription-form-dialog.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/app/layout.tsx
- webapp/src/app/page.tsx
- webapp/src/components/character/CharacterSelector.module.css
- webapp/src/components/character/CharacterSelector.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/TrainingProgressStep.tsx
- webapp/src/components/header/CreditsHeaderRight.module.css
- webapp/src/components/header/CreditsHeaderRight.tsx
- webapp/src/components/home/GalleryPlaceholder.module.css
- webapp/src/components/home/GalleryPlaceholder.tsx
- webapp/src/components/home/GenerationControls.module.css
- webapp/src/components/home/GenerationControls.tsx
- webapp/src/components/review/form-field.module.css
- webapp/src/components/review/form-field.tsx
- webapp/src/components/review/profile-form.module.css
- webapp/src/components/review/profile-form.tsx
- webapp/src/components/style/BaseDropdown.module.css
- webapp/src/components/style/GenerateBar/GenerateBar.module.css
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/OptionButtons.tsx
- webapp/src/components/style/OptionsPanel/OptionsPanel.module.css
- webapp/src/components/style/OptionsPanel/OptionsPanel.tsx
- webapp/src/components/style/SceneDropdown.module.css
- webapp/src/components/style/SceneDropdown.tsx
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/style/WardrobeDropdown.module.css
- webapp/src/components/style/WardrobeDropdown.tsx
- webapp/src/lib/api/jobs.ts
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/hooks/use-inference-jobs-count.ts
- webapp/src/lib/image-quality.ts
- webapp/src/lib/types.ts
- webapp/src/lib/upload-utils.ts
- webapp/src/lib/websocket/connection-manager.ts


**Auto-update 2025-08-12**:
Detected changes in:
- admin/src/app/api/admin/inference-settings/[key]/route.ts
- admin/src/app/api/admin/inference-settings/route.ts
- admin/src/app/inference/page.tsx
- admin/src/components/inference/inference-settings-form-dialog.tsx
- admin/src/components/inference/inference-settings-table.tsx
- admin/src/components/layout/nav.tsx
- admin/src/components/subscriptions/credit-costs-table.tsx
- admin/src/components/subscriptions/subscription-form-dialog.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- webapp/src/app/api/inference/settings/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/header/CreditsHeaderRight.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/CreditPackPricing.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.module.css
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.module.css
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/GenerateBar/GenerateBarSelect.tsx
- webapp/src/components/style/GenerateBar/useCreateCharacter.tsx
- webapp/src/components/style/OptionsPanel/OptionsPanel.tsx
- webapp/src/contexts/DialogServiceContext.tsx
- webapp/src/lib/constants/pricing.ts
- webapp/src/lib/services/creditService.ts


**Auto-update 2025-08-13**:
Detected changes in:
- admin/src/app/api/admin/inference-settings/route.ts
- admin/src/app/api/admin/style-colors/route.ts
- admin/src/app/api/admin/style-scenes/route.ts
- admin/src/app/api/admin/style-wardrobes/route.ts
- admin/src/app/api/admin/styles/route.ts
- admin/src/app/api/inference/settings/route.ts
- admin/src/app/layout.tsx
- admin/src/components/inference/inference-settings-form-dialog.tsx
- admin/src/components/providers/AdminGuard.tsx
- admin/src/components/styles/color-form-dialog.tsx
- admin/src/components/styles/scene-form-dialog.tsx
- admin/src/components/styles/scenes-table.tsx
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/components/styles/styles-table.tsx
- admin/src/components/styles/wardrobe-form-dialog.tsx
- admin/src/components/styles/wardrobes-table.tsx
- admin/src/lib/sync/detector.ts
- admin/src/lib/sync/engine.ts
- admin/src/lib/sync/types.ts
- webapp/src/app/api/inference/settings/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/CreditPackGrid.tsx
- webapp/src/components/pricing/CreditPackPricing.tsx
- webapp/src/components/pricing/utils.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.module.css
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/GenerateBar/useCreateCharacter.tsx
- webapp/src/components/style/OptionsPanel/OptionsPanel.tsx
- webapp/src/lib/constants/pricing.ts


**Auto-update 2025-08-15**:
Detected changes in:
- admin/src/app/api/images/list/route.ts
- admin/src/app/api/media/delete/route.ts
- admin/src/app/api/media/download/file/route.ts
- admin/src/app/api/media/download/route.ts
- admin/src/app/api/media/download/zip/route.ts
- admin/src/app/api/media/folder/route.ts
- admin/src/app/api/media/list/route.ts
- admin/src/app/api/styles/[id]/route.ts
- admin/src/app/dashboard/page.tsx
- admin/src/app/layout.tsx
- admin/src/app/media/page.tsx
- admin/src/app/media/styles.module.css
- admin/src/app/styles/page.tsx
- admin/src/app/subscriptions/page.tsx
- admin/src/components/inference/inference-settings-table.tsx
- admin/src/components/layout/nav.tsx
- admin/src/components/media/TreeNav.tsx
- admin/src/components/media/tree.module.css
- admin/src/components/styles/scene-form-dialog.tsx
- admin/src/components/styles/scenes-table.tsx
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/components/styles/styles-table.tsx
- admin/src/components/styles/wardrobe-form-dialog.tsx
- admin/src/components/styles/wardrobes-table.tsx
- admin/src/components/ui/image-upload.tsx
- admin/src/components/ui/multi-select.tsx
- admin/src/lib/get-options-image.ts
- admin/src/lib/upload.ts
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/lib/utils/cloudfrontLoader.ts
- webapp/src/lib/utils/get-options-image.ts


**Auto-update 2025-08-16**:
Detected changes in:
- admin/src/app/styles/page.tsx
- admin/src/components/ui/image-upload.tsx


**Auto-update 2025-08-20**:
Detected changes in:
- admin/src/app/api/upload/route.ts
- admin/src/app/media/page.tsx
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/lib/sync/detector.ts
- admin/src/lib/sync/engine.ts
- webapp/src/app/api/generation/config/route.ts
- webapp/src/app/api/pricing/all/route.ts
- webapp/src/app/layout.tsx
- webapp/src/components/home/GalleryPlaceholder.module.css
- webapp/src/components/home/GalleryPlaceholder.tsx
- webapp/src/components/home/InferenceThumbnail.module.css
- webapp/src/components/home/InferenceThumbnail.tsx
- webapp/src/components/icons/icon.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.module.css
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/GenerateBar/GenerateBarSelect.tsx
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/upload/ImageTooltip.tsx
- webapp/src/components/upload/UploadFooter.tsx
- webapp/src/components/upload/UploadRequirements.tsx
- webapp/src/contexts/inference-queue-context.tsx
- webapp/src/lib/api/inference-images.ts
- webapp/src/lib/api/inference-jobs.ts
- webapp/src/lib/debug/inference-debug.ts
- webapp/src/lib/hooks/use-inference-jobs-count.ts
- webapp/src/lib/utils/get-inference-image.ts


**Auto-update 2025-08-23**:
Detected changes in:
- admin/src/app/media/page.tsx
- admin/src/components/ui/image-upload.tsx
- webapp/src/app/api/app-images/route.ts
- webapp/src/components/home/GalleryPlaceholder.module.css
- webapp/src/components/home/GalleryPlaceholder.tsx
- webapp/src/components/home/InferenceImageViewerDialog.module.css
- webapp/src/components/home/InferenceImageViewerDialog.tsx
- webapp/src/components/home/InferenceJobGroup.module.css
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/home/InferenceThumbnail.module.css
- webapp/src/components/home/InferenceThumbnail.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/contexts/inference-queue-context.tsx
- webapp/src/lib/api/inference-images.ts
- webapp/src/lib/api/inference-job-management.ts
- webapp/src/lib/api/inference-results.ts
- webapp/src/lib/debug/inference-debug.ts
- webapp/src/lib/hooks/use-inference-jobs-count.ts
- webapp/src/lib/utils/get-inference-image.ts
- webapp/src/lib/utils/inference-images.ts
- webapp/src/lib/websocket/connection-manager.ts


**Auto-update 2025-08-24**:
Detected changes in:
- webapp/src/components/home/GalleryPlaceholder.module.css
- webapp/src/components/home/GalleryPlaceholder.tsx
- webapp/src/components/home/InferenceThumbnail.module.css
- webapp/src/components/home/InferenceThumbnail.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/lib/websocket/connection-manager.ts


**Auto-update 2025-09-03**:
Detected changes in:
- admin/src/app/api/upload/route.ts
- admin/src/components/styles/wardrobe-form-dialog.tsx
- admin/src/lib/upload.ts
- webapp/src/app/api/app-images/route.ts
- webapp/src/app/api/inference/prompt-preview/route.ts
- webapp/src/app/globals.css
- webapp/src/app/layout.tsx
- webapp/src/app/page.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/character/training/TrainingProgressStep.tsx
- webapp/src/components/home/GalleryPlaceholder.module.css
- webapp/src/components/home/GalleryPlaceholder.tsx
- webapp/src/components/home/InferenceImageViewerDialog.module.css
- webapp/src/components/home/InferenceImageViewerDialog.tsx
- webapp/src/components/home/InferenceJobGroup.module.css
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/home/InferenceThumbnail.module.css
- webapp/src/components/home/InferenceThumbnail.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/CreditPackGrid.tsx
- webapp/src/components/pricing/CreditPackPricing.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.module.css
- webapp/src/components/shared/QueryParamCleaner.tsx
- webapp/src/components/style/GenerateBar/AdminInferenceOptionsDialog.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.module.css
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/GenerateBar/useCreateCharacter.tsx
- webapp/src/components/style/OptionsPanel/OptionsPanel.module.css
- webapp/src/components/style/OptionsPanel/OptionsPanel.tsx
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/contexts/DialogServiceContext.tsx
- webapp/src/lib/api/config.ts
- webapp/src/lib/api/inference-images.ts
- webapp/src/lib/api/inference-job-management.ts
- webapp/src/lib/api/inference-results.ts
- webapp/src/lib/constants/stripe-reference.ts
- webapp/src/lib/debug/inference-debug.ts
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/image-quality.ts
- webapp/src/lib/s3.ts
- webapp/src/lib/services/confirmationService.ts
- webapp/src/lib/utils/get-inference-image.ts
- webapp/src/lib/utils/inference-images.ts
- webapp/src/lib/websocket/connection-manager.ts


**Auto-update 2025-09-03**:
Detected changes in:
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/UploadProgressStep.tsx
- webapp/src/components/home/GalleryPlaceholder.tsx
- webapp/src/components/home/InferenceJobGroup.module.css
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/home/InferenceThumbnail.module.css
- webapp/src/components/home/InferenceThumbnail.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.module.css
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/GenerateBar/useCreateCharacter.tsx
- webapp/src/contexts/DialogServiceContext.tsx
- webapp/src/lib/api/inference-job-management.ts
- webapp/src/lib/services/confirmationService.ts


**Auto-update 2025-09-04**:
Detected changes in:
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/home/InferenceThumbnail.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx


**Auto-update 2025-09-04**:
Detected changes in:
- admin/src/app/api/upload/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/character/training/TrainingProgressStep.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/home/InferenceImageViewerDialog.module.css
- webapp/src/components/home/InferenceImageViewerDialog.tsx
- webapp/src/components/home/InferenceJobGroup.module.css
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/style/GenerateBar/AdminInferenceOptionsDialog.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/lib/api/characters.ts
- webapp/src/lib/hooks/use-file-upload.ts
- webapp/src/lib/image-quality.ts
- webapp/src/lib/services/confirmationService.ts
- webapp/src/lib/websocket/connection-manager.ts


**Auto-update 2025-09-04**:
Detected changes in:
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/GenerateBar/useCreateCharacter.tsx


**Auto-update 2025-09-04**:
Detected changes in:
- admin/src/app/api/admin/inference-settings/[key]/route.ts
- admin/src/app/api/upload/route.ts
- admin/src/app/media/page.tsx
- admin/src/lib/sync/engine.ts
- admin/src/lib/translation.ts


**Auto-update 2025-09-04**:
Detected changes in:
- webapp/src/app/api/payment/credit-pack-checkout/route.ts
- webapp/src/app/api/payment/subscription-checkout/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/subscription/customer-portal/route.ts
- webapp/src/app/api/subscription/preview-upgrade/route.ts
- webapp/src/lib/services/creditService.ts


**Auto-update 2025-09-05**:
Detected changes in:
- admin/src/app/api/media/download/zip/route.ts
- admin/src/app/globals.css
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/components/styles/wardrobe-form-dialog.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx


**Auto-update 2025-09-05**:
Detected changes in:
- webapp/src/app/layout.tsx
- webapp/src/components/providers/I18nInitializer.tsx


**Auto-update 2025-09-05**:
Detected changes in:
- admin/src/app/media/page.tsx
- webapp/src/app/layout.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/providers/I18nInitializer.tsx
- webapp/src/components/providers/I18nProvider.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/GenerateBar/useCreateCharacter.tsx
- website/src/app/page.tsx


**Auto-update 2025-09-05**:
Detected changes in:
- webapp/src/app/layout.tsx
- webapp/src/components/providers/RootProviders.tsx


**Auto-update 2025-09-06**:
Detected changes in:
- admin/src/app/globals.css
- webapp/src/app/globals.css
- webapp/src/app/layout.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/UploadProgressStep.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/pricing/utils.tsx
- webapp/src/components/providers/I18nInitializer.tsx
- webapp/src/components/providers/RootProviders.tsx
- webapp/src/components/style/GenerateBar/AdminInferenceOptionsDialog.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/lib/constants/stripe-reference.ts
- webapp/src/lib/constants/stripe-reference_old.ts
- webapp/src/lib/websocket/connection-manager.ts


**Auto-update 2025-09-07**:
Detected changes in:
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/lib/utils/get-inference-image.ts


**Auto-update 2025-09-09**:
Detected changes in:
- admin/src/components/sync/sync-dialog.tsx
- admin/src/lib/api.ts
- webapp/src/app/api/inference/prompt-preview/route.ts
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/pricing/utils.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/components/style/GenerateBar/useCreateCharacter.tsx
- webapp/src/lib/constants/stripe-reference.ts
- webapp/src/lib/upload-utils.ts


**Auto-update 2025-09-12**:
Detected changes in:
- webapp/src/app/api/app-images/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/components/home/InferenceJobGroup.module.css
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/pricing/utils.tsx
- webapp/src/components/style/GenerateBar/AdminInferenceOptionsDialog.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/lib/constants/stripe-reference.ts
- webapp/src/lib/constants/upload.ts
- webapp/src/lib/hooks/use-character-images.ts
- webapp/src/lib/upload-utils.ts


**Auto-update 2025-09-13**:
Detected changes in:
- webapp/src/app/layout.tsx
- webapp/src/components/home/InferenceImageViewerDialog.tsx
- webapp/src/contexts/inference-queue-context.tsx
- webapp/src/lib/image-quality.ts


**Auto-update 2025-09-13**:
Detected changes in:
- webapp/src/lib/image-quality.ts


**Auto-update 2025-09-14**:
Detected changes in:
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/api/subscription/customer-portal/route.ts
- webapp/src/app/api/subscription/sync/route.ts
- webapp/src/app/api/webhooks/stripe/route.ts
- webapp/src/components/header/CreditsHeaderRight.tsx
- webapp/src/components/home/InferenceImageViewerDialog.module.css
- webapp/src/components/home/InferenceImageViewerDialog.tsx
- webapp/src/components/home/InferenceJobGroup.module.css
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/home/InferenceThumbnail.module.css
- webapp/src/components/pricing/SubscriptionDialogContent.tsx


**Auto-update 2025-09-15**:
Detected changes in:
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/webhooks/stripe/route.ts
- webapp/src/components/pricing/SubscriptionDialogContent.tsx


**Auto-update 2025-09-16**:
Detected changes in:
- webapp/src/app/api/app-images/route.ts
- webapp/src/app/api/generation/config/route.ts
- webapp/src/app/api/inference/config/route.ts
- webapp/src/app/api/inference/delete-generated-image/route.ts
- webapp/src/app/layout.tsx
- webapp/src/components/home/InferenceImageViewerDialog.module.css
- webapp/src/components/home/InferenceImageViewerDialog.tsx
- webapp/src/components/home/InferenceJobGroup.module.css
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/home/InferenceThumbnail.module.css
- webapp/src/components/home/InferenceThumbnail.tsx
- webapp/src/components/style/GenerateBar/GenerateBar.module.css
- webapp/src/components/style/GenerateBar/GenerateBar.tsx
- webapp/src/lib/api/inference-images.ts
- webapp/src/lib/api/inference-job-management.ts
- webapp/src/lib/services/confirmation.module.css
- webapp/src/lib/services/confirmationService.ts


**Auto-update 2025-09-18**:
Detected changes in:
- webapp/src/components/character/CharacterTrainingDialog.module.css
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/CharacterNameStep.tsx
- webapp/src/components/character/training/ThumbnailStyles.module.css
- webapp/src/components/character/training/TrainingProgressStep.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/character/training/UploadProgressStep.tsx
- webapp/src/components/upload/FileUploader.module.css
- webapp/src/lib/image-quality.ts
- webapp/src/lib/upload-utils.ts


**Auto-update 2025-09-18**:
Detected changes in:
- webapp/src/components/character/CharacterTrainingDialog.module.css
- webapp/src/components/character/training/CharacterNameStep.tsx
- webapp/src/components/home/InferenceImageViewerDialog.module.css
- webapp/src/components/upload/FileUploader.module.css
- webapp/src/components/upload/FileUploader.tsx
- webapp/src/components/upload/UploadFooter.module.css
- webapp/src/components/upload/UploadFooter.tsx
- webapp/src/lib/constants/upload.ts


**Auto-update 2025-09-18**:
Detected changes in:
- admin/src/app/auth/callback/route.ts
- admin/src/app/auth/signout/route.ts
- webapp/src/app/api/subscription/customer-portal/route.ts
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/auth/signout/route.ts
- webapp/src/components/character/training/CharacterNameStep.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/CreditPackPricing.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/lib/api/client.ts
- webapp/src/lib/upload-utils.ts


**Auto-update 2025-09-18**:
Detected changes in:
- webapp/src/app/api/cleanup-character/route.ts
- webapp/src/app/api/cleanup-upload/route.ts
- webapp/src/components/character/CharacterTrainingDialog.module.css
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/CharacterNameStep.tsx
- webapp/src/components/home/InferenceImageViewerDialog.tsx
- webapp/src/components/shared/ConfirmDialog.tsx
- webapp/src/components/upload/FileUploader.module.css
- webapp/src/components/upload/FileUploader.tsx
- webapp/src/components/upload/RequirementsContent.module.css
- webapp/src/components/upload/RequirementsContent.tsx
- webapp/src/components/upload/UploadFooter.module.css
- webapp/src/components/upload/UploadFooter.tsx
- webapp/src/lib/image-quality.ts
- webapp/src/lib/upload-utils.ts


**Auto-update 2025-09-18**:
Detected changes in:
- webapp/src/components/shared/ConfirmDialog.tsx


**Auto-update 2025-09-18**:
Detected changes in:
- webapp/src/lib/hooks/use-file-upload.ts


**Auto-update 2025-09-19**:
Detected changes in:
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/lib/hooks/use-file-upload.ts


**Auto-update 2025-09-19**:
Detected changes in:
- admin/src/app/api/media/thumbnail/route.ts
- admin/src/app/media/page.tsx
- admin/src/app/media/styles.module.css
- admin/src/lib/api/client.ts
- webapp/src/components/character/CharacterTrainingDialog.module.css
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/generate/AdminInferenceOptionsDialog.tsx
- webapp/src/components/generate/GenerateBar.module.css
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/generate/GenerateBarSelect.tsx
- webapp/src/components/generate/OptionsPanel/OptionsPanel.module.css
- webapp/src/components/generate/OptionsPanel/OptionsPanel.tsx
- webapp/src/components/generate/useCreateCharacter.tsx
- webapp/src/components/home/GalleryPlaceholder.tsx
- webapp/src/components/home/InferenceImageViewerDialog.tsx
- webapp/src/components/home/InferenceJobGroup.module.css
- webapp/src/components/home/InferenceJobGroup.tsx
- webapp/src/components/home/InferenceThumbnail.module.css
- webapp/src/components/home/InferenceThumbnail.tsx
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/upload/FileUploader.tsx
- webapp/src/components/upload/UploadFooter.module.css
- webapp/src/components/upload/UploadFooter.tsx
- webapp/src/lib/constants/upload.ts


**Auto-update 2025-09-20**:
Detected changes in:
- admin/src/app/media/page.tsx
- admin/src/components/media/TreeNav.tsx
- webapp/src/app/page.tsx
- webapp/src/components/inference/GalleryPlaceholder.module.css
- webapp/src/components/inference/GalleryPlaceholder.tsx
- webapp/src/components/inference/InferenceImageViewerDialog.module.css
- webapp/src/components/inference/InferenceImageViewerDialog.tsx
- webapp/src/components/inference/InferenceJobGroup.module.css
- webapp/src/components/inference/InferenceJobGroup.tsx
- webapp/src/components/inference/InferenceThumbnail.module.css
- webapp/src/components/inference/InferenceThumbnail.tsx
- webapp/src/components/skeleton/upload/page.tsx
- webapp/src/components/skeleton/upload/requirements.module.css
- webapp/src/components/skeleton/upload/requirements.tsx
- webapp/src/components/upload/UploadRequirements.tsx


**Auto-update 2025-09-21**:
Detected changes in:
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/inference/GalleryPlaceholder.module.css
- webapp/src/components/inference/GalleryPlaceholder.tsx
- webapp/src/components/inference/InferenceImageViewerDialog.module.css
- webapp/src/components/inference/InferenceJobGroup.module.css
- webapp/src/components/inference/InferenceJobGroup.tsx
- webapp/src/components/inference/InferenceThumbnail.module.css
- webapp/src/components/inference/InferenceThumbnail.tsx
- webapp/src/lib/constants/upload.ts
- webapp/src/lib/upload-utils.ts


**Auto-update 2025-09-22**:
Detected changes in:
- website/src/app/page.tsx


**Auto-update 2025-09-22**:
Detected changes in:
- webapp/src/app/api/app-images/route.ts
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/generate/AdminInferenceOptionsDialog.tsx
- webapp/src/components/inference/GalleryPlaceholder.module.css
- webapp/src/components/inference/GalleryPlaceholder.tsx
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/upload/ImageQualityScore.module.css
- webapp/src/components/upload/ImageQualityScore.tsx
- webapp/src/components/upload/RejectedImagesContent.module.css
- webapp/src/components/upload/RejectedImagesContent.tsx
- webapp/src/components/upload/RequirementsContent.module.css
- webapp/src/components/upload/UploadFooter.module.css
- webapp/src/lib/constants/upload.ts
- webapp/src/lib/image-quality.ts


**Auto-update 2025-09-22**:
Detected changes in:
- website/src/app/globals.css
- website/src/app/page.tsx


**Auto-update 2025-09-22**:
Detected changes in:
- webapp/src/components/inference/GalleryPlaceholder.tsx
- webapp/src/components/upload/RequirementsContent.tsx
- webapp/src/lib/image-quality.ts
- website/src/app/layout.tsx
- website/src/app/page.tsx
- website/src/components/I18nInitializer.tsx
- website/src/components/SiteHeader.tsx


**Auto-update 2025-09-22**:
Detected changes in:
- website/src/app/api/waitlist/route.ts
- website/src/app/layout.tsx


**Auto-update 2025-09-22**:
Detected changes in:
- admin/src/app/api/sync/compare/route.ts
- admin/src/app/api/sync/execute/route.ts
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/components/subscriptions/subscription-form-dialog.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- admin/src/components/sync/sync-dialog.tsx
- admin/src/lib/sync/engine.ts
- admin/src/lib/sync/types.ts
- webapp/src/app/layout.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/OnboardingStep.tsx
- webapp/src/components/character/training/onboarding.module.css
- webapp/src/components/inference/GalleryPlaceholder.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.module.css
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/upload/UploadFooter.module.css


**Auto-update 2025-09-23**:
Detected changes in:
- admin/src/app/api/upload/route.ts
- admin/src/components/subscriptions/credit-pack-form-dialog.tsx
- admin/src/components/subscriptions/subscription-form-dialog.tsx
- admin/src/components/ui/image-upload.tsx
- webapp/src/app/favourites/page.tsx
- webapp/src/app/favourites/styles.module.css
- webapp/src/app/globals.css
- webapp/src/app/layout.tsx
- webapp/src/app/page.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/generate/GenerateBar.module.css
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/generate/useCreateCharacter.tsx
- webapp/src/components/header/CreditsHeaderRight.module.css
- webapp/src/components/header/CreditsHeaderRight.tsx
- webapp/src/components/inference/GalleryPlaceholder.tsx
- webapp/src/components/inference/InferenceImageViewerDialog.module.css
- webapp/src/components/inference/InferenceImageViewerDialog.tsx
- webapp/src/components/inference/InferenceJobGroup.tsx
- webapp/src/components/inference/InferenceThumbnail.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/CreditPackPricing.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.module.css
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/pricing/UpgradeConfirmationDialog.tsx
- webapp/src/components/pricing/utils.tsx
- webapp/src/contexts/DialogServiceContext.tsx
- webapp/src/lib/services/confirmationService.ts


**Auto-update 2025-09-24**:
Detected changes in:
- admin/src/app/auth/callback/route.ts
- admin/src/app/layout.tsx
- admin/src/components/providers/I18nInitializer.tsx
- admin/src/contexts/RealtimeAnalyticsContext.tsx
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/layout.tsx
- webapp/src/components/animations/confetti.tsx
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/header/CreditsHeaderRight.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.module.css
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/providers/PurchaseSuccessHandler.tsx
- webapp/src/components/purchase/PurchaseSuccessDialog.tsx
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/contexts/style-selection-context.tsx
- website/src/app/about/page.tsx
- website/src/app/privacy/page.tsx
- website/src/app/terms/page.tsx


**Auto-update 2025-09-24**:
Detected changes in:
- webapp/src/app/layout.tsx
- webapp/src/components/providers/CrispInitializer.tsx


**Auto-update 2025-09-24**:
Detected changes in:
- admin/src/app/api/s3/sign/route.ts
- admin/src/components/inference/inference-settings-form-dialog.tsx
- admin/src/components/inference/inference-settings-table.tsx
- admin/src/components/styles/color-form-dialog.tsx
- admin/src/components/styles/scene-form-dialog.tsx
- admin/src/components/styles/styles-table.tsx
- admin/src/components/subscriptions/credit-cost-form-dialog.tsx
- admin/src/components/subscriptions/credit-costs-table.tsx
- admin/src/components/subscriptions/credit-pack-form-dialog.tsx
- admin/src/components/subscriptions/credit-packs-table.tsx
- admin/src/components/subscriptions/subscription-form-dialog.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- admin/src/components/ui/image-upload.tsx
- admin/src/lib/supabase/multi-env.ts
- admin/src/lib/sync/detector.ts
- admin/src/lib/sync/engine.ts
- webapp/src/app/api/account/avatar/route.ts
- webapp/src/app/api/account/profile/route.ts
- webapp/src/app/api/s3/sign/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/page.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/dashboard/CreditDashboard.tsx
- webapp/src/components/generate/GenerateBar.module.css
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/generate/useCreateCharacter.tsx
- webapp/src/components/inference/GalleryPlaceholder.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/lib/logger.ts
- website/src/app/layout.tsx


**Auto-update 2025-09-25**:
Detected changes in:
- admin/src/lib/supabase/multi-env.ts
- webapp/src/app/globals.css
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/CharacterNameStep.tsx
- webapp/src/components/character/training/OnboardingStep.tsx
- webapp/src/components/character/training/TrainingProgressStep.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/character/training/UploadProgressStep.tsx
- webapp/src/components/generate/AdminInferenceOptionsDialog.tsx
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/generate/OptionsPanel/OptionsPanel.tsx
- webapp/src/components/header/CreditsHeaderRight.tsx
- webapp/src/components/inference/GalleryPlaceholder.tsx
- webapp/src/components/inference/InferenceImageViewerDialog.tsx
- webapp/src/components/inference/InferenceJobGroup.tsx
- webapp/src/components/inference/InferenceThumbnail.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.module.css
- webapp/src/components/pricing/SubscriptionDialogContent.tsx


**Auto-update 2025-09-25**:
Detected changes in:
- admin/src/app/api/translate/route.ts
- admin/src/app/auth/auth-code-error/page.tsx
- admin/src/app/auth/verify/page.tsx
- admin/src/app/globals.css
- admin/src/app/layout.tsx
- admin/src/components/layout/AdminHeader.module.css
- admin/src/components/layout/AdminHeader.tsx
- admin/src/components/providers/I18nInitializer.tsx
- admin/src/components/styles/color-form-dialog.tsx
- admin/src/components/styles/colors-table.tsx
- admin/src/components/styles/scenes-table.tsx
- admin/src/components/styles/styles-table.tsx
- admin/src/components/styles/wardrobes-table.tsx
- admin/src/components/subscriptions/credit-packs-table.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- admin/src/components/ui/data-table.tsx
- admin/src/components/ui/translation-dialog.tsx
- admin/src/lib/translation.ts
- webapp/src/app/globals.css
- webapp/src/app/layout.tsx
- webapp/src/app/page.tsx
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/inference/InferenceJobGroup.tsx
- webapp/src/components/pricing/utils.tsx
- webapp/src/components/providers/I18nInitializer.tsx
- webapp/src/lib/language-utils.ts
- website/src/app/[locale]/about/page.tsx
- website/src/app/[locale]/layout.tsx
- website/src/app/[locale]/page.tsx
- website/src/app/[locale]/privacy/page.tsx
- website/src/app/[locale]/terms/page.tsx
- website/src/app/about/page.tsx
- website/src/app/layout.tsx
- website/src/components/HomePageWrapper.tsx
- website/src/components/I18nInitializer.tsx
- website/src/components/WaitlistForm.tsx
- website/src/components/WebGLBackground.tsx
- website/src/components/WebGLContext.tsx


**Auto-update 2025-09-26**:
Detected changes in:
- admin/src/app/auth/verify/page.tsx
- admin/src/app/layout.tsx
- admin/src/components/layout/AdminHeader.tsx
- admin/src/components/styles/color-form-dialog.tsx
- admin/src/components/styles/scene-form-dialog.tsx
- admin/src/components/styles/scenes-table.tsx
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/components/styles/styles-table.tsx
- admin/src/components/styles/wardrobe-form-dialog.tsx
- admin/src/components/subscriptions/credit-packs-table.tsx
- admin/src/components/subscriptions/subscriptions-table.tsx
- admin/src/lib/api.ts
- admin/src/lib/api/client.ts
- admin/src/lib/sync/engine.ts
- admin/src/lib/utils.ts
- webapp/src/app/api/cleanup-upload/route.ts
- webapp/src/app/api/subscription/sync/route.ts
- webapp/src/app/api/user-images/route.ts
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/auth/verify/page.tsx
- webapp/src/app/auth/verify/verify.module.css
- webapp/src/app/page.tsx
- webapp/src/lib/api/client.ts
- webapp/src/lib/supabase/middleware.ts
- webapp/src/lib/utils/get-inference-image.ts
- website/src/app/[locale]/layout.tsx
- website/src/app/layout.tsx
- website/src/components/WebGLContext.tsx
- website/src/components/WebGLImageTransition.tsx


**Auto-update 2025-09-26**:
Detected changes in:
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/components/ui/image-upload.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/character/training/OnboardingStep.tsx
- webapp/src/components/character/training/TrainingProgressStep.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/inference/InferenceImageViewerDialog.tsx
- webapp/src/components/inference/InferenceJobGroup.tsx
- webapp/src/components/style/StylePreviewDialog.module.css
- webapp/src/components/style/StylePreviewDialog.tsx
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/upload/FileUploader.tsx
- webapp/src/components/upload/ImageQualityScore.module.css
- webapp/src/components/upload/ImageQualityScore.tsx
- webapp/src/components/upload/RequirementsContent.tsx
- webapp/src/components/upload/UploadRequirements.module.css
- webapp/src/components/upload/UploadRequirements.tsx
- webapp/src/lib/image-quality.ts
- website/src/app/[locale]/layout.tsx


**Auto-update 2025-09-26**:
Detected changes in:
- webapp/src/app/api/subscription/customer-portal/route.ts
- webapp/src/app/api/webhooks/stripe/route.ts
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx


**Auto-update 2025-09-27**:
Detected changes in:
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/lib/constants/upload.ts


**Auto-update 2025-09-28**:
Detected changes in:
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/generate/useCreateCharacter.tsx


**Auto-update 2025-09-28**:
Detected changes in:
- webapp/src/components/debug/CreditBalanceDebug.tsx
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/lib/utils/creditOptimisticUpdates.ts


**Auto-update 2025-09-29**:
Detected changes in:
- webapp/src/app/[locale]/admin/page.tsx
- webapp/src/app/[locale]/explore/page.tsx
- webapp/src/app/[locale]/favourites/page.tsx
- webapp/src/app/[locale]/layout.tsx
- webapp/src/app/[locale]/page.tsx
- webapp/src/components/debug/CreditBalanceDebug.tsx
- webapp/src/components/generate/GenerateBar.module.css
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/header/CreditsHeaderRight.tsx
- webapp/src/components/inference/InferenceJobGroup.tsx
- webapp/src/lib/api/client.ts
- webapp/src/lib/supabase/middleware.ts
- webapp/src/lib/utils/creditOptimisticUpdates.ts


**Auto-update 2025-09-30**:
Detected changes in:
- admin/src/components/styles/style-form-dialog.tsx
- admin/src/lib/sync/engine.ts
- webapp/src/app/[locale]/admin/page.tsx
- webapp/src/app/[locale]/explore/page.tsx
- webapp/src/app/[locale]/favourites/page.tsx
- webapp/src/app/[locale]/layout.tsx
- webapp/src/app/[locale]/page.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/lib/constants/upload.ts
- webapp/src/lib/image-quality.ts


**Auto-update 2025-09-30**:
Detected changes in:
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/contexts/style-selection-context.tsx
- webapp/src/lib/constants/upload.ts
- website/src/app/[locale]/layout.tsx


**Auto-update 2025-10-02**:
Detected changes in:
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/upload/FileUploader.tsx
- webapp/src/lib/constants/upload.ts
- webapp/src/lib/image-quality.ts
- webapp/src/lib/websocket/connection-manager.ts


**Auto-update 2025-10-02**:
Detected changes in:
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/upload/FileUploader.tsx
- webapp/src/components/upload/RejectedImagesContent.module.css
- webapp/src/components/upload/RejectedImagesContent.tsx


**Auto-update 2025-10-03**:
Detected changes in:
- admin/src/app/api/admin/aws-cost/route.ts
- admin/src/app/api/admin/upload-metrics/route.ts
- admin/src/app/cost/page.tsx
- admin/src/components/layout/nav.tsx
- admin/src/lib/api/client.ts
- admin/src/lib/bot-protection.ts
- admin/src/lib/rate-limit.ts
- admin/src/lib/security-middleware.ts
- webapp/src/app/api/account/avatar/route.ts
- webapp/src/app/api/account/profile/route.ts
- webapp/src/app/api/ai-monitoring/route.ts
- webapp/src/app/api/cleanup-character/route.ts
- webapp/src/app/api/cleanup-upload/route.ts
- webapp/src/app/api/credits/balance/route.ts
- webapp/src/app/api/credits/transactions/route.ts
- webapp/src/app/api/cron/security-cleanup/route.ts
- webapp/src/app/api/inference/config/route.ts
- webapp/src/app/api/inference/delete-generated-image/route.ts
- webapp/src/app/api/payment/credit-pack-checkout/route.ts
- webapp/src/app/api/payment/subscription-checkout/route.ts
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/s3/sign/route.ts
- webapp/src/app/api/subscription/current/route.ts
- webapp/src/app/api/subscription/customer-portal/route.ts
- webapp/src/app/api/subscription/preview-upgrade/route.ts
- webapp/src/app/api/subscription/sync/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/app/api/user-images/route.ts
- webapp/src/app/layout.tsx
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/character/training/UploadPhotosStep.tsx
- webapp/src/components/generate/GenerateBar.module.css
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/inference/InferenceImageViewerDialog.tsx
- webapp/src/components/inference/InferenceJobGroup.tsx
- webapp/src/components/shared/CaptchaModal.tsx
- webapp/src/components/style/StylesCarousel.tsx
- webapp/src/components/upload/FileUploader.tsx
- webapp/src/components/upload/RejectedImagesContent.tsx
- webapp/src/contexts/style-data-context.tsx
- webapp/src/contexts/style-selection-context.tsx
- webapp/src/lib/ai-job-monitoring.ts
- webapp/src/lib/bot-protection.ts
- webapp/src/lib/rate-limit.ts
- webapp/src/lib/security-middleware.ts
- webapp/src/lib/security-monitoring.ts
- webapp/src/lib/utils/cloudfrontLoader.ts


**Auto-update 2025-10-03**:
Detected changes in:
- webapp/src/app/auth/callback/route.ts
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/character/training/OnboardingStep.tsx


**Auto-update 2025-10-03**:
Detected changes in:
- webapp/src/app/auth/callback/route.ts
- webapp/src/app/auth/verify/page.tsx
- webapp/src/components/generate/GenerateBar.tsx


**Auto-update 2025-10-04**:
Detected changes in:
- webapp/src/app/api/payment/subscription-checkout/route.ts
- webapp/src/components/character/CharacterTrainingDialog.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.module.css
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/components/providers/PurchaseSuccessHandler.tsx
- webapp/src/components/purchase/PurchaseSuccessDialog.tsx


**Auto-update 2025-10-06**:
Detected changes in:
- admin/src/app/auth/callback/route.ts
- webapp/src/app/auth/callback/route.ts
- webapp/src/components/character/CharacterTrainingDialog.tsx


**Auto-update 2025-10-06**:
Detected changes in:
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/auth/auth-code-error/page.tsx
- webapp/src/app/layout.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/shared/QueryParamCleaner.tsx
- webapp/src/components/upload/RequirementsContent.tsx
- webapp/src/lib/utils/cdn.ts
- webapp/src/lib/utils/colorSort.ts
- website/src/app/[locale]/layout.tsx
- website/src/app/[locale]/page.tsx
- website/src/app/api/waitlist/route.ts
- website/src/lib/utils/cdn.ts


**Auto-update 2025-10-08**:
Detected changes in:
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/subscription/customer-portal/route.ts
- webapp/src/app/api/upload-chunk/route.ts
- webapp/src/app/api/webhooks/stripe/route.ts
- webapp/src/app/layout.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/pricing/CreditPackDialogContent.tsx
- webapp/src/components/pricing/SubscriptionDialogContent.tsx
- webapp/src/contexts/credit-balance-context.tsx
- webapp/src/lib/image-quality.ts


**Auto-update 2025-10-10**:
Detected changes in:
- webapp/src/lib/image-quality.ts


**Auto-update 2025-10-10**:
Detected changes in:
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/generate/GenerateBar.module.css
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/inference/InferenceImageViewerDialog.module.css
- webapp/src/components/inference/InferenceImageViewerDialog.tsx
- webapp/src/components/upload/ImageQualityScore.tsx
- webapp/src/lib/utils/style-validation.ts


**Auto-update 2025-10-10**:
Detected changes in:
- webapp/src/components/inference/InferenceImageViewerDialog.module.css
- webapp/src/components/inference/InferenceImageViewerDialog.tsx


**Auto-update 2025-10-10**:
Detected changes in:
- webapp/src/components/inference/InferenceImageViewerDialog.module.css
- webapp/src/components/style/StylesCarousel.tsx


**Auto-update 2025-10-11**:
Detected changes in:
- webapp/src/lib/image-quality.ts


**Auto-update 2025-10-12**:
Detected changes in:
- webapp/src/components/generate/GenerateBar.module.css
- webapp/src/components/generate/GenerateBar.tsx
- webapp/src/components/inference/InferenceThumbnail.module.css
- webapp/src/components/style/StylesCarousel.module.css
- webapp/src/components/upload/ImageTooltip.module.css
- webapp/src/lib/image-quality.ts
- webapp/src/lib/utils/colorSort.ts


**Auto-update 2025-10-12**:
Detected changes in:
- webapp/src/components/generate/GenerateBar.module.css
- webapp/src/lib/utils/colorSort.ts


**Auto-update 2025-10-13**:
Detected changes in:
- admin/src/app/api/images/list/route.ts
- admin/src/components/ui/image-upload.tsx
- webapp/src/components/generate/GenerateBar.module.css


**Auto-update 2025-10-14**:
Detected changes in:
- webapp/src/app/api/payment/webhook/route.ts
- webapp/src/app/api/webhooks/stripe/route.ts
- webapp/src/app/globals.css
- webapp/src/app/layout.tsx
- webapp/src/components/character/training/AdminTrainingOptionsDialog.tsx
- webapp/src/components/inference/InferenceImageViewerDialog.module.css
- webapp/src/components/inference/InferenceImageViewerDialog.tsx
- webapp/src/components/inference/InferenceJobGroup.module.css
- website/src/app/[locale]/layout.tsx
- website/src/app/globals.css


**Auto-update 2025-10-14**:
Detected changes in:
- webapp/src/app/globals.css
- website/src/app/[locale]/about/page.tsx
- website/src/app/[locale]/privacy/page.tsx
- website/src/app/api/waitlist/route.ts
- website/src/app/globals.css
- website/src/components/ContentPageHeader.tsx
- website/src/components/ExploreThumb.tsx
- website/src/components/SocialIcons.tsx
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
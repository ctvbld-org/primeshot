# Product Requirements Document (PRD)

## Title
Single-Page Image Generation & LoRA Management Refactor

---

## 1. Executive Summary
Primeshot currently spreads the user journey for training LoRAs, choosing styles, and generating images across multiple screens. This PRD proposes a **major UX refactor** that consolidates the entire flow into a **single home page** while re-using large portions of the existing codebase. The refactor aims to:

1. Reduce time-to-first-image by minimising navigation.
2. Provide immediate visual feedback for every step (style, background, clothing, colour, LoRA selection, generation output).
3. Prepare the groundwork for credit-based monetisation and scalable inference powered by ComfyUI on Modal.

**Key success metrics**
- 💡 30 % reduction in average time users need to generate their first image.
- 💬 25 % decrease in support tickets related to "where do I…?" navigation.
- 💸 100 % of generation requests gated behind the new credit system.

---

## 2. UX / UI Overview
```
┌─────────────────────────────────────────── Home Page ─────────────────────────────────────────┐
│                                                                                               │
│  ⇆ Styles Carousel  ← swipe or scroll                                                         │
│  · Retro 8 mm · Studio Pro · Editorial Vogue · …                                              │
│  ──────────────────────────────────────────────────────────────────────────────────────────── │
│          ↑ Floating buttons anchored on current slide                                         │
│          • Background  • Clothing  • Colour                                                   │
│          (open full-screen option pickers)                                                    │
│                                                                                               │
│  ┌──────────── LoRA Selector ───────────┐    ┌────────── Generation Controls ───────────┐     │
│  │  Face Model ▼  (status + progress)   │    │  Takes · Aspect · Quality ·  Generate  ▶ │     │
│  │  Create / manage models              │    └──────────────────────────────────────────┘     │
│  └──────────────────────────────────────┘                                                     │
│                                                                                               │
│  ─────────────── Generated Gallery / Placeholder / Login CTA ───────────────                  │
│  |   image  |   image  |   image  |                                                           │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```
Responsive: on mobile the layout stacks vertically; floating option buttons remain fixed on the active carousel card.

### Interaction highlights
- **Carousel**: identical behaviour to existing `/styles` carousel but **without** the "Customise" button.
- **Floating buttons**: open modal sheets that reuse option-selector components; they stay anchored while swiping.
- **LoRA selector**: dropdown with avatar + live progress (reuse `face_models.tsx`).
- **Generation controls**: dropdowns for batch size, aspect ratio, quality + primary "Generate" button that shows cost in credits.
- **Gallery**: masonry grid that live-updates as images stream over WebSocket; placeholder shown when empty or unauthenticated.

---

## 3. Component Reuse & Refactor Map
| Area | Existing asset | New role | Required changes |
|------|----------------|----------|------------------|
| Styles carousel | `src/components/style/*` | Top-of-page carousel | Remove "Customise" button, add swipe events to emit style change context. |
| Background picker | `background-image-selector.tsx` | Full-screen modal content | Convert to uncontrolled component, expose `onSelect`. |
| Clothing picker | `clothing-image-selector.tsx` | Full-screen modal content | same as above |
| Colour picker | `clothing-color-selector.module.css` + current colour logic | Full-screen modal content | minor style tweak for full-screen. |
| LoRA manager | `components/create/face_models.tsx` | Left dropdown | Extract into `FaceModelSelector` component, keep WS progress logic. |
| Generation controls | existing dropdown UI primitives | Right control panel | Create wrapper component, pass chosen style/LoRA/opts to API. |
| Gallery | existing `/albums` card grid | Embedded below controls | Adapt to listen to inference WS stream. |

---

## 4. Roadmap (Top-down, Feature-by-Feature)
| Feature | Goal & Scope | Key tasks | Owner | ETA |
|---------|-------------|-----------|-------|-----|
| **F1. Styles Carousel** | Display and change selected style | • Extract carousel from `/styles`
• Remove Customise button
• Expose `onStyleChange` context | Frontend | **Week 1** |
| **F2. Floating Option Pickers** | Select background, clothing, colours | • Create generic `OptionModal`
• Reuse selectors, tighten type safety
• Update store when modal closes | Frontend | Week 1-2 |
| **F3. LoRA Selector** | Manage & choose face models | • Move `face_models.tsx` into shared component
• Ensure automatic selection persists
• Design "Create LoRA" flow entry point | Frontend | Week 2 |
| **F4. Generation Controls** | Configure takes, ratio, quality & trigger generation | • Build unified control bar
• Validate credit availability
• Disable button when prerequisites unmet | Frontend | Week 2 |
| **F5. Gallery & States** | Show generated images or placeholder | • Integrate existing album cards
• Placeholder for logged-out & empty
• Live updates via WS | Frontend | Week 3 |
| **F6. Inference Backend** | Run generation via ComfyUI on Modal | • Finalise workflows (*.json) for each style/ratio/quality
• Build Modal HTTP endpoint `/inference/start`
• WS channel for job progress & partial outputs
• Supabase function `inference-start` to trigger Modal | Backend | Week 3-4 |
| **F7. Credit-Based Payment** | Monetise generation | • Design Stripe products (credit packs + subscription?)
• Implement purchase flow & webhook
• Supabase `credits` table & RLS
• Middleware check before generation | Backend | Week 4-5 |
| **F8. QA & Roll-out** | Zero-downtime release | • Feature flag new UI
• Cross-device QA, perf audit
• Migration of existing routes linking to `/` | All | Week 6 |

Dependencies: F1-F5 mostly independent, F6 required before manual QA of F5, F7 gates "Generate" button enablement.

---

## 5. User Flow & Permission Matrix
| State | Has credits | Logged in | Can create LoRA? | Can generate images? |
|-------|-------------|-----------|------------------|----------------------|
| New visitor | ✗ | ✗ | ✗ (redirect to login) | ✗ |
| Logged-in, no credits | ✗ | ✓ | ✓ (first LoRA free) | ✗ (show buy credits) |
| Logged-in, credits | ✓ | ✓ | ✓ | ✓ |

Flow diagram available in `/docs/UX/user-flow-v2.png` (to be created) and aligns with screenshot you supplied.

---

## 6. Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Large component refactor may break existing flows | High | Feature flag + canary release |
| WebSocket performance for many concurrent jobs | Medium | Use Modal channel per user, auto-close idle sockets |
| Credit desync between Stripe & Supabase | High | Rely on Stripe webhooks + idempotent Supabase RPC verified by webhook secret |
| Long inference latency hurts UX | Medium | Pre-warm ComfyUI containers, progressive image streaming |

---

## 7. Acceptance Criteria & Definition of Done
1. Users can select style → options → LoRA → generate images within **one page**.
2. Generation button disabled until user meets: logged-in, has LoRA with `ready` status, has enough credits.
3. Gallery populates in real-time via WebSocket.
4. Credit count decrements immediately upon generation request and refunds on failure.
5. Existing routes (`/styles`, `/upload`, etc.) redirect to `/` with no hard refresh.
6. Lighthouse perf score ≥ 90 desktop, ≥ 80 mobile on home page.
7. All tasks in roadmap delivered; unit + integration tests passing.

---

## 8. Appendix
- Relevant components: see file paths listed in §3.
- Stripe products draft: `CREDIT_PACK_10`, `CREDIT_PACK_50`, `SUBSCRIPTION_MONTHLY`.

---

## 9. Deployment Strategy

### Option 2 – Two Vercel Projects with Edge Rewrites

**Overview**  
• `project-marketing` serves `/`, `/explore`, `/pricing`, …  
• `project-app` serves `/create/*` (the SPA).  
• Vercel edge rewrites forward any `/create/*` request from the marketing deployment to the SPA deployment, so the browser address remains `https://primeshot.ai`.

**Vercel configuration**  
Dashboard → Settings → Routing → **Rewrites**:  
```
Source        /create/(.*)
Destination   https://project-app.vercel.app/create/$1
```
Or via `vercel.json` in the marketing repo:  
```json
{
  "rewrites": [
    { "source": "/create",        "destination": "https://project-app.vercel.app/create" },
    { "source": "/create/:path*", "destination": "https://project-app.vercel.app/create/:path*" }
  ]
}
```

**Free-plan viability** – Rewrites are available on Vercel's Hobby (free) plan (100 GB bandwidth/month, limited build minutes).

**Session sharing** – Configure Supabase auth cookie:  
`Domain=.primeshot.ai; Path=/; Secure; SameSite=Lax`

**Local development proxy** (in marketing `next.config.js`):  
```js
module.exports = {
  async rewrites() {
    return [
      { source: '/create/:path*', destination: 'http://localhost:3001/create/:path*' }
    ];
  }
};
```

**Pros / Cons**  
Pros: independent deploys, slimmer bundles, single origin (no CORS).  
Cons: one full page reload when crossing marketing ↔ app boundary; need to maintain rewrite rules and duplicate shared header assets.

---

*Last updated: {{DATE}}* 
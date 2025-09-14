# Updates Summary

## Core Changes
- Auth: Enforced Google-only sign-in; removed email/password UI. First login grants 3 credits to new users.
- Credits: Added `user_credits`, `credit_ledger` and RPCs `grant_welcome_credits`, `adjust_credits`.
- AI Generation: Deduct 1 credit per generation; error when no credits.
- Plans/Top-ups: Stripe price→credit mapping (Basic 100, Pro 250, Max 500; Top-up 100) applied on subscription start/renewal and top-up completion.
- Checkout/Portal: Checkout accepts `priceId` and `mode`; Customer Portal opens Stripe portal for manage plan and adds “Buy 100 credits” button; Billing tab removed.
- Routing: Hid Subscription Management, Invoice Management, Usage Analytics, Payment Gateway, and Dunning pages.
- Admin Metrics: Added `admin-metrics` edge function; Billing Dashboard fetches live MRR, Active Users, Total Credits Used.

## Files Touched (high-level)
- `src/contexts/AuthContext.jsx`: Google-only, grant welcome credits.
- `src/pages/login-registration/index.jsx`: Google button only.
- `src/services/geminiService.js`: Check/deduct credits.
- `src/Routes.jsx`: Hide unused routes.
- `src/pages/customer-portal/*`: Remove Billing tab, add portal/top-up actions.
- `supabase/functions/create-checkout-session/index.ts`: Accept `priceId`/`mode`.
- `supabase/functions/stripe-webhooks/index.ts`: Map price IDs, grant credits.
- `supabase/functions/admin-metrics/index.ts`: New function.
- `src/pages/billing-dashboard/index.jsx`: Fetch and render live metrics.
- `supabase/migrations/20250912000100_credits_and_pricing.sql`: New credits schema.

## Env Vars
Frontend (Vercel/.env):
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`
- `VITE_STRIPE_PRICE_TOPUP_100`

Supabase function secrets:
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_MAX`, `STRIPE_PRICE_TOPUP_100`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

## Endpoints
- Checkout: `/functions/v1/create-checkout-session` (POST `{ priceId, mode }`)
- Portal: `/functions/v1/create-customer-portal` (POST, Authorization Bearer)
- Webhooks: `/functions/v1/stripe-webhooks`
- Admin Metrics: `/functions/v1/admin-metrics`

## Deployment Notes
- Functions deployed to project `jiibzlcutpkxhvfeblad`: `admin-metrics`, `stripe-webhooks`.
- Configure Stripe webhook to the URL above with events: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded/failed`.
- Enable Google provider and set OAuth redirect in Google & Site URL in Supabase.

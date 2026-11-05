# Demo and paywall setup

Do these in order. Step 3 must happen before step 5 or current staff lose their courses.

1. **Stripe:** create a Product and Price for each plan: recurring monthly for the monthly plans, and recurring yearly or one-time for the annual plans. Turn on the Customer Portal in Stripe Billing settings so subscribers can cancel. For organization plans, add price metadata `seats` (for example `25`) to cap seats.
   Prices: Individual $9.99/month or $98.99/year; Organization $415.99/month or $4,500/year.
   In-person training outside Michigan carries a $1,500 travel fee per trip. Invoice it separately in Stripe; Alaska and Hawaii are quoted per trip.
2. **Vercel environment variables:**
   - `FIREBASE_SERVICE_ACCOUNT`: the service account JSON from Firebase > Project settings > Service accounts
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `SITE_URL`: `https://www.graphenexacademy.com` in production
   - Any of `STRIPE_PRICE_INDIVIDUAL_MONTHLY`, `STRIPE_PRICE_INDIVIDUAL_ANNUAL`, `STRIPE_PRICE_ORG_MONTHLY`, `STRIPE_PRICE_ORG_ANNUAL`. Unset plans are hidden.
   - Optional: `DEMO_DAYS` (default 7), `ACCESS_TERM_DAYS` (default 365), `JOIN_CODE_DAYS` (default 60)
3. **Keep Angle and FPL on full access:** run `FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" npm run seed-existing-orgs`. It prints each organization's starting code for new staff. Codes expire after 60 days, and each admin sees the replacement on their dashboard.
4. **Stripe webhook:** point it at `https://<site>/api/stripe/webhook` with `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `invoice.paid` and `customer.subscription.deleted`.
5. **Deploy, then publish the rules:** run `npm test`, deploy to Vercel, then run `firebase deploy --only firestore:rules`.
   Checkout calculates sales tax automatically with Stripe Tax. Set your head office address in Stripe Tax settings, and add a registration for each state where you must collect, in both test and live mode. Without a registration Stripe charges no tax for that state. Stripe reports these plans as exempt from Michigan sales tax, so confirm the product tax code with your accountant. For production, set `SITE_URL` to `https://www.graphenexacademy.com`.
6. **Test:** with Stripe test keys, sign up, buy with card 4242 4242 4242 4242, confirm access, then cancel or refund and confirm it locks. A subscription locks when it is cancelled, not when a single invoice is refunded.

To change the demo length for existing accounts, edit `access/{uid}.trialEndsAt`. New demos use `DEMO_DAYS`.

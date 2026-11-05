import { accessTermDays, stripe } from "./server.js";

/* Amounts live in Stripe; set an env var to offer that plan. Unset plans aren't shown. */
const PLANS = {
  "individual-monthly": { env: "STRIPE_PRICE_INDIVIDUAL_MONTHLY", kind: "individual", label: "Individual Monthly" },
  "individual-annual": { env: "STRIPE_PRICE_INDIVIDUAL_ANNUAL", kind: "individual", label: "Individual Annual" },
  "org-monthly": { env: "STRIPE_PRICE_ORG_MONTHLY", kind: "organization", label: "Organization Monthly" },
  "org-annual": { env: "STRIPE_PRICE_ORG_ANNUAL", kind: "organization", label: "Organization Annual" }
};

export function getPlan(key) {
  const plan = Object.hasOwn(PLANS, key) ? PLANS[key] : null;
  const priceId = plan && process.env[plan.env];
  return priceId ? { key, ...plan, priceId } : null;
}

export async function loadPlan(key) {
  const plan = getPlan(key);
  if (!plan) return null;
  const price = await stripe().prices.retrieve(plan.priceId);
  const seats = Number(price.metadata?.seats);
  return {
    key: plan.key,
    kind: plan.kind,
    label: plan.label,
    priceId: plan.priceId,
    amount: price.unit_amount,
    interval: price.recurring?.interval || null,
    currency: price.currency,
    seats: Number.isInteger(seats) && seats > 0 ? seats : null,
    termDays: accessTermDays()
  };
}

export async function listPlans() {
  const keys = Object.keys(PLANS).filter(getPlan);
  return Promise.all(keys.map(loadPlan));
}

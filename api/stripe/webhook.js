import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { loadPlan } from "../_lib/plans.js";
import { accessTermDays, DAY_MS, db, HttpError, newJoinCode, route, stripe } from "../_lib/server.js";

export const config = { api: { bodyParser: false } };

async function rawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

/* Subscriptions keep access for a few days past each period while Stripe retries a failed card. */
const GRACE_DAYS = 3;
const INTERVAL_DAYS = { month: 31, year: 366 };

const extend = (current, plan) => {
  const from = Math.max(current?.toMillis?.() || 0, Date.now());
  const days = plan.interval
    ? (INTERVAL_DAYS[plan.interval] || 31) + GRACE_DAYS
    : accessTermDays();
  return Timestamp.fromMillis(from + days * DAY_MS);
};

const purchaseTarget = (firestore, { kind, orgId, uid }) => (kind === "organization"
  ? firestore.collection("organizations").doc(orgId)
  : firestore.collection("access").doc(uid));

async function grantPurchase(event, session) {
  if (session.payment_status !== "paid") return;
  const { uid, plan: planKey, orgId: existingOrgId, orgName } = session.metadata || {};
  const plan = await loadPlan(planKey);
  if (!uid || !plan) throw new Error(`Paid session ${session.id} has no usable plan.`);

  const firestore = db();
  const eventRef = firestore.collection("stripeEvents").doc(event.id);
  const purchaseRef = firestore.collection("purchases").doc(String(session.subscription || session.payment_intent));
  const accessRef = firestore.collection("access").doc(uid);

  await firestore.runTransaction(async (tx) => {
    const orgRef = plan.kind === "organization"
      ? (existingOrgId
        ? firestore.collection("organizations").doc(existingOrgId)
        : firestore.collection("organizations").doc(`ORG-${session.id.slice(-16)}`))
      : null;
    const [eventSnap, purchaseSnap, accessSnap, orgSnap] = await Promise.all([
      tx.get(eventRef),
      tx.get(purchaseRef),
      tx.get(accessRef),
      orgRef ? tx.get(orgRef) : Promise.resolve(null)
    ]);
    if (eventSnap.exists || purchaseSnap.exists) return;

    if (plan.kind === "individual") {
      tx.set(accessRef, {
        uid,
        plan: plan.key,
        paidUntil: extend(accessSnap.data()?.paidUntil, plan)
      }, { merge: true });
    } else if (orgSnap.exists) {
      tx.update(orgRef, {
        plan: plan.key,
        seatLimit: plan.seats,
        paidUntil: extend(orgSnap.data().paidUntil, plan)
      });
    } else {
      tx.set(orgRef, {
        name: orgName || "Organization",
        ownerUid: uid,
        plan: plan.key,
        seatLimit: plan.seats,
        seatCount: 1,
        joinCode: newJoinCode(),
        joinCodeIssuedAt: Timestamp.now(),
        paidUntil: extend(null, plan),
        createdAt: FieldValue.serverTimestamp()
      });
      tx.set(accessRef, { uid, orgId: orgRef.id }, { merge: true });
      for (const name of ["users", "profiles"]) {
        tx.set(firestore.collection(name).doc(uid), {
          uid,
          companyId: orgRef.id,
          admin: true
        }, { merge: true });
      }
    }

    tx.set(accessRef, { stripeCustomerId: session.customer || null }, { merge: true });
    tx.set(purchaseRef, {
      uid,
      plan: plan.key,
      kind: plan.kind,
      orgId: orgRef?.id || null,
      sessionId: session.id,
      createdAt: FieldValue.serverTimestamp()
    });
    tx.set(eventRef, { type: event.type, createdAt: FieldValue.serverTimestamp() });
  });
}

async function endPurchase(purchaseId) {
  const firestore = db();
  const purchaseRef = firestore.collection("purchases").doc(String(purchaseId));

  await firestore.runTransaction(async (tx) => {
    const purchase = await tx.get(purchaseRef);
    if (!purchase.exists || purchase.data().endedAt) return;
    tx.update(purchaseTarget(firestore, purchase.data()), { paidUntil: Timestamp.now() });
    tx.update(purchaseRef, { endedAt: FieldValue.serverTimestamp() });
  });
}

async function renewSubscription(event, invoice) {
  const subscriptionId = invoice.parent?.subscription_details?.subscription || invoice.subscription;
  const periodEnd = invoice.lines?.data?.[0]?.period?.end;
  if (invoice.billing_reason !== "subscription_cycle" || !subscriptionId || !periodEnd) return;

  const firestore = db();
  const purchaseRef = firestore.collection("purchases").doc(String(subscriptionId));
  const eventRef = firestore.collection("stripeEvents").doc(event.id);

  await firestore.runTransaction(async (tx) => {
    const [eventSnap, purchase] = await Promise.all([tx.get(eventRef), tx.get(purchaseRef)]);
    if (eventSnap.exists || !purchase.exists || purchase.data().endedAt) return;
    tx.update(purchaseTarget(firestore, purchase.data()), {
      paidUntil: Timestamp.fromMillis((periodEnd * 1000) + GRACE_DAYS * DAY_MS)
    });
    tx.set(eventRef, { type: event.type, createdAt: FieldValue.serverTimestamp() });
  });
}

export default route("POST", async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, "Payments are not configured yet.");

  let event;
  try {
    event = stripe().webhooks.constructEvent(
      await rawBody(req),
      req.headers["stripe-signature"],
      secret
    );
  } catch {
    throw new HttpError(400, "Invalid signature.");
  }

  if (event.type === "checkout.session.completed"
    || event.type === "checkout.session.async_payment_succeeded") {
    await grantPurchase(event, event.data.object);
  } else if (event.type === "charge.refunded") {
    const charge = event.data.object;
    if (charge.refunded && charge.payment_intent) await endPurchase(charge.payment_intent);
  } else if (event.type === "invoice.paid") {
    await renewSubscription(event, event.data.object);
  } else if (event.type === "customer.subscription.deleted") {
    await endPurchase(event.data.object.id);
  }

  return res.status(200).json({ received: true });
});

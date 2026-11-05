import assert from "node:assert/strict";
import { before, beforeEach, test } from "node:test";
import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";

process.env.STRIPE_SECRET_KEY = "sk_test_x";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.STRIPE_PRICE_INDIVIDUAL_ANNUAL = "price_ind";
process.env.STRIPE_PRICE_ORG_ANNUAL = "price_org";
process.env.STRIPE_PRICE_INDIVIDUAL_MONTHLY = "price_month";

const { db, adminAuth, stripe, describeAccess } = await import("../api/_lib/server.js");
const access = (await import("../api/access.js")).default;
const webhook = (await import("../api/stripe/webhook.js")).default;

const prices = { price_month: { unit_amount: 899, currency: "usd", metadata: {}, recurring: { interval: "month" } }, price_ind: { unit_amount: 9900, currency: "usd", metadata: {} }, price_org: { unit_amount: 50000, currency: "usd", metadata: { seats: "2" } } };
stripe().prices.retrieve = async (id) => prices[id];
Object.getPrototypeOf(adminAuth()).verifyIdToken = async (token) => ({ uid: token, email: `${token}@x.test` });

let env;
const projectId = process.env.GCLOUD_PROJECT;
before(async () => {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
  env = await initializeTestEnvironment({ projectId, firestore: { host, port: Number(port), rules: readFileSync("firebase/firestore.rules", "utf8") } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), "courses/c1"), { title: "C" }));
});

function call(handler, { uid, body, method = "POST" }) {
  return new Promise((resolve) => {
    const res = { code: 200, setHeader() {}, status(c) { this.code = c; return this; }, json(d) { resolve({ code: this.code, ...d }); } };
    handler({ method, headers: uid ? { authorization: `Bearer ${uid}` } : {}, body }, res);
  });
}
function sendEvent(event) {
  const payload = JSON.stringify(event);
  const sig = Stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test" });
  return new Promise((resolve) => {
    const req = (async function* () { yield Buffer.from(payload); })();
    req.method = "POST"; req.headers = { "stripe-signature": sig };
    const res = { code: 200, setHeader() {}, status(c) { this.code = c; return this; }, json(d) { resolve({ code: this.code, ...d }); } };
    webhook(req, res);
  });
}
const session = (id, metadata) => ({ id: `evt_${id}`, type: "checkout.session.completed", data: { object: { id: `cs_${id}`, payment_status: "paid", payment_intent: `pi_${id}`, metadata } } });
const canRead = (uid) => getDoc(doc(env.authenticatedContext(uid).firestore(), "courses/c1"));
const past = () => Timestamp.fromMillis(Date.now() - 1000);

test("new account gets 7-day demo and can read courses; demo can't be reset", async () => {
  const first = await call(access, { uid: "a" });
  assert.equal(first.state, "demo"); assert.equal(first.daysLeft, 7);
  await assertSucceeds(canRead("a"));
  const start = (await db().doc("access/a").get()).data().trialEndsAt.toMillis();
  await call(access, { uid: "a" });
  assert.equal((await db().doc("access/a").get()).data().trialEndsAt.toMillis(), start);
});

test("no access record or expired demo cannot read courses", async () => {
  await assertFails(canRead("nobody"));
  await db().doc("access/b").set({ trialEndsAt: past() });
  await assertFails(canRead("b"));
  assert.equal((await call(access, { uid: "b" })).state, "expired");
});

test("users cannot grant themselves access or edit courses", async () => {
  const f = env.authenticatedContext("c").firestore();
  await assertFails(setDoc(doc(f, "access/c"), { paidUntil: Timestamp.fromMillis(Date.now() + 1e9) }));
  await assertFails(setDoc(doc(f, "organizations/x"), { paidUntil: Timestamp.fromMillis(Date.now() + 1e9) }));
  await assertFails(getDoc(doc(f, "organizations/ANGLE")));
  await db().doc("users/c").set({ uid: "c", admin: true, companyId: "ANGLE" });
  await assertFails(setDoc(doc(f, "courses/c1"), { title: "hacked" }));
});

test("self-assigning a paid org's companyId gives no access", async () => {
  await db().doc("organizations/ANGLE").set({ paidUntil: Timestamp.fromMillis(Date.now() + 1e9), joinCode: "ABC" });
  await db().doc("access/d").set({ trialEndsAt: past() });
  const f = env.authenticatedContext("d").firestore();
  await setDoc(doc(f, "users/d"), { uid: "d", companyId: "ANGLE", admin: false });
  await assertFails(canRead("d"));
});

test("join code gives org access; bad code and full seats refused", async () => {
  await db().doc("organizations/O").set({ name: "O", paidUntil: Timestamp.fromMillis(Date.now() + 1e9), joinCode: "GOODCODE", joinCodeIssuedAt: Timestamp.now(), seatLimit: 1, seatCount: 0 });
  assert.equal((await call(access, { uid: "e", body: { joinCode: "nope" } })).code, 404);
  const ok = await call(access, { uid: "e", body: { joinCode: "goodcode" } });
  assert.equal(ok.state, "paid"); assert.equal(ok.organization.joinCode, undefined);
  assert.equal((await call(access, { uid: "f", body: { joinCode: "GOODCODE" } })).code, 403);
});

test("org code expires after 60 days and the admin gets a new one", async () => {
  const old = Timestamp.fromMillis(Date.now() - 61 * 86400000);
  await db().doc("organizations/P").set({ name: "P", paidUntil: Timestamp.fromMillis(Date.now() + 1e9), joinCode: "OLDCODE", joinCodeIssuedAt: old });
  assert.equal((await call(access, { uid: "s", body: { joinCode: "OLDCODE" } })).code, 403);
  await db().doc("access/admin").set({ orgId: "P", trialEndsAt: past() });
  await db().doc("users/admin").set({ admin: true, companyId: "P" });
  const status = await call(access, { uid: "admin" });
  assert.notEqual(status.organization.joinCode, "OLDCODE");
  assert.ok(new Date(status.organization.joinCodeExpiresAt) > new Date(Date.now() + 59 * 86400000));
  assert.equal((await call(access, { uid: "s", body: { joinCode: "OLDCODE" } })).code, 404);
  assert.equal((await call(access, { uid: "s", body: { joinCode: status.organization.joinCode } })).state, "paid");
});

test("individual purchase unlocks, repeat delivery is ignored, refund locks", async () => {
  await db().doc("access/g").set({ trialEndsAt: past() });
  assert.equal((await sendEvent(session("1", { uid: "g", plan: "individual-annual" }))).code, 200);
  await assertSucceeds(canRead("g"));
  const until = (await db().doc("access/g").get()).data().paidUntil.toMillis();
  await sendEvent(session("1", { uid: "g", plan: "individual-annual" }));
  assert.equal((await db().doc("access/g").get()).data().paidUntil.toMillis(), until);
  await sendEvent({ id: "evt_r", type: "charge.refunded", data: { object: { refunded: true, payment_intent: "pi_1" } } });
  await assertFails(canRead("g"));
});

test("org purchase creates org and makes buyer admin with a join code", async () => {
  await db().doc("access/h").set({ trialEndsAt: past() });
  await sendEvent(session("2", { uid: "h", plan: "org-annual", orgName: "Acme" }));
  const status = await call(access, { uid: "h" });
  assert.equal(status.state, "paid"); assert.equal(status.organization.name, "Acme");
  assert.equal(status.organization.seatLimit, 2); assert.match(status.organization.joinCode, /^[A-Z2-9]{12}$/);
  assert.equal((await db().doc("users/h").get()).data().admin, true);
  await assertSucceeds(canRead("h"));
});

test("monthly subscription renews on invoice and locks when cancelled", async () => {
  await db().doc("access/m").set({ trialEndsAt: past() });
  const started = session("3", { uid: "m", plan: "individual-monthly" });
  started.data.object.subscription = "sub_3";
  started.data.object.customer = "cus_3";
  await sendEvent(started);
  await assertSucceeds(canRead("m"));
  assert.equal((await call(access, { uid: "m" })).canManageBilling, true);
  const end = Math.floor(Date.now() / 1000) + 90 * 86400;
  const invoice = { billing_reason: "subscription_cycle", subscription: "sub_3", lines: { data: [{ period: { end } }] } };
  await sendEvent({ id: "evt_inv", type: "invoice.paid", data: { object: invoice } });
  assert.ok((await db().doc("access/m").get()).data().paidUntil.toMillis() > Date.now() + 89 * 86400000);
  await sendEvent({ id: "evt_del", type: "customer.subscription.deleted", data: { object: { id: "sub_3" } } });
  await assertFails(canRead("m"));
  assert.equal((await call(access, { uid: "m" })).state, "expired");
});

test("forged webhook is rejected", async () => {
  const res = await new Promise((resolve) => {
    const req = (async function* () { yield Buffer.from("{}"); })();
    req.method = "POST"; req.headers = { "stripe-signature": "bad" };
    webhook(req, { setHeader() {}, status(c) { this.code = c; return this; }, json() { resolve(this.code); } });
  });
  assert.equal(res, 400);
});

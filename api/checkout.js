import { loadPlan } from "./_lib/plans.js";
import { db, HttpError, requireUser, route, stripe } from "./_lib/server.js";

export default route("POST", async (req, res) => {
  const user = await requireUser(req);
  const plan = await loadPlan(req.body?.plan);
  if (!plan) throw new HttpError(400, "That plan isn't available.");

  const metadata = { uid: user.uid, plan: plan.key };

  if (plan.kind === "organization") {
    const userSnap = await db().collection("users").doc(user.uid).get();
    const accessSnap = await db().collection("access").doc(user.uid).get();
    const orgId = accessSnap.data()?.orgId;
    const isOrgAdmin = orgId && userSnap.data()?.admin === true && userSnap.data()?.companyId === orgId;

    if (isOrgAdmin) {
      metadata.orgId = orgId;
    } else if (orgId) {
      throw new HttpError(403, "Only your organization's administrator can renew its license.");
    } else {
      const orgName = String(req.body?.orgName || "").trim();
      if (orgName.length < 2 || orgName.length > 80) {
        throw new HttpError(400, "Enter your organization's name.");
      }
      metadata.orgName = orgName;
    }
  }

  const site = String(process.env.SITE_URL || "").replace(/\/$/, "");
  if (!site) throw new HttpError(503, "Payments are not configured yet.");

  const billing = plan.interval
    ? { mode: "subscription", subscription_data: { metadata } }
    : { mode: "payment", customer_creation: "always", payment_intent_data: { metadata } };

  const session = await stripe().checkout.sessions.create({
    ...billing,
    line_items: [{ price: plan.priceId, quantity: 1 }],
    client_reference_id: user.uid,
    customer_email: user.email,
    metadata,
    success_url: `${site}/portal-access.html?checkout=success`,
    cancel_url: `${site}/portal-access.html?checkout=cancelled`
  });

  return res.status(200).json({ url: session.url });
});

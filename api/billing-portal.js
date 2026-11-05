import { db, HttpError, requireUser, route, stripe } from "./_lib/server.js";

export default route("POST", async (req, res) => {
  const user = await requireUser(req);
  const access = (await db().collection("access").doc(user.uid).get()).data();
  if (!access?.stripeCustomerId) throw new HttpError(404, "No billing account was found.");

  const site = String(process.env.SITE_URL || "").replace(/\/$/, "");
  const session = await stripe().billingPortal.sessions.create({
    customer: access.stripeCustomerId,
    return_url: `${site}/portal-access.html`
  });
  return res.status(200).json({ url: session.url });
});

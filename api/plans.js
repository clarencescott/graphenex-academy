import { listPlans } from "./_lib/plans.js";
import { route } from "./_lib/server.js";

export default route("GET", async (_req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ plans: [] });
  }
  const plans = await listPlans();
  res.setHeader("Cache-Control", "s-maxage=300");
  return res.status(200).json({
    plans: plans.map(({ priceId, ...publicPlan }) => publicPlan)
  });
});

import { db, describeAccess, HttpError, requireUser, route } from "./_lib/server.js";

/* Demo accounts can't read the courses collection directly (Firestore rules block them),
   so this is the only way they see courses, and it only ever returns the first few. */
export const DEMO_COURSE_LIMIT = 2;

export default route("GET", async (req, res) => {
  const user = await requireUser(req);
  const accessSnap = await db().collection("access").doc(user.uid).get();
  const access = accessSnap.exists ? accessSnap.data() : null;
  const orgSnap = access?.orgId ? await db().collection("organizations").doc(access.orgId).get() : null;
  const status = describeAccess(access, orgSnap?.exists ? orgSnap.data() : null);

  if (status.state === "expired") {
    throw new HttpError(403, "Your access has ended.");
  }

  const snapshot = await db().collection("courses").get();
  const all = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((left, right) => String(left.title || "").localeCompare(String(right.title || "")) || left.id.localeCompare(right.id));
  const courses = status.state === "demo" ? all.slice(0, DEMO_COURSE_LIMIT) : all;

  return res.status(200).json({ courses, total: all.length, limited: courses.length < all.length });
});

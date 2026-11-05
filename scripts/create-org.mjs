/* Creates (or updates) an organization with full, non-expiring access, and can make one person its admin.
   FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" npm run create-org -- BIOGLYTCH "BioGlytch Studios" you@example.com
   The ID (first value) must match the id in public/js/tenant.js. The email is optional and must already have an account. */
import { getAuth } from "firebase-admin/auth";
import { Timestamp } from "firebase-admin/firestore";
import { db, newJoinCode } from "../api/_lib/server.js";

const [orgId, name, adminEmail] = process.argv.slice(2);
if (!orgId || !name) {
  console.error('Usage: npm run create-org -- ORG_ID "Organization Name" [admin-email]');
  process.exit(1);
}

const orgRef = db().collection("organizations").doc(orgId);
const existing = await orgRef.get();
const joinCode = existing.data()?.joinCode || newJoinCode();
const members = await db().collection("users").where("companyId", "==", orgId).get();

await orgRef.set({
  name,
  plan: "legacy",
  paidUntil: Timestamp.fromDate(new Date("2099-12-31T00:00:00Z")),
  joinCode,
  joinCodeIssuedAt: existing.data()?.joinCodeIssuedAt || Timestamp.now(),
  seatLimit: null,
  seatCount: members.size
}, { merge: true });
console.log(`${name} (${orgId}): full access. Code for new staff: ${joinCode}`);

if (adminEmail) {
  const user = await getAuth().getUserByEmail(adminEmail);
  await db().collection("users").doc(user.uid).set({ admin: true, companyId: orgId }, { merge: true });
  await db().collection("access").doc(user.uid).set({ uid: user.uid, orgId }, { merge: true });
  const count = (await db().collection("users").where("companyId", "==", orgId).get()).size;
  await orgRef.update({ seatCount: count });
  console.log(`${adminEmail} is now an administrator of ${name}.`);
}

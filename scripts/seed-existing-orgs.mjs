/* Run ONCE, before publishing the new Firestore rules, so current staff keep access.
   FIREBASE_SERVICE_ACCOUNT="$(cat service-account.json)" npm run seed-existing-orgs */
import { Timestamp } from "firebase-admin/firestore";
import { db, newJoinCode } from "../api/_lib/server.js";

const ORGS = { ANGLE: "Angle The Agency", FPL: "Flint Public Library" };
const paidUntil = Timestamp.fromDate(new Date("2099-12-31T00:00:00Z"));

for (const [orgId, name] of Object.entries(ORGS)) {
  const orgRef = db().collection("organizations").doc(orgId);
  const existing = await orgRef.get();
  const joinCode = existing.data()?.joinCode || newJoinCode();
  const members = await db().collection("users").where("companyId", "==", orgId).get();

  const batch = db().bulkWriter();
  batch.set(orgRef, {
    name,
    plan: "legacy",
    paidUntil,
    joinCode,
    joinCodeIssuedAt: Timestamp.now(),
    seatLimit: null,
    seatCount: members.size
  }, { merge: true });
  members.forEach((member) => {
    batch.set(db().collection("access").doc(member.id), { uid: member.id, orgId }, { merge: true });
  });
  await batch.close();
  console.log(`${name}: ${members.size} staff kept on full access. New-staff code: ${joinCode}`);
}

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  DAY_MS,
  db,
  demoDays,
  describeAccess,
  HttpError,
  joinCodeExpiry,
  newJoinCode,
  requireUser,
  route
} from "./_lib/server.js";

async function startDemoIfNew(uid) {
  const ref = db().collection("access").doc(uid);
  return db().runTransaction(async (tx) => {
    const snapshot = await tx.get(ref);
    if (snapshot.exists) return snapshot.data();
    const access = {
      uid,
      trialStartedAt: Timestamp.now(),
      trialEndsAt: Timestamp.fromMillis(Date.now() + demoDays() * DAY_MS)
    };
    tx.set(ref, access);
    return access;
  });
}

/* Runs when an admin opens the portal, so a stale code is replaced before they share it. */
async function currentOrgCode(orgRef) {
  return db().runTransaction(async (tx) => {
    const org = (await tx.get(orgRef)).data();
    if (joinCodeExpiry(org) > Date.now()) return org;
    const fresh = { joinCode: newJoinCode(), joinCodeIssuedAt: Timestamp.now() };
    tx.update(orgRef, fresh);
    return { ...org, ...fresh };
  });
}

async function joinOrganization(uid, rawCode) {
  const code = String(rawCode || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!code) throw new HttpError(400, "Enter your organization code.");

  const matches = await db().collection("organizations").where("joinCode", "==", code).limit(1).get();
  if (matches.empty) throw new HttpError(404, "That organization code wasn't found.");
  const orgRef = matches.docs[0].ref;
  const accessRef = db().collection("access").doc(uid);

  await db().runTransaction(async (tx) => {
    const [orgSnap, accessSnap] = await Promise.all([tx.get(orgRef), tx.get(accessRef)]);
    const org = orgSnap.data();
    if (accessSnap.data()?.orgId === orgRef.id) return;
    if (joinCodeExpiry(org) <= Date.now()) {
      throw new HttpError(403, "That code has expired. Ask your administrator for the new one.");
    }
    if (describeAccess(null, org).state !== "paid") {
      throw new HttpError(403, "That organization's license has ended.");
    }
    if (org.seatLimit && (org.seatCount || 0) >= org.seatLimit) {
      throw new HttpError(403, "That organization has used all of its seats.");
    }
    const previousOrgId = accessSnap.data()?.orgId;
    if (previousOrgId) {
      throw new HttpError(409, "This account already belongs to an organization.");
    }
    tx.set(accessRef, { orgId: orgRef.id }, { merge: true });
    tx.update(orgRef, { seatCount: FieldValue.increment(1) });
    for (const name of ["users", "profiles"]) {
      tx.set(db().collection(name).doc(uid), { uid, companyId: orgRef.id }, { merge: true });
    }
  });
}

export default route("POST", async (req, res) => {
  const user = await requireUser(req);
  let access = await startDemoIfNew(user.uid);

  if (req.body?.joinCode !== undefined) {
    await joinOrganization(user.uid, req.body.joinCode);
    access = (await db().collection("access").doc(user.uid).get()).data();
  }

  const orgSnap = access.orgId
    ? await db().collection("organizations").doc(access.orgId).get()
    : null;
  const org = orgSnap?.exists ? orgSnap.data() : null;
  const status = describeAccess(access, org);

  status.canManageBilling = Boolean(access.stripeCustomerId);

  if (org) {
    status.organization = { id: orgSnap.id, name: org.name };
    const userSnap = await db().collection("users").doc(user.uid).get();
    const userData = userSnap.data();
    if (userData?.admin === true && userData.companyId === orgSnap.id) {
      const code = await currentOrgCode(orgSnap.ref);
      status.organization.joinCode = code.joinCode;
      status.organization.joinCodeExpiresAt = new Date(joinCodeExpiry(code)).toISOString();
      status.organization.seatCount = org.seatCount || 0;
      status.organization.seatLimit = org.seatLimit || null;
    }
  }

  return res.status(200).json(status);
});

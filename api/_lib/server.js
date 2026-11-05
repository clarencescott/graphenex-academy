import { randomBytes } from "node:crypto";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import Stripe from "stripe";

export const DAY_MS = 86_400_000;
export const demoDays = () => Number(process.env.DEMO_DAYS || 7);
export const accessTermDays = () => Number(process.env.ACCESS_TERM_DAYS || 365);
export const joinCodeDays = () => Number(process.env.JOIN_CODE_DAYS || 60);

function firebaseApp() {
  if (getApps().length) return getApps()[0];
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    return initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-graphenex" });
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  return initializeApp({
    credential: raw ? cert(JSON.parse(raw)) : applicationDefault()
  });
}

export const db = () => getFirestore(firebaseApp());
export const adminAuth = () => getAuth(firebaseApp());

let stripeClient;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new HttpError(503, "Payments are not configured yet.");
  }
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(req) {
  const match = String(req.headers.authorization || "").match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, "Sign in to continue.");
  try {
    return await adminAuth().verifyIdToken(match[1]);
  } catch {
    throw new HttpError(401, "Your session has expired. Sign in again.");
  }
}

export function route(method, handler) {
  return async (req, res) => {
    if (req.method !== method) {
      res.setHeader("Allow", method);
      return res.status(405).json({ error: "Method not allowed." });
    }
    try {
      return await handler(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        return res.status(error.status).json({ error: error.message });
      }
      console.error(error);
      return res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  };
}

/* Unambiguous characters only; 12 of them is about 60 bits, so codes can't be guessed. */
export function newJoinCode() {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(12);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export const joinCodeExpiry = (org) => (org.joinCodeIssuedAt?.toMillis?.() || 0) + joinCodeDays() * DAY_MS;

const toMs = (value) => (value?.toMillis ? value.toMillis() : 0);

export function describeAccess(access, org, nowMs = Date.now()) {
  const trialEnds = toMs(access?.trialEndsAt);
  const paidEnds = toMs(access?.paidUntil);
  const orgEnds = toMs(org?.paidUntil);
  const paidUntil = Math.max(paidEnds, orgEnds);

  if (paidUntil > nowMs) {
    return { state: "paid", paidUntil: new Date(paidUntil).toISOString() };
  }
  if (trialEnds > nowMs) {
    return {
      state: "demo",
      trialEndsAt: new Date(trialEnds).toISOString(),
      daysLeft: Math.ceil((trialEnds - nowMs) / DAY_MS)
    };
  }
  return { state: "expired" };
}

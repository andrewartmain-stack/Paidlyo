import "server-only";
import Stripe from "stripe";

let stripe: Stripe | undefined;

/** Server-side Stripe client. Created lazily so the app runs without Stripe keys. */
export function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key);
  }
  return stripe;
}

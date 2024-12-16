console.log("stripe-checkout.js loaded");
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get("origin")}`,
      cancel_url: `${req.headers.get("origin")}`,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    const err = error as Stripe.StripeRawError;
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
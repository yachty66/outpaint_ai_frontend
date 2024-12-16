console.log("stripe-checkout.js loaded");
import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { authState } = body;

    console.log("Received auth state:", authState);
    console.log("User ID:", authState.userId);
    console.log("Email:", authState.email);
    console.log("Full request body:", body);

    const essentialMetadata = {
      userId: authState.userId,
      email: authState.email,
    };

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get(
        "origin"
      )}/success?payment_success=true&authState=${encodeURIComponent(
        JSON.stringify(authState)
      )}`,
      cancel_url: `${req.headers.get(
        "origin"
      )}/cancel?payment_canceled=true&authState=${encodeURIComponent(
        JSON.stringify(authState)
      )}`,
      metadata: essentialMetadata,
      client_reference_id: authState.userId || undefined,
    };

    console.log("Session config:", sessionConfig);

    const session = await stripe.checkout.sessions.create(sessionConfig);
    console.log("Created Stripe session:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    const err = error as Stripe.StripeError;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

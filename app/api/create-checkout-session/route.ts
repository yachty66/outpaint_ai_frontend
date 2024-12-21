import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, uploadedImage, processedImage } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL
      }/auth/callback?payment_success=true&uploadedImage=${encodeURIComponent(
        uploadedImage || ""
      )}&processedImage=${encodeURIComponent(processedImage || "")}`,
      cancel_url: process.env.NEXT_PUBLIC_SITE_URL,
      customer_email: email,
      metadata: {
        userEmail: email,
      },
    });

    return NextResponse.json({
      url: stripeSession.url,
      sessionId: stripeSession.id,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Error creating checkout session" },
      { status: 500 }
    );
  }
}

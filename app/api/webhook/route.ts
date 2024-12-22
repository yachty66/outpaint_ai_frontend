import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const event = await request.json();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerEmail = session.customer_email;

      if (!customerEmail) {
        throw new Error("No customer email found in session");
      }

      // Add 60 credits to the user's account
      const { error } = await supabase
        .from("users")
        .update({ credits: 50 })
        .eq("email", customerEmail);

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      console.log(`Added 50 credits for ${customerEmail}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

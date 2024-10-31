import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import db from "@/db/db";
import { Resend } from "resend";
import React from "react";
import PurchaseReceiptEmail from "@/email/PurchaseReceipt";

console.log("Stripe Key:", process.env.STRIPE_SECRET_KEY); // Check if key is loaded
console.log("Resend API Key:", process.env.RESEND_API_KEY); // Check if key is loaded

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-09-30.acacia",
});
const resend = new Resend(process.env.RESEND_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    console.log("Received Stripe signature:", signature);

    if (!signature) {
      console.log("Error: Signature missing");
      return NextResponse.json({ error: "Signature missing" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );
      console.log("Verified event:", event.type);
    } catch (error) {
      handleError(error, "Failed to verify event");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "payment_intent.created":
        console.log("Payment Intent Created:", event.data.object);
        return NextResponse.json({ message: "Payment intent created" }, { status: 200 });

      case "payment_intent.succeeded":
        console.log("Payment Intent Succeeded:", event.data.object);
        return NextResponse.json({ message: "Payment intent succeeded" }, { status: 200 });

      case "charge.succeeded":
        const charge = event.data.object as Stripe.Charge;
        console.log("Charge Succeeded:", charge);
        await handleChargeSucceeded(charge);
        return NextResponse.json({ message: "Charge succeeded" }, { status: 200 });

      case "charge.updated":
        console.log("Charge Updated:", event.data.object);
        return NextResponse.json({ message: "Charge updated" }, { status: 200 });

      default:
        console.warn(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ message: "Unhandled event type" }, { status: 400 });
    }
  } catch (error) {
    handleError(error, "Webhook handler failed");
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// Helper function to handle and log errors safely
function handleError(error: unknown, context: string) {
  if (error instanceof Error) {
    console.error(`${context}: ${error.message}`);
  } else {
    console.error(`${context}:`, error);
  }
}

// Handle successful charge logic
async function handleChargeSucceeded(charge: Stripe.Charge) {
  const productId = charge.metadata.productId;
  const email = charge.billing_details.email;
  const priceInCents = charge.amount;

  console.log("Handling charge succeeded for:", { productId, email, priceInCents });

  if (!productId || !email) {
    console.error("Product ID or email is missing from charge metadata.");
    throw new Error("Product ID or email is missing.");
  }

  const product = await db.product.findUnique({ where: { id: productId } });

  if (!product) {
    console.error("Product not found for ID:", productId);
    throw new Error("Product not found");
  }

  console.log("Found product:", product.name);

  // Attempt to find or create user and create order
  const user = await db.user.upsert({
    where: { email },
    create: {
      email,
      orders: {
        create: { productId, priceInCents }
      },
    },
    update: {
      orders: {
        create: { productId, priceInCents }
      },
    },
    include: { orders: true } // Include orders in the return
  });

  console.log("Order created with ID:", user.orders[user.orders.length - 1].id);

  // Create download verification token
  const downloadVerification = await db.downloadVerification.create({
    data: {
      productId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  console.log("Download verification created with ID:", downloadVerification.id);

  // Send email confirmation
  await resend.emails.send({
    from: `Support <${process.env.SENDER_EMAIL}>`,
    to: email,
    subject: "Your purchase is complete!",
    react: React.createElement(PurchaseReceiptEmail, {
      order: user.orders[user.orders.length - 1],
      product,
      downloadVerificationId: downloadVerification.id,
    }),
  });

  console.log("Purchase receipt email sent to:", email);
}

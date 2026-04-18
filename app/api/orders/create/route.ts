import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import Order from "@/models/Order";

const PIN_PRICE = 1299; // 🔥 FIXED PRICE (IMPORTANT)

// Simple in-memory per-user rate limiter (rolling window).
// NOTE: This is suitable for single-instance dev/testing only.
// For production or multi-instance deployments, use a shared store (Redis).
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 3; // max requests per window
const rateLimitMap: Map<string, number[]> = new Map();

export async function POST(req: NextRequest) {
  try {
    //////////////////////////////////////////////////////////////
    // 🔐 AUTH CHECK
    //////////////////////////////////////////////////////////////
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting: per-user rolling window
    try {
      const userKey = String(session.user.id);
      const now = Date.now();
      const timestamps = rateLimitMap.get(userKey) || [];
      // keep only timestamps within the window
      const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      if (recent.length >= RATE_LIMIT_MAX) {
        return NextResponse.json(
          { success: false, message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} requests per minute.` },
          { status: 429 }
        );
      }
      // record current request
      recent.push(now);
      rateLimitMap.set(userKey, recent);
    } catch (rlErr) {
      // If rate limiter fails for any reason, don't block the request — log and continue
      console.warn('Rate limiter error', rlErr);
    }

    // Accept either JSON or multipart/form-data (FormData)
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("form-data")) {
      const form = await req.formData();
      body = {
        quantity: form.get("quantity"),
        amount: form.get("amount"),
        transactionId: form.get("transactionId"),
        screenshotUrl: form.get("screenshotUrl"),
        packageName: form.get("packageName"),
      };
    } else {
      // Fallback: try JSON, then FormData
      try {
        body = await req.json();
      } catch (e) {
        try {
          const form = await req.formData();
          body = {
            quantity: form.get("quantity"),
            amount: form.get("amount"),
            transactionId: form.get("transactionId"),
            screenshotUrl: form.get("screenshotUrl"),
            packageName: form.get("packageName"),
          };
        } catch (err) {
          return NextResponse.json(
            { success: false, message: "Unsupported content type" },
            { status: 400 }
          );
        }
      }
    }

    // Normalize and coerce incoming fields to safe types
    const quantityRaw = body.quantity;
    const amountRaw = body.amount ?? body.packPrice ?? body.pack_price;
    // Support both `transactionId` and legacy `transactionDetails`
    const txnRaw = body.transactionId ?? body.transactionDetails ?? null;
    const transactionId = String(txnRaw || "").trim();
    const screenshotUrl = String(body.screenshotUrl || "").trim();
    // Support both `packageName` and `packName` from different callers
    const packageName = String(body.packageName || body.packName || body.pack_name || "").trim();

    const quantity = Number(quantityRaw);
    const amount = Number(amountRaw);

    //////////////////////////////////////////////////////////////
    // ❗ VALIDATION
    //////////////////////////////////////////////////////////////
    if (!quantity || !transactionId || !screenshotUrl) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid quantity" },
        { status: 400 }
      );
    }

    //////////////////////////////////////////////////////////////
    // 🔐 CONNECT DB
    //////////////////////////////////////////////////////////////
    await connectDB();

    //////////////////////////////////////////////////////////////
    // 🔍 GET USER (DO NOT TRUST FRONTEND)
    //////////////////////////////////////////////////////////////
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    //////////////////////////////////////////////////////////////
    // 🔒 AMOUNT VALIDATION (ANTI-HACK)
    //////////////////////////////////////////////////////////////
    const correctAmount = quantity * PIN_PRICE;

    // Coerce and strictly compare numbers to prevent client tampering
    if (!Number.isFinite(amount) || amount !== correctAmount) {
      return NextResponse.json(
        { success: false, message: "Invalid amount manipulation detected" },
        { status: 400 }
      );
    }

    //////////////////////////////////////////////////////////////
    // 🔒 DUPLICATE TRANSACTION CHECK (use transactionDetails field)
    //////////////////////////////////////////////////////////////
    // Normalize transaction key (many parts of app use `transactionDetails`)
    const txnKey = transactionId;
    const existingTxn = txnKey ? await Order.findOne({ transactionDetails: txnKey }) : null;

    if (existingTxn) {
      return NextResponse.json(
        { success: false, message: "Transaction already used" },
        { status: 409 }
      );
    }

    //////////////////////////////////////////////////////////////
    // 🔒 SCREENSHOT VALIDATION
    //////////////////////////////////////////////////////////////
    if (!screenshotUrl.includes("cloudinary.com")) {
      return NextResponse.json(
        { success: false, message: "Invalid screenshot source" },
        { status: 400 }
      );
    }

    //////////////////////////////////////////////////////////////
    // 🧾 CREATE ORDER (map to canonical schema fields)
    //////////////////////////////////////////////////////////////
    const order = new Order({
      // only store canonical reference to the user; do not persist duplicated name/username from client
      userId: user.userId || user._id?.toString(),

      // canonical transaction field used by admin UI
      transactionDetails: txnKey,
      transactionId: txnKey,

      // pricing / package
      quantity,
      packName: packageName || body.packName || "PIN_PACKAGE",
      packPrice: correctAmount,
      amount: correctAmount,
      packageName: packageName || null,

      // optional metadata
      screenshotUrl,

      status: "pending",
      orderType: "pack",
    });

    try {
      await order.save();
    } catch (saveErr: any) {
      // Handle duplicate-key race condition
      if (saveErr && (saveErr.code === 11000 || saveErr.name === 'MongoServerError')) {
        return NextResponse.json(
          { success: false, message: "Transaction already used" },
          { status: 409 }
        );
      }
      throw saveErr;
    }

    //////////////////////////////////////////////////////////////
    // ✅ RESPONSE
    //////////////////////////////////////////////////////////////
    return NextResponse.json({
      success: true,
      message: "Order submitted successfully",
      orderId: order._id,
    });

  } catch (error: any) {
    console.error("❌ CREATE ORDER ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}
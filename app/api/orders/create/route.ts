import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import Order from "@/models/Order";

const PIN_PRICE = 1299;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 3;
const rateLimitMap: Map<string, number[]> = new Map();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    // Debug: request start (non-sensitive)
    console.debug('[orders:create] request start', { userId: session.user.id });
    try {
      const userKey = String(session.user.id);
      const now = Date.now();
      const timestamps = rateLimitMap.get(userKey) || [];
      const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
      console.debug('[orders:create] rate check', { userId: userKey, recentCount: recent.length, windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX });
      if (recent.length >= RATE_LIMIT_MAX) {
        console.warn('[orders:create] rate limit exceeded', { userId: userKey });
        return NextResponse.json(
          { success: false, message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX} requests per minute.` },
          { status: 429 }
        );
      }
      recent.push(now);
      rateLimitMap.set(userKey, recent);
    } catch (rlErr) {
      console.warn('[orders:create] Rate limiter error', rlErr);
    }
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    console.debug('[orders:create] content-type', { contentType });

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
    const quantityRaw = body.quantity;
    const amountRaw = body.amount ?? body.packPrice ?? body.pack_price;
    const txnRaw = body.transactionId ?? body.transactionDetails ?? null;
    const transactionId = String(txnRaw || "").trim();
    const screenshotUrl = String(body.screenshotUrl || "").trim();
    const packageName = String(body.packageName || body.packName || body.pack_name || "").trim();
    const quantity = Number(quantityRaw);
    const amount = Number(amountRaw);
    if (!quantity || !transactionId || !screenshotUrl) {
      console.debug('[orders:create] validation failed - missing fields', {
        userId: session.user.id,
        missingQuantity: !quantity,
        missingTransactionId: !transactionId,
        missingScreenshot: !screenshotUrl,
      });
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    if (transactionId.length < 8) {
      console.debug('[orders:create] validation failed - short transactionId', { userId: session.user.id });
      return NextResponse.json(
        { success: false, message: "Invalid transaction ID" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) {
      console.debug('[orders:create] validation failed - invalid quantity', { userId: session.user.id, quantity });
      return NextResponse.json(
        { success: false, message: "Invalid quantity" },
        { status: 400 }
      );
    }
    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      console.warn('[orders:create] user not found', { userId: session.user.id });
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    const correctAmount = quantity * PIN_PRICE;
    if (!Number.isFinite(amount) || amount !== correctAmount) {
      console.warn('[orders:create] amount mismatch', { userId: session.user.id, quantity, amount, expected: correctAmount });
      return NextResponse.json(
        { success: false, message: "Invalid amount manipulation detected" },
        { status: 400 }
      );
    }
    const txnKey = transactionId;
    const existingTxn = txnKey
      ? await Order.findOne({
          $or: [
            { transactionDetails: txnKey },
            { transactionId: txnKey },
          ],
        })
      : null;
    if (existingTxn) {
      console.warn('[orders:create] duplicate transaction detected', { userId: session.user.id });
      return NextResponse.json(
        { success: false, message: "Transaction already used" },
        { status: 409 }
      );
    }
    const cloudNameCfg = process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudNameCfg) {
      const expectedPrefix = `https://res.cloudinary.com/${cloudNameCfg}/`;
      if (!screenshotUrl.startsWith(expectedPrefix)) {
        console.warn('[orders:create] invalid screenshot source (prefix mismatch)', { userId: session.user.id, expectedPrefix });
        return NextResponse.json(
          { success: false, message: "Invalid screenshot source" },
          { status: 400 }
        );
      }
    } else {
      if (!screenshotUrl.startsWith("https://res.cloudinary.com/")) {
        console.warn('[orders:create] invalid screenshot source (fallback check failed)', { userId: session.user.id });
        return NextResponse.json(
          { success: false, message: "Invalid screenshot source" },
          { status: 400 }
        );
      }
    }
    const order = new Order({
      userId: user.userId || user._id?.toString(),
      transactionDetails: txnKey,
      transactionId: txnKey,
      quantity,
      packName: packageName || body.packName || "PIN_PACKAGE",
      packPrice: correctAmount,
      amount: correctAmount,
      packageName: packageName || null,
      screenshotUrl,
      status: "pending",
      orderType: "pack",
    });

    try {
      await order.save();
    } catch (saveErr: any) {
      if (saveErr && (saveErr.code === 11000 || saveErr.name === 'MongoServerError')) {
        console.warn('[orders:create] save failed with duplicate key', { userId: session.user.id });
        return NextResponse.json(
          { success: false, message: "Transaction already used" },
          { status: 409 }
        );
      }
      throw saveErr;
    }
    console.info('[orders:create] order created', { userId: user.userId || user._id?.toString(), orderId: order._id?.toString() });
    return NextResponse.json({
      success: true,
      message: "Order submitted successfully",
      orderId: order._id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to create order" },
      { status: 500 }
    );
  }
}
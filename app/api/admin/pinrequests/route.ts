import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPermission } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import Order from "@/models/Order";
import User from "@/models/User";
import mongoose from "mongoose";
import crypto from "crypto";

// Generates a 12-character cryptographically unique uppercase alphanumeric string
export function generateEPin(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let pin = "";
  for (let i = 0; i < 12; i++) {
    const randomIndex = crypto.randomInt(0, chars.length);
    pin += chars[randomIndex];
  }
  return pin;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('pinrequests');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    await connectDB();

    // Fetch all orders with orderType: "pack"
    const orders = await Order.find({ orderType: "pack" }).sort({ createdAt: -1 }).lean();

    // Fetch corresponding user details for UI convenience
    const userIds = [...new Set(orders.map((o) => o.userId).filter(Boolean))];
    const users = await User.find({
      $or: [
        { userId: { $in: userIds } },
        { username: { $in: userIds } }
      ]
    }).select("userId username fullName email mobileNo phone").lean();

    // Map users for fast O(1) lookup
    const userMap = new Map();
    users.forEach((u) => {
      userMap.set(u.userId, u);
      userMap.set(u.username, u);
    });

    const data = orders.map((o) => {
      const user = o.userId ? userMap.get(o.userId) : null;
      return {
        ...o,
        user: user ? {
          fullName: user.fullName || "N/A",
          email: user.email || "N/A",
          mobileNo: user.mobileNo || user.phone || "N/A",
          userId: user.userId || user.username
        } : null
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error fetching pin requests:", err);
    return NextResponse.json({ success: false, message: err.message || "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('pinrequests');
    if (!auth.authorized) {
      return NextResponse.json({ success: false, message: auth.message }, { status: auth.status });
    }

    await connectDB();
    const body = await req.json();
    const { orderId, action, remark } = body; // action: 'approve' | 'reject'

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ success: false, message: "Invalid order ID." }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ success: false, message: `Order is already ${order.status}.` }, { status: 400 });
    }

    if (action === "reject") {
      order.status = "cancelled";
      await order.save();
      return NextResponse.json({ success: true, message: "Order rejected and cancelled." });
    }

    if (action !== "approve") {
      return NextResponse.json({ success: false, message: "Invalid action." }, { status: 400 });
    }

    // Approve logic:
    // 1. Find user associated with order
    const user = await User.findOne({
      $or: [
        { userId: order.userId },
        { username: order.userId }
      ]
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User associated with this order not found." }, { status: 404 });
    }

    const qty = order.quantity || 1;

    // 2. Generate cryptographically unique pins
    const pins = [];
    for (let i = 0; i < qty; i++) {
      pins.push(generateEPin());
    }

    const now = new Date();
    const newEPins = pins.map((pin) => ({
      pin,
      packageName: "EPIN",
      status: "Active" as const,
      remark: remark?.trim() || `Approved & sent by admin on ${now.toLocaleDateString("en-IN")}`,
    }));

    const purchaseEntry = {
      date: now,
      packageName: "EPIN",
      quantity: qty,
      totalAmount: order.amount || (qty * 1299),
      paymentId: order.transactionId || order.transactionDetails || `ADMIN-${Date.now()}`,
      status: "Success" as const,
    };

    const existingReqs = user.pinRequests?.length ?? 0;
    const pinRequestEntry = {
      srNo: existingReqs + 1,
      requestNo: `REQ-${order._id.toString().slice(-8).toUpperCase()}`,
      date: now,
      memberId: user.userId ?? user.username,
      name: user.fullName ?? user.username,
      totalPins: qty,
      totalAmount: String(order.amount || (qty * 1299)),
      description: `E-Pin Purchase Approved: ${qty}x EPIN(s) credited. Txn: ${order.transactionId || order.transactionDetails}`,
      type: "Credit" as const,
    };

    // Update user document (add epins, purchase history, and pin request logging)
    await User.findByIdAndUpdate(
      user._id,
      {
        $push: {
          ePins: { $each: newEPins },
          pinPurchaseHistory: purchaseEntry,
          pinRequests: pinRequestEntry,
        },
        $inc: {
          activePins: qty,
          totalPins: qty,
        }
      },
      { runValidators: false }
    );

    // Update order status to completed
    order.status = "completed";
    await order.save();

    return NextResponse.json({
      success: true,
      message: `Successfully approved and credited ${qty} EPIN(s) to ${user.fullName || user.username}.`,
      pins,
    });
  } catch (err: any) {
    console.error("Error approving pin request:", err);
    return NextResponse.json({ success: false, message: err.message || "Internal server error." }, { status: 500 });
  }
}

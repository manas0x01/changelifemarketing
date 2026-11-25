import { NextResponse } from "next/server";
import { verifyAdminPermission } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

// Real-time "Impact in Numbers" — visible to admins only.
export async function GET() {
  try {
    const auth = await verifyAdminPermission("dashboard");
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.message }, { status: auth.status });
    }

    await connectDB();

    const [membersJoined, productNames, states, incomeAgg] = await Promise.all([
      User.countDocuments(),
      Order.distinct("productName", { orderType: "product", productName: { $nin: [null, ""] } }),
      User.distinct("state", { state: { $nin: [null, ""] } }),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$totalIncome" } } }]),
    ]);

    const normalizedStates = new Set(
      (states as string[]).map((s) => s.trim().toLowerCase()).filter(Boolean)
    );

    return NextResponse.json(
      {
        success: true,
        updatedAt: new Date().toISOString(),
        stats: {
          membersJoined,
          productsAvailable: productNames.length,
          statesActive: normalizedStates.size,
          incomeDistributed: incomeAgg[0]?.total || 0,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("❌ IMPACT STATS ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch impact stats" }, { status: 500 });
  }
}

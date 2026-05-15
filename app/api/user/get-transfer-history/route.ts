import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username }).select("transferHistory");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Map transfer history to the format expected by the page
    const transfers = (user.transferHistory || []).map((t: any, index: number) => ({
      srNo: t.srNo || index + 1,
      reqNo: t.reqNo || "N/A",
      fromUser: t.fromUser || "N/A",
      fromUserName: t.fromUserName || "N/A",
      transferType: t.transferType || "N/A",
      transferRejectDate: t.transferRejectDate ? new Date(t.transferRejectDate).toLocaleString("en-GB") : "N/A",
      transferRejectDateISO: t.transferRejectDate,
      package: t.package || "N/A",
      quantity: t.quantity || 0,
      amount: t.amount || "0",
      status: t.status || "Pending"
    }));

    return NextResponse.json({
      success: true,
      transfers
    });

  } catch (error) {
    console.error("❌ GET TRANSFER HISTORY ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch transfer history" }, { status: 500 });
  }
}

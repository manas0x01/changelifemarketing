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

    const user = await User.findOne({ username: session.user.username }).select("boosterIncomeRecords");

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const formattedData = (user.boosterIncomeRecords || []).map((record: any, index: number) => {
      let dateStr = "N/A";
      if (record.date) {
        const d = new Date(record.date);
        dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }

      return {
        srNo: record.srNo || index + 1,
        amount: `₹${(record.amount || 0).toLocaleString("en-IN")}`,
        rawAmount: record.amount || 0,
        pairCount: record.pairCount || 0,
        date: dateStr,
        description: record.description || "Booster Matching Income",
        status: record.status || "Paid"
      };
    });

    // Sort by SR No or Date descending
    formattedData.sort((a, b) => b.srNo - a.srNo);

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error("❌ GET BOOSTER INCOME ERROR:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch booster income data" }, { status: 500 });
  }
}

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

    const user = await User.findOne({ username: session.user.username });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Get booster matching records (actual data source)
    const matchingRecords = user.boosterMatchingRecords || [];

    const formattedData = matchingRecords.map((record: any, index: number) => {
      let dateStr = "N/A";
      if (record.date) {
        const d = new Date(record.date);
        dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }

      const paidPairs = record.paidPairs || 0;
      const totalPairs = record.pairsMatched || 0;

      // Check if cap was applied (more pairs matched than paid)
      const isCapped = totalPairs > paidPairs;
      const description = isCapped ? `Booster Matching Income (Capped)` : `Booster Matching Income`;

      return {
        srNo: index + 1,
        amount: `₹${(paidPairs * 1000).toLocaleString("en-IN")}`,
        rawAmount: paidPairs * 1000,
        pairCount: paidPairs,
        date: dateStr,
        description: description,
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

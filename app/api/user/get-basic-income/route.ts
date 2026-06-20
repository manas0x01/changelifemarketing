import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Find the user
    const user = await User.findOne({
      $or: [
        { userId: { $regex: new RegExp(`^${session.user.username}$`, 'i') } },
        { username: { $regex: new RegExp(`^${session.user.username}$`, 'i') } }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get basic income records from sessionBasedIncome (more accurate)
    const sessionRecords = user.sessionBasedIncome || [];

    // Format records for frontend - show actual income only
    const formattedRecords = sessionRecords.map((session: any, index: number) => {
      const dateStr = session.date ? new Date(session.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
      const sessionNum = index + 1;
      
      // Check if this is a cut session (0 income but has pairs)
      const isCut = session.netIncome === 0 && session.pairs > 0;

      // Use the stored description if available, otherwise fall back to a sensible default
      const storedDesc = session.description || "";
      const description = storedDesc.trim()
        ? storedDesc
        : isCut
          ? `Basic Session #${sessionNum} Cut`
          : `Binary Income`;

      // Show correct status: Cut sessions are "Hold" (income withheld), paid sessions are "Paid"
      const status = isCut ? "Hold" : "Paid";
      
      return {
        srNo: index + 1,
        amount: `₹${session.netIncome || 0}`,
        rawAmount: session.netIncome || 0,
        pairCount: session.pairs || 0,
        date: dateStr,
        description,
        status,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedRecords,
      totalIncome: user.basicIncome || 0,
      totalPairs: user.basicPairs || 0,
    });

  } catch (error: any) {
    console.error("Error fetching basic income:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch basic income data" },
      { status: 500 }
    );
  }
}

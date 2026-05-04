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

    // Get basic income records
    const incomeRecords = user.basicIncomeRecords || [];

    // Format records for frontend
    const formattedRecords = incomeRecords.map((record: any, index: number) => ({
      srNo: record.srNo || index + 1,
      amount: `₹${record.amount || 0}`,
      rawAmount: record.amount || 0,
      pairCount: record.pairCount || 1,
      date: record.date ? new Date(record.date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      description: record.description || "Pair completed",
      status: (record.status as "Paid" | "Pending" | "Hold") || "Paid",
    }));

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

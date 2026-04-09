import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/database";

interface IncomeRow {
  srNo: number;
  amount: string;
  rawAmount: number; // ✅ For calculations
  pairCount: number;
  date: string;
  description: string;
  status: "Paid" | "Pending" | "Hold";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.username) {
      return Response.json({ 
        success: false,
        error: "Not authenticated",
        data: []
      }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username }).select(
      "boosterIncome boosterIncomeRecords boosterMatchingRecords"
    );

    if (!user) {
      return Response.json({ 
        success: false,
        error: "User not found",
        data: []
      }, { status: 404 });
    }
    
    // ✅ Use actual boosterIncomeRecords from database, not mock data
    const records = (user.boosterIncomeRecords || user.boosterMatchingRecords || []);
    
    const formattedRecords: IncomeRow[] = records.map((record: any) => ({
      srNo: record.srNo || 0,
      amount: `₹${record.amount ? record.amount.toLocaleString('en-IN') : '0'}`,
      rawAmount: record.amount || 0, // ✅ Raw number for calculations
      pairCount: record.pairCount || record.pairsMatched || 0,
      date: record.date ? new Date(record.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : '--',
      description: record.description || 'Booster Income',
      status: record.status || 'Pending',
    }));

    const boosterIncomeData = user.boosterIncome || { LG: 0, RG: 0, totalBoosterMatching: 0 };

    return Response.json({ 
      success: true,
      data: formattedRecords,
      boosterIncome: boosterIncomeData,
      totalRecords: formattedRecords.length,
      message: formattedRecords.length === 0 ? "No booster income records found" : "Records fetched successfully"
    });
  } catch (error) {
    console.error('Error in get-booster-income:', error);
    return Response.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Error fetching data",
        data: []
      },
      { status: 500 }
    );
  }
}


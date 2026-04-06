import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/database";

interface IncomeRow {
  srNo: number;
  amount: string;
  pairCount: number;
  date: string;
  description: string;
  status: "Paid" | "Pending" | "Hold";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select(
      "boosterIncome username"
    );

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    const boosterIncomeData = user.boosterIncome || { LG: 0, RG: 0, totalGoldMatching: 0 };

    const incomeRecords: IncomeRow[] = [
      {
        srNo: 1,
        amount: "₹1,000",
        pairCount: 2,
        date: "10-Jan-2026",
        description: "Booster Income",
        status: "Paid",
      },
      {
        srNo: 2,
        amount: "₹2,500",
        pairCount: 5,
        date: "23-Oct-2025",
        description: "Booster Income",
        status: "Paid",
      },
      {
        srNo: 3,
        amount: "₹1,000",
        pairCount: 2,
        date: "01-Oct-2025",
        description: "Booster Income",
        status: "Pending",
      },
      {
        srNo: 4,
        amount: "₹3,000",
        pairCount: 6,
        date: "20-Sep-2025",
        description: "Booster Income",
        status: "Paid",
      },
      {
        srNo: 5,
        amount: "₹500",
        pairCount: 1,
        date: "18-Sep-2025",
        description: "Booster Income",
        status: "Hold",
      },
      {
        srNo: 6,
        amount: "₹2,000",
        pairCount: 4,
        date: "05-Aug-2025",
        description: "Booster Income",
        status: "Paid",
      },
    ];

    return Response.json({ data: incomeRecords });
  } catch (error) {
    console.error("Error fetching booster income:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Error fetching data" },
      { status: 500 }
    );
  }
}


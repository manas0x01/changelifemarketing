import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/database";

interface BoosterCountingRow {
  srNo: number;
  rbv: number;
  lbv: number;
  rCarry: number;
  lCarry: number;
  matching: number;
  date: string;
  fromMemberId: string;
  product: string;
  description: string;
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
    const user = await User.findOne({ username: session.user.username }).select("boosterCounting");
    if (!user) {
      return Response.json({ 
        success: false,
        error: "User not found",
        data: []
      }, { status: 404 });
    }
    const records = (user.boosterCounting || []);
    const boosterCountingRecords: BoosterCountingRow[] = records.map((record: any, idx: number) => {
      const formattedDate = record.date ? new Date(record.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) : '--';
      
      const formatted = {
        srNo: record.srNo || 0,
        rbv: record.RBV || 0,
        lbv: record.LBV || 0,
        rCarry: record.RCarry || 0,
        lCarry: record.LCarry || 0,
        matching: record.matching || 0,
        date: formattedDate,
        fromMemberId: record.fromMemberId || 'N/A',
        product: record.product || 'N/A',
        description: record.description || 'Booster Counting'
      };
      return formatted;
    });
    const responseData = {
      success: true, 
      data: boosterCountingRecords,
      totalRecords: boosterCountingRecords.length,
      message: boosterCountingRecords.length === 0 ? "No booster counting records found" : "Records fetched successfully"
    };
    return Response.json(responseData);
  } catch (error) {
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Error fetching booster counting records",
        data: []
      },
      { status: 500 }
    );
  }
}

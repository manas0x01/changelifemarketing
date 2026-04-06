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

    if (!session?.user?.email) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).select("username boosterIncome");

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const boosterCountingRecords: BoosterCountingRow[] = [
      { srNo: 1, rbv: 500, lbv: 500, rCarry: 0, lCarry: 0, matching: 1, date: "10-Jan-2026", fromMemberId: "SM138501", product: "Agriculture Package", description: "Booster Counting" },
      { srNo: 2, rbv: 1000, lbv: 500, rCarry: 500, lCarry: 0, matching: 1, date: "23-Oct-2025", fromMemberId: "SM649260", product: "Healthcare Package", description: "Booster Counting" },
      { srNo: 3, rbv: 500, lbv: 1000, rCarry: 0, lCarry: 500, matching: 1, date: "01-Oct-2025", fromMemberId: "SM491066", product: "Sanitary Napkine", description: "Booster Counting" },
      { srNo: 4, rbv: 1500, lbv: 1000, rCarry: 500, lCarry: 0, matching: 2, date: "20-Sep-2025", fromMemberId: "SM873277", product: "Agriculture Package", description: "Booster Counting" },
      { srNo: 5, rbv: 500, lbv: 500, rCarry: 0, lCarry: 0, matching: 1, date: "18-Sep-2025", fromMemberId: "SM408648", product: "Healthcare Package", description: "Booster Counting" },
      { srNo: 6, rbv: 2000, lbv: 1500, rCarry: 500, lCarry: 0, matching: 3, date: "05-Aug-2025", fromMemberId: "SM943014", product: "Agriculture Package", description: "Booster Counting" },
    ];

    return Response.json({ success: true, data: boosterCountingRecords });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Error fetching booster counting records" },
      { status: 500 }
    );
  }
}

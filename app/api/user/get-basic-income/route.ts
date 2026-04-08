import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.username) {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        await connectDB();
        const user = await User.findOne({ username: session.user.username });

        if (!user) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 });
        }
        
        // Format records with proper structure
        const data = (user.basicIncomeRecords || []).map((record: any) => ({
            srNo: record.srNo || 0,
            amount: `₹${record.amount ? record.amount.toLocaleString('en-IN') : '0'}`,
            pairCount: record.pairCount || 0,
            date: record.date ? new Date(record.date).toLocaleDateString('en-IN') : '--',
            description: record.description || '--',
            status: record.status || 'Pending',
        }));
        
        return Response.json({
            success: true,
            data,
            basicIncome: user.basicIncome || 0,
            basicIncomeRecords: user.basicIncomeRecords || [],
        });
    } catch (error) {
        console.error('Error in get-basic-income:', error);
        return Response.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

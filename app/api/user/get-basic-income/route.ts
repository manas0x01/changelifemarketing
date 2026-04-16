import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        console.log('🟢 [GET] /api/user/get-basic-income - Entry');
        const session = await getServerSession(authOptions);
        console.log('👤 Session:', session);
        if (!session?.user?.username) {
            console.log('🔴 Unauthorized access attempt');
            return Response.json({ 
                success: false, 
                message: "Unauthorized",
                data: []
            }, { status: 401 });
        }
        
        await connectDB();
        console.log('✅ Database connected');
        const user = await User.findOne({ username: session.user.username });
        console.log('👤 User fetched:', user ? user.username : null);

        if (!user) {
            console.log('🔴 User not found');
            return Response.json({ 
                success: false, 
                message: "User not found",
                data: []
            }, { status: 404 });
        }
        
        // ✅ Format records with proper structure including raw amount
        const data = (user.basicIncomeRecords || []).map((record: any) => ({
            srNo: record.srNo || 0,
            amount: `₹${record.amount ? record.amount.toLocaleString('en-IN') : '0'}`,
            rawAmount: record.amount || 0, // ✅ Raw number for calculations
            pairCount: record.pairCount || 0,
            date: record.date ? new Date(record.date).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit'
            }) : '--',
            description: record.description || '--',
            status: record.status || 'Pending',
        }));
        console.log('📦 Formatted records count:', data.length);
        
        const response = {
            success: true,
            data,
            basicIncome: user.basicIncome || 0,
            basicIncomeRecords: user.basicIncomeRecords || [],
            totalRecords: data.length,
            message: data.length === 0 ? "No basic income records found" : "Records fetched successfully"
        };
        console.log('📤 Response payload:', response);
        return Response.json(response);
    } catch (error) {
        console.log('❌ Error in [GET] /api/user/get-basic-income:', error);
        return Response.json(
            { 
                success: false, 
                message: "Internal server error",
                error: error instanceof Error ? error.message : "Unknown error",
                data: []
            },
            { status: 500 }
        );
    }
}


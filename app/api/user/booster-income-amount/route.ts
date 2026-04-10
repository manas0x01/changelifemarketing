import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
export async function GET(req: Request) {
    try {
        console.log('💸 [API] BOOSTER-INCOME-AMOUNT - Starting...');
        const session = await getServerSession(authOptions);
        if (!session?.user?.username) {
            console.log('❌ [API] BOOSTER-INCOME-AMOUNT - Unauthorized: No session');
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        console.log('✅ [API] BOOSTER-INCOME-AMOUNT - Session found:', session.user.username);
        
        await connectDB();
        console.log('📊 [API] BOOSTER-INCOME-AMOUNT - Database connected');
        
        const user = await User.findOne({ username: session.user.username });
        if (!user) {
            console.log('❌ [API] BOOSTER-INCOME-AMOUNT - User not found:', session.user.username);
            return Response.json({ success: true, boosterIncomeAmount: 0 });
        }
        
        const amount = user.boosterIncomeAmount || 0;
        console.log('✅ [API] BOOSTER-INCOME-AMOUNT - Amount retrieved:', amount);
        
        return Response.json({
            success: true,
            boosterIncomeAmount: amount,
        });
    } catch (error) {
        console.error('❌ [API] BOOSTER-INCOME-AMOUNT - Error:', error);
        return Response.json({ success: true, boosterIncomeAmount: 0 });
    }
}

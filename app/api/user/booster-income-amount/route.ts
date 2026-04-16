import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";
export async function GET(req: Request) {
    try {
        console.log('\n💰 [BOOSTER-INCOME-AMOUNT] GET request received');
        
        console.log('  🔐 Retrieving server session...');
        const session = await getServerSession(authOptions);
        console.log(`  ${session ? '✅' : '❌'} Session found: ${session ? 'Yes' : 'No'}`);
        
        if (!session?.user?.username) {
            console.error('  ❌ UNAUTHORIZED - No session or username');
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        console.log(`  ✅ Username from session: "${session.user.username}"`);
        
        console.log('  📂 Connecting to MongoDB...');
        await connectDB();
        console.log('  ✅ Database connected');
        
        console.log(`  👤 Querying user data for username: "${session.user.username}"...`);
        const user = await User.findOne({ username: session.user.username });
        console.log(`  ${user ? '✅' : '❌'} User lookup result: ${user ? 'Found' : 'Not found'}`);
        
        if (!user) {
            console.log('  ⚠️ User not found - Returning default 0 booster income amount');
            return Response.json({ success: true, boosterIncomeAmount: 0 });
        }
        
        console.log('  💵 Extracting booster income amount from user record...');
        const amount = user.boosterIncomeAmount || 0;
        console.log(`    - Booster Income Amount: ₹${amount}`);
        
        console.log('  📤 Preparing response...');
        console.log(`  ✅ Response ready - Amount: ₹${amount}\n`);
        
        return Response.json({
            success: true,
            boosterIncomeAmount: amount,
        });
    } catch (error) {
        console.error(`  💥 ERROR caught in try-catch`);
        console.error(`    - Error type: ${error instanceof Error ? error.name : typeof error}`);
        console.error(`    - Error message: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`  ⚠️ Returning default 0 booster income amount response\n`);
        
        return Response.json({ success: true, boosterIncomeAmount: 0 });
    }
}

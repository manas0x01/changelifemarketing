import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        console.log('\n💵 [BOOSTER-INCOME] GET request received');
        
        console.log('  🔐 Retrieving server session...');
        const session = await getServerSession(authOptions);
        console.log(`  ${session ? '✅' : '❌'} Session found: ${session ? 'Yes' : 'No'}`);
        
        if (!session || !session.user?.username) {
            console.log('  ⚠️ No session or username - Returning default 0 booster income');
            return NextResponse.json({
                success: true,
                boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
            });
        }
        console.log(`  ✅ Username from session: "${session.user.username}"`);
        
        console.log('  📂 Connecting to MongoDB...');
        await connectDB();
        console.log('  ✅ Database connected');
        
        console.log(`  👤 Querying user data for username: "${session.user.username}"...`);
        const user = await User.findOne({ username: session.user.username }).select('boosterIncome');
        console.log(`  ${user ? '✅' : '❌'} User lookup result: ${user ? 'Found' : 'Not found'}`);
        
        if (!user) {
            console.log('  ⚠️ User not found - Returning default 0 booster income');
            return NextResponse.json({
                success: true,
                boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
            });
        }
        
        console.log('  📊 Extracting booster income data from user record...');
        const boosterData = user.boosterIncome || { LG: 0, RG: 0, totalBoosterMatching: 0 };
        console.log(`    - Left Gain (LG): ₹${boosterData.LG}`);
        console.log(`    - Right Gain (RG): ₹${boosterData.RG}`);
        console.log(`    - Total Booster Matching: ${boosterData.totalBoosterMatching} pairs`);
        console.log(`    - Total Income: ₹${(boosterData.LG + boosterData.RG)}`);
        
        console.log('  📤 Preparing response...');
        console.log(`  ✅ Response ready with booster income data\n`);
        
        return NextResponse.json({
            success: true,
            boosterIncome: boosterData
        });
    } catch (error) {
        console.error(`  💥 ERROR caught in try-catch`);
        console.error(`    - Error type: ${error instanceof Error ? error.name : typeof error}`);
        console.error(`    - Error message: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`  ⚠️ Returning default 0 booster income response\n`);
        
        return NextResponse.json({
            success: true,
            boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
        });
    }
}

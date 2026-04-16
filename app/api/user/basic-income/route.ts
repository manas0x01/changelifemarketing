import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        console.log('\n💰 [BASIC-INCOME] GET request received');
        
        console.log('  🔐 Retrieving server session...');
        const session = await getServerSession(authOptions);
        console.log(`  ${session ? '✅' : '❌'} Session found: ${session ? 'Yes' : 'No'}`);
        
        if (!session || !session.user?.username) {
            console.log('  ⚠️ No session or username - Returning default 0 income');
            return NextResponse.json({
                success: true,
                basicIncome: 0
            });
        }
        console.log(`  ✅ Username from session: "${session.user.username}"`);
        
        console.log('  📂 Connecting to MongoDB...');
        await connectDB();
        console.log('  ✅ Database connected');
        
        console.log(`  👤 Querying user data for username: "${session.user.username}"...`);
        const user = await User.findOne({ username: session.user.username })
            .select('basicIncome sessionBasedIncome basicIncomeRecords');
        console.log(`  ${user ? '✅' : '❌'} User lookup result: ${user ? 'Found' : 'Not found'}`);

        if (!user) {
            console.log('  ⚠️ User not found - Returning default 0 income');
            return NextResponse.json({
                success: true,
                basicIncome: 0
            });
        }
        
        console.log('  📊 Calculating basic income...');
        let calculatedBasicIncome = 0;
        
        if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
            console.log(`    📚 Session-based income records found: ${user.sessionBasedIncome.length}`);
            calculatedBasicIncome = user.sessionBasedIncome.reduce(
                (sum: number, session: any) => {
                    const netIncome = session.netIncome || 0;
                    console.log(`      → Session: netIncome=₹${netIncome}, Running total=₹${sum + netIncome}`);
                    return sum + netIncome;
                }, 
                0
            );
            console.log(`    💵 Total calculated from sessions: ₹${calculatedBasicIncome}`);
        } else {
            console.log(`    ⚠️ No session-based income records (${user.sessionBasedIncome?.length || 0})`);
        }
        
        const storedBasicIncome = user.basicIncome || 0;
        console.log(`  💾 Stored basic income in user record: ₹${storedBasicIncome}`);
        
        const finalIncome = calculatedBasicIncome || storedBasicIncome;
        const source = calculatedBasicIncome > 0 ? 'session-based-income' : 'stored-field';
        console.log(`  🌟 Final income determination:`);
        console.log(`    - Calculated: ₹${calculatedBasicIncome}`);
        console.log(`    - Stored: ₹${storedBasicIncome}`);
        console.log(`    - Final: ₹${finalIncome}`);
        console.log(`    - Source: ${source}`);
        
        console.log('  📤 Preparing response...');
        return NextResponse.json({
            success: true,
            basicIncome: finalIncome,
            breakdown: {
                calculatedFromSessions: calculatedBasicIncome,
                storedValue: storedBasicIncome,
                source: calculatedBasicIncome > 0 ? 'session-based-income' : 'stored-field',
            }
        });
        console.log('  ✅ Response sent successfully\n');

    } catch (error) {
        console.error(`  💥 ERROR caught in try-catch`);
        console.error(`    - Error type: ${error instanceof Error ? error.name : typeof error}`);
        console.error(`    - Error message: ${error instanceof Error ? error.message : String(error)}`);
        console.error(`  ⚠️ Returning default 0 income response\n`);
        
        return NextResponse.json({
            success: true,
            basicIncome: 0
        });
    }
}

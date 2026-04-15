import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        console.log('💰 [API] BASIC-INCOME - Starting...');
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.username) {
            console.log('❌ [API] BASIC-INCOME - Unauthorized: No session');
            return NextResponse.json({
                success: true,
                basicIncome: 0
            });
        }
        console.log('✅ [API] BASIC-INCOME - Session found:', session.user.username);
        
        await connectDB();
        console.log('📊 [API] BASIC-INCOME - Database connected');

        const user = await User.findOne({ username: session.user.username })
            .select('basicIncome sessionBasedIncome basicIncomeRecords');

        if (!user) {
            console.log('❌ [API] BASIC-INCOME - User not found:', session.user.username);
            return NextResponse.json({
                success: true,
                basicIncome: 0
            });
        }
        console.log('✅ [API] BASIC-INCOME - User found');

        // ✅ CALCULATE BASIC INCOME FROM SESSION RECORDS
        // This ensures we respect the ₹1000 per session cap and ₹2000 daily cap
        let calculatedBasicIncome = 0;

        // Method 1: Sum from sessionBasedIncome (most accurate - respects session caps)
        if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
            calculatedBasicIncome = user.sessionBasedIncome.reduce(
                (sum: number, session: any) => sum + (session.netIncome || 0), 
                0
            );
            console.log('📝 [API] BASIC-INCOME - Calculated from sessions:', calculatedBasicIncome);
        }

        // Method 2: Fallback to basicIncome field if available
        const storedBasicIncome = user.basicIncome || 0;
        console.log('📝 [API] BASIC-INCOME - Stored value:', storedBasicIncome);

        const finalIncome = calculatedBasicIncome || storedBasicIncome;
        console.log('✅ [API] BASIC-INCOME - Final income:', finalIncome);
        return NextResponse.json({
            success: true,
            basicIncome: finalIncome,
            breakdown: {
                calculatedFromSessions: calculatedBasicIncome,
                storedValue: storedBasicIncome,
                source: calculatedBasicIncome > 0 ? 'session-based-income' : 'stored-field',
            }
        });

    } catch (error) {
        console.error('❌ [API] BASIC-INCOME - Error:', error);
        return NextResponse.json({
            success: true,
            basicIncome: 0
        });
    }
}

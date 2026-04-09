import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.username) {
            return NextResponse.json({
                success: true,
                basicIncome: 0
            });
        }
        await connectDB();

        const user = await User.findOne({ username: session.user.username })
            .select('basicIncome sessionBasedIncome basicIncomeRecords');

        if (!user) {
            return NextResponse.json({
                success: true,
                basicIncome: 0
            });
        }

        // ✅ CALCULATE BASIC INCOME FROM SESSION RECORDS
        // This ensures we respect the ₹1000 per session cap and ₹2000 daily cap
        let calculatedBasicIncome = 0;

        // Method 1: Sum from sessionBasedIncome (most accurate - respects session caps)
        if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
            calculatedBasicIncome = user.sessionBasedIncome.reduce(
                (sum: number, session: any) => sum + (session.netIncome || 0), 
                0
            );
        }

        // Method 2: Fallback to basicIncome field if available
        const storedBasicIncome = user.basicIncome || 0;

        // Return the calculated value (which respects session caps)
        // If both are 0, that's fine - user hasn't completed any pairs yet
        return NextResponse.json({
            success: true,
            basicIncome: calculatedBasicIncome || storedBasicIncome,
            breakdown: {
                calculatedFromSessions: calculatedBasicIncome,
                storedValue: storedBasicIncome,
                source: calculatedBasicIncome > 0 ? 'session-based-income' : 'stored-field',
            }
        });

    } catch (error) {
        console.error('Error fetching basic income:', error);
        return NextResponse.json({
            success: true,
            basicIncome: 0
        });
    }
}

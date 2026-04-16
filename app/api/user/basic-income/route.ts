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
        let calculatedBasicIncome = 0;
        if (user.sessionBasedIncome && user.sessionBasedIncome.length > 0) {
            calculatedBasicIncome = user.sessionBasedIncome.reduce(
                (sum: number, session: any) => sum + (session.netIncome || 0), 
                0
            );
        }
        const storedBasicIncome = user.basicIncome || 0;
        const finalIncome = calculatedBasicIncome || storedBasicIncome;
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
        return NextResponse.json({
            success: true,
            basicIncome: 0
        });
    }
}

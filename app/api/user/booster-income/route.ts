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
                boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
            });
        }
        await connectDB();
        const user = await User.findOne({ username: session.user.username }).select('boosterIncome');
        if (!user) {
            return NextResponse.json({
                success: true,
                boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
            });
        }
        return NextResponse.json({
            success: true,
            boosterIncome: user.boosterIncome || { LG: 0, RG: 0, totalBoosterMatching: 0 }
        });
    } catch (error) {
        return NextResponse.json({
            success: true,
            boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
        });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        console.log('🚀 [API] BOOSTER-INCOME - Starting...');
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.username) {
            console.log('❌ [API] BOOSTER-INCOME - Unauthorized: No session');
            return NextResponse.json({
                success: true,
                boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
            });
        }
        console.log('✅ [API] BOOSTER-INCOME - Session found:', session.user.username);
        
        await connectDB();
        console.log('📊 [API] BOOSTER-INCOME - Database connected');
        
        const user = await User.findOne({ username: session.user.username }).select('boosterIncome');
        if (!user) {
            console.log('❌ [API] BOOSTER-INCOME - User not found:', session.user.username);
            return NextResponse.json({
                success: true,
                boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
            });
        }
        
        const boosterData = user.boosterIncome || { LG: 0, RG: 0, totalBoosterMatching: 0 };
        console.log('✅ [API] BOOSTER-INCOME - Data retrieved:', boosterData);
        
        return NextResponse.json({
            success: true,
            boosterIncome: boosterData
        });
    } catch (error) {
        console.error('❌ [API] BOOSTER-INCOME - Error:', error);
        return NextResponse.json({
            success: true,
            boosterIncome: { LG: 0, RG: 0, totalBoosterMatching: 0 }
        });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        // Get session to verify user is authenticated
        const session = await getServerSession(authOptions);

        // If no session, return default values
        if (!session || !session.user?.username) {
            return NextResponse.json({
                success: true,
                totalTeam: { left: 0, right: 0 }
            });
        }

        // Connect to database
        await connectDB();

        // Fetch user data with totalTeam info
        const user = await User.findOne({ username: session.user.username }).select('totalTeam');

        if (!user) {
            return NextResponse.json({
                success: true,
                totalTeam: { left: 0, right: 0 }
            });
        }

        return NextResponse.json({
            success: true,
            totalTeam: user.totalTeam || { left: 0, right: 0 }
        });

    } catch (error) {
        console.error('Error fetching total team:', error);
        return NextResponse.json({
            success: true,
            totalTeam: { left: 0, right: 0 }
        });
    }
}

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
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }
        await connectDB();
        const currentUser = await User.findOne({ username: session.user.username });
        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }
        const filterIds = [currentUser.username, currentUser.userId].filter((id): id is string => Boolean(id));
        const downlineMembers = await User.find({
            sponsorId: {
                $in: filterIds
            }
        }).select('username userId fullName sponsorId placementId placementPosition joiningDate');
        const formattedMembers = downlineMembers.map((member, index) => ({
            srNo: index + 1,
            memberId: member.userId || member.username,
            name: member.fullName || member.username,
            sponsorId: member.sponsorId || 'N/A',
            placementId: member.placementId || 'N/A',
            joiningDate: member.joiningDate || 'N/A',
            position: member.placementPosition ? (member.placementPosition.charAt(0).toUpperCase() + member.placementPosition.slice(1)) : 'N/A'
        }));
        return NextResponse.json({
            success: true,
            data: formattedMembers,
            count: formattedMembers.length
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'An error occurred while fetching downline members'
        }, { status: 500 });
    }
}


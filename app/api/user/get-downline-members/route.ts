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
        
        // Get members from previous 3 months as mentioned in the page note
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const downlineMembers = await User.find({
            sponsorId: {
                $in: filterIds
            },
            joiningDate: {
                $gte: threeMonthsAgo.toISOString().split('T')[0]
            }
        }).select('username userId fullName sponsorId placementId placementPosition joiningDate');
        const formattedMembers = downlineMembers.map((member, index) => {
            // Format joining date to DD/MM/YYYY
            let formattedDate = 'N/A';
            if (member.joiningDate) {
                const date = new Date(member.joiningDate);
                if (!isNaN(date.getTime())) {
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    formattedDate = `${day}/${month}/${year}`;
                }
            }
            
            return {
                srNo: index + 1,
                memberId: member.userId || member.username,
                name: member.fullName || member.username,
                sponsorId: member.sponsorId || 'N/A',
                placementId: member.placementId || 'N/A',
                joiningDate: formattedDate,
                position: member.placementPosition ? (member.placementPosition.charAt(0).toUpperCase() + member.placementPosition.slice(1)) : 'N/A',
                joiningDateISO: member.joiningDate || null // For filtering in the page
            };
        });
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


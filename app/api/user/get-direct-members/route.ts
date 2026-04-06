import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { connectDB } from '@/lib/database';

export async function GET(request: NextRequest) {
    try {
        // Get session to verify user is authenticated
        const session = await getServerSession(authOptions);

        if (!session || !session.user?.username) {
            return NextResponse.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        // Connect to database
        await connectDB();

        // Get current user
        const currentUser = await User.findOne({ username: session.user.username });
        
        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        // Fetch all direct members (users where sponsorId matches current user's ID)
        // Try both username and userId as sponsorId
        const directMembers = await User.find({
            $or: [
                { sponsorId: currentUser.username },
                { sponsorId: currentUser.userId }
            ]
        }).select('username userId fullName mobileNo joiningDate totalDirect');

        // Format the response
        const formattedMembers = directMembers.map((member, index) => ({
            srNo: index + 1,
            memberId: member.userId || member.username,
            name: member.fullName || member.username,
            directs: (member.totalDirect?.left || 0) + (member.totalDirect?.right || 0),
            joiningDate: member.joiningDate || 'N/A',
            mobileNo: member.mobileNo || 'N/A'
        }));

        return NextResponse.json({
            success: true,
            data: formattedMembers,
            count: formattedMembers.length
        });

    } catch (error) {
        console.error('Error fetching direct members:', error);
        return NextResponse.json({
            success: false,
            error: 'An error occurred while fetching direct members'
        }, { status: 500 });
    }
}


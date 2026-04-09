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

        // Get current user
        const currentUser = await User.findOne({ username: session.user.username });
        if (!currentUser) {
            return NextResponse.json({
                success: false,
                error: 'User not found'
            }, { status: 404 });
        }

        // If no direct members array, return empty
        if (!currentUser.directMembers || currentUser.directMembers.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                totalRecords: 0,
                message: 'No direct members found'
            });
        }

        // Get member IDs from directMembers array
        const memberIds = currentUser.directMembers.map(m => m.memberId);

        // Fetch member details
        const membersDetails = await User.find({ 
            $or: [
                { username: { $in: memberIds } },
                { userId: { $in: memberIds } }
            ]
        }).select('username userId fullName mobileNo totalDirect');

        // Create a map for quick lookup
        const memberMap = new Map();
        membersDetails.forEach(m => {
            memberMap.set(m.userId || m.username, {
                name: m.fullName || m.username,
                mobileNo: m.mobileNo || 'N/A',
                directs: (m.totalDirect?.left || 0) + (m.totalDirect?.right || 0)
            });
        });

        // Format response using directMembers array with stored data
        const formattedMembers = currentUser.directMembers.map((member, index) => {
            const details = memberMap.get(member.memberId) || {
                name: member.name,
                mobileNo: 'N/A',
                directs: 0
            };

            // Format joining date from joinDate field (DD/MM/YYYY)
            const joinDate = new Date(member.joinDate);
            const formattedDate = joinDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            return {
                srNo: index + 1,
                memberId: member.memberId,
                name: details.name,
                directs: details.directs,
                joiningDate: formattedDate,
                mobileNo: details.mobileNo
            };
        });

        return NextResponse.json({
            success: true,
            data: formattedMembers,
            totalRecords: formattedMembers.length,
            message: 'Direct members fetched successfully'
        });

    } catch (error) {
        console.error('Error fetching direct members:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch direct members'
        }, { status: 500 });
    }
}


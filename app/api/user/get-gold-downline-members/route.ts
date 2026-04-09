import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email })
      .select('userId username fullName boosterDownlineMembers')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Get downline members from boosterDownlineMembers array
    const downlineMembers = (user.boosterDownlineMembers ?? []) as any[];
    
    // ✅ Convert to array of memberIds and look up their memberType in User collection
    const memberIds = downlineMembers.map(m => m.memberId);
    const goldMembersData = await User.find(
      {
        $or: [
          { userId: { $in: memberIds } },
          { username: { $in: memberIds } },
          { _id: { $in: memberIds } }
        ],
        memberType: 'gold' // ✅ Filter for gold members
      }
    ).select('userId username fullName memberType').lean();

    // ✅ Map back to include original details from boosterDownlineMembers
    const goldMembers = goldMembersData.map(goldUser => {
      const originalRecord = downlineMembers.find(m => 
        m.memberId === goldUser.userId || 
        m.memberId === goldUser.username || 
        m.memberId === goldUser._id.toString()
      );
      return {
        srNo: originalRecord?.srNo,
        memberId: originalRecord?.memberId,
        name: originalRecord?.name || goldUser.fullName,
        date: originalRecord?.date,
        position: originalRecord?.position,
        memberType: goldUser.memberType
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
          goldMembers: goldMembers,
          totalCount: goldMembers.length,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error fetching gold downline members:', err);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

import { getServerSession } from 'next-auth';
import { connectDB } from "@/lib/database";
import User from '@/models/User';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    await connectDB();
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    const downlineMembers = await User.find({
      $or: [
        { sponsorId: currentUser.userId },
        { placementId: currentUser.userId }
      ]
    }).select('userId fullName joiningDate placementPosition');
    const formattedMembers = downlineMembers.map((member, index) => ({
      srNo: index + 1,
      memberId: member.userId || member._id.toString(),
      name: member.fullName || 'N/A',
      date: member.joiningDate || new Date().toISOString().split('T')[0],
      position: member.placementPosition || 'N/A'
    }));

    return NextResponse.json({
      success: true,
      data: formattedMembers,
      total: formattedMembers.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


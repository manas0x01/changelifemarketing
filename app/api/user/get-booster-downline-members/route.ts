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

    // ✅ Check if user is qualified as booster (must have at least one side active)
    const boosterStatus = currentUser.boosterStatus || {};
    const isBoosterLeft = boosterStatus.isBoosterLeft || false;
    const isBoosterRight = boosterStatus.isBoosterRight || false;

    if (!isBoosterLeft && !isBoosterRight) {
      return NextResponse.json({
        success: false,
        error: 'Not qualified',
        message: 'You need 12 basic pairs on at least one side to view booster members',
        data: []
      }, { status: 403 });
    }

    // ✅ Get booster downline members from the dedicated boosterDownlineMembers array
    let boosterMembers = currentUser.boosterDownlineMembers || [];

    // ✅ Apply filters from query parameters
    const { searchParams } = new URL(req.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const position = searchParams.get('position');

    if (fromDate || toDate) {
      boosterMembers = boosterMembers.filter(member => {
        const memberDate = new Date(member.date);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        if (from && memberDate < from) return false;
        if (to && memberDate > to) return false;
        return true;
      });
    }

    // ✅ Apply position filter (left or right)
    if (position && (position === 'Left' || position === 'Right')) {
      boosterMembers = boosterMembers.filter(
        member => member.position.toLowerCase() === position.toLowerCase()
      );
    }

    // ✅ Format response with correct srNo after filtering
    const formattedMembers = boosterMembers.map((member, index) => ({
      srNo: index + 1,
      memberId: member.memberId || 'N/A',
      name: member.name || 'N/A',
      date: member.date || new Date().toISOString().split('T')[0],
      position: member.position || 'N/A'
    }));

    return NextResponse.json({
      success: true,
      data: formattedMembers,
      total: formattedMembers.length,
      boosterStatus: {
        isBoosterLeft,
        isBoosterRight,
        qualificationDateLeft: boosterStatus.boosterQualificationDateLeft,
        qualificationDateRight: boosterStatus.boosterQualificationDateRight
      }
    });
  } catch (error) {
    console.error('Error fetching booster downline members:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


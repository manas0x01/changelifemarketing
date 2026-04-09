import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ username: session.user.username })
      .select('pinRequests')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const requests = (user.pinRequests ?? []).map((req: any, index: number) => {
      // Format date for display (DD/MM/YYYY)
      const displayDate = req.date
        ? new Date(req.date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : '--';

      return {
        srNo: req.srNo ?? index + 1,
        requestNo: req.requestNo || 'N/A',
        date: displayDate,
        dateISO: req.date ? new Date(req.date).toISOString() : null, // For filtering
        memberId: req.memberId || 'N/A',
        name: req.name || 'N/A',
        totalPins: req.totalPins || 0,
        totalAmount: req.totalAmount || '0',
        description: req.description || 'N/A',
        type: req.type || 'Credit',
      };
    });

    return NextResponse.json(
      {
        success: true,
        requests,
        totalRequests: requests.length,
        message: 'Pin requests fetched successfully',
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error fetching pin requests:', err);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

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
      .select('transferredEpins transferHistory')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Check if request is for outgoing transfers or incoming requests
    const { searchParams } = new URL(req.url);
    const requestType = searchParams.get('type') || 'received';

    if (requestType === 'sent') {
      // Outgoing transfers (for Transfer E-Pin Sent page)
      const transfers = user.transferredEpins ?? [];

      const formattedTransfers = transfers.map((t: any) => ({
        date: t.date ? new Date(t.date).toLocaleDateString('en-GB') : 'N/A',
        dateISO: t.date ? t.date.toISOString().split('T')[0] : null,
        time: t.time || 'N/A',
        ePin: t.ePin,
        package: t.package,
        transferredTo: t.transferredTo,
        transferredToName: t.transferredToName,
        status: t.status,
        remark: t.remark || 'N/A',
      }));

      return NextResponse.json(
        {
          success: true,
          transfers: formattedTransfers,
          totalTransfers: transfers.length,
        },
        { status: 200 }
      );
    }

    // Incoming transfer requests (default)
    const requests = user.transferHistory ?? [];

    // Format for Transferred/Rejected page
    const formattedRequests = requests.map((r: any) => ({
      srNo: r.srNo || 0,
      reqNo: r.reqNo || 'N/A',
      fromUser: r.fromUser || 'N/A',
      fromUserName: r.fromUserName || 'N/A',
      transferType: r.transferType || 'N/A',
      transferRejectDate: r.transferRejectDate ? new Date(r.transferRejectDate).toLocaleDateString('en-GB') : '--',
      transferRejectDateISO: r.transferRejectDate ? r.transferRejectDate.toISOString().split('T')[0] : null,
      package: r.package || 'N/A',
      quantity: r.quantity || 0,
      amount: r.amount || '0',
      status: r.status || 'Pending',
    }));

    return NextResponse.json(
      {
        success: true,
        transfers: formattedRequests,
        totalTransfers: requests.length,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

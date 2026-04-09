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
      .select('successPayments')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const payments = user.successPayments ?? [];

    // Format dates to DD/MM/YYYY
    const formattedPayments = payments.map((payment: any) => ({
      ...payment,
      fromDate: payment.fromDate ? new Date(payment.fromDate).toLocaleDateString('en-GB') : 'N/A',
      toDate: payment.toDate ? new Date(payment.toDate).toLocaleDateString('en-GB') : 'N/A',
    }));

    return NextResponse.json(
      {
        success: true,
        payments: formattedPayments,
        totalPayments: formattedPayments.length,
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

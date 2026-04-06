
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from "@/lib/database";
import WithdrawRequest from '@/models/WithdrawRequest';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    // ── Admin Auth Guard ──
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { status, adminRemark, utrNumber, paymentMode } = await req.json();

    // ── Validate input ──
    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be Approved or Rejected.' }, { status: 400 });
    }
    if (status === 'Rejected' && !adminRemark?.trim()) {
      return NextResponse.json({ error: 'Admin remark is required for rejection.' }, { status: 400 });
    }
    if (status === 'Approved' && !utrNumber?.trim()) {
      return NextResponse.json({ error: 'UTR Number is required for approval.' }, { status: 400 });
    }

    // ── Find request ──
    const withdrawReq = await WithdrawRequest.findById(id);
    if (!withdrawReq) {
      return NextResponse.json({ error: 'Withdraw request not found.' }, { status: 404 });
    }
    if (withdrawReq.status !== 'Pending') {
      return NextResponse.json(
        { error: `Request is already ${withdrawReq.status}. Cannot process again.` },
        { status: 400 }
      );
    }

    const processedDate = new Date();

    // ── Update withdraw request ──
    withdrawReq.status        = status;
    withdrawReq.processedDate = processedDate;
    withdrawReq.processedBy   = session.user?.username || session.user?.email || 'admin';
    if (adminRemark) withdrawReq.adminRemark = adminRemark.trim();
    if (utrNumber)   withdrawReq.utrNumber   = utrNumber.trim();
    if (paymentMode) withdrawReq.paymentMode = paymentMode;
    await withdrawReq.save();

    // ── If Rejected: refund amount back to user ──
    if (status === 'Rejected') {
      await User.findOneAndUpdate(
        { userId: withdrawReq.userId },
        { $inc: { totalIncome: withdrawReq.amount } }
      );
    }

    // ── Sync status in user's embedded withdrawRequests array ──
    await User.findOneAndUpdate(
      {
        userId: withdrawReq.userId,
        'withdrawRequests.requestNo': withdrawReq.requestNo,
      },
      {
        $set: {
          'withdrawRequests.$.status':        status,
          'withdrawRequests.$.processedDate': processedDate,
          'withdrawRequests.$.adminRemark':   adminRemark ?? '',
          'withdrawRequests.$.utrNumber':     utrNumber ?? '',
          'withdrawRequests.$.paymentMode':   paymentMode ?? '',
        },
      }
    );

    return NextResponse.json({
      message: `Withdrawal request ${status.toLowerCase()} successfully.`,
      requestNo: withdrawReq.requestNo,
      status,
    });
  } catch (error: any) {
    console.error('[ADMIN_WITHDRAW_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

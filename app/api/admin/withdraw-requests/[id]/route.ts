import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from "@/lib/database";
import WithdrawRequest from '@/models/WithdrawRequest';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const withdrawReq = await WithdrawRequest.findById(id).lean();
    if (!withdrawReq) {
      return NextResponse.json({ error: 'Withdraw request not found.' }, { status: 404 });
    }
    
    // Fetch live, complete user details
    const user = await User.findOne({ userId: withdrawReq.userId })
      .select('fullName username email mobileNo joiningDate registeredPackage sponsorId bankDetailsStatus bankAccountDetails totalTeam basicIncome boosterIncome totalIncome isBlocked')
      .lean();
      
    return NextResponse.json({
      success: true,
      withdrawRequest: withdrawReq,
      userProfile: user || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    const { status, adminRemark, utrNumber, paymentMode } = await req.json();
    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be Approved or Rejected.' }, { status: 400 });
    }
    if (status === 'Rejected' && !adminRemark?.trim()) {
      return NextResponse.json({ error: 'Admin remark is required for rejection.' }, { status: 400 });
    }
    if (status === 'Approved' && !utrNumber?.trim()) {
      return NextResponse.json({ error: 'UTR Number is required for approval.' }, { status: 400 });
    }
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
    withdrawReq.status        = status;
    withdrawReq.processedDate = processedDate;
    withdrawReq.processedBy   = session.user?.username || session.user?.email || 'admin';
    if (adminRemark) withdrawReq.adminRemark = adminRemark.trim();
    if (utrNumber)   withdrawReq.utrNumber   = utrNumber.trim();
    if (paymentMode) withdrawReq.paymentMode = paymentMode;
    await withdrawReq.save();
    if (status === 'Rejected') {
      await User.findOneAndUpdate(
        { userId: withdrawReq.userId },
        { $inc: { totalIncome: withdrawReq.amount } }
      );
    }
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

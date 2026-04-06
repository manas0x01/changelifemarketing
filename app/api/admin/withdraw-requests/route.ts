
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from "@/lib/database";
import WithdrawRequest from '@/models/WithdrawRequest';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status   = searchParams.get('status') || 'all';
    const search   = searchParams.get('search') || '';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit    = Math.min(50, parseInt(searchParams.get('limit') || '15'));
    const skip     = (page - 1) * limit;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');
    const query: Record<string, any> = {};

    if (status !== 'all') {
      query.status = status;
    }
    if (search.trim()) {
      query.$or = [
        { userId:       { $regex: search.trim(), $options: 'i' } },
        { userFullName: { $regex: search.trim(), $options: 'i' } },
        { userName:     { $regex: search.trim(), $options: 'i' } },
        { requestNo:    { $regex: search.trim(), $options: 'i' } },
        { mobileNo:     { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (dateFrom || dateTo) {
      query.requestDate = {};
      if (dateFrom) query.requestDate.$gte = new Date(dateFrom);
      if (dateTo)   query.requestDate.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }
    const [requests, total, summaryAgg] = await Promise.all([
      WithdrawRequest.find(query)
        .sort({ requestDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WithdrawRequest.countDocuments(query),
      WithdrawRequest.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    // ── Format summary ──
    const summary: Record<string, { count: number; amount: number }> = {
      Pending:  { count: 0, amount: 0 },
      Approved: { count: 0, amount: 0 },
      Rejected: { count: 0, amount: 0 },
      Total:    { count: 0, amount: 0 },
    };

    summaryAgg.forEach((s: any) => {
      if (s._id && s._id in summary) {
        summary[s._id] = { count: s.count, amount: s.totalAmount };
        summary.Total.count  += s.count;
        summary.Total.amount += s.totalAmount;
      }
    });

    return NextResponse.json({
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    });
  } catch (error: any) {
    console.error('[ADMIN_WITHDRAW_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
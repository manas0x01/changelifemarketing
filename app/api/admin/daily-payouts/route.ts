import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import WithdrawRequest from '@/models/WithdrawRequest';
import { verifyAdminPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdminPermission('withdrawrequests');
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const search   = searchParams.get('search') || '';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const isExport = searchParams.get('limit') === '-1';
    const limit    = isExport ? 1_000_000 : Math.min(50, parseInt(searchParams.get('limit') || '20'));
    const skip     = isExport ? 0 : (page - 1) * limit;

    // Date range — default to today (IST)
    const dateFrom = searchParams.get('dateFrom');
    const dateTo   = searchParams.get('dateTo');

    // Build date filter
    const now = new Date();
    let fromDate: Date;
    let toDate: Date;

    if (dateFrom) {
      fromDate = new Date(dateFrom);
    } else {
      // Start of today (midnight local)
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    }

    if (dateTo) {
      toDate = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    } else {
      // End of today
      toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const query: Record<string, any> = {
      status: 'Approved',
      processedDate: { $gte: fromDate, $lte: toDate },
    };

    if (search.trim()) {
      query.$or = [
        { userId:       { $regex: search.trim(), $options: 'i' } },
        { userFullName: { $regex: search.trim(), $options: 'i' } },
        { userName:     { $regex: search.trim(), $options: 'i' } },
        { requestNo:    { $regex: search.trim(), $options: 'i' } },
        { mobileNo:     { $regex: search.trim(), $options: 'i' } },
        { utrNumber:    { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const [payouts, total, agg] = await Promise.all([
      WithdrawRequest.find(query)
        .sort({ processedDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WithdrawRequest.countDocuments(query),
      WithdrawRequest.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$paymentMode',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    // Build summary
    let totalCount = 0;
    let totalAmount = 0;
    const byMode: Record<string, { count: number; amount: number }> = {};

    agg.forEach((s: any) => {
      const mode = s._id || 'Other';
      byMode[mode] = { count: s.count, amount: s.totalAmount };
      totalCount  += s.count;
      totalAmount += s.totalAmount;
    });

    return NextResponse.json({
      success: true,
      payouts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalCount,
        totalAmount,
        byMode,
        dateFrom: fromDate.toISOString(),
        dateTo:   toDate.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('daily-payouts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

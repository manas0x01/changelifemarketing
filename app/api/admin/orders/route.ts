import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from "@/lib/database";
import { verifyAdminPermission } from "@/lib/auth";
import Order from '@/models/Order';

{/* Guards & Helpers */}
async function orderGuard() {
  const auth = await verifyAdminPermission('orders');
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, message: auth.message },
      { status: auth.status }
    );
  }
  return null;
}

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(req: NextRequest) {
  try {
    const guard = await orderGuard();
    if (guard) return guard;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page      = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
    const limit     = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const search    = searchParams.get('search')?.trim()    ?? '';
    const status    = searchParams.get('status')?.trim()    ?? '';
    const orderType = searchParams.get('orderType')?.trim() ?? '';
    const sortBy    = searchParams.get('sortBy')            ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const skip      = (page - 1) * limit;
    const filter: Record<string, any> = {};
    if (status)    filter.status    = status;
    if (orderType) filter.orderType = orderType;

    if (search) {
      const re = { $regex: search, $options: 'i' };
      filter.$or = [
        { name:               re },
        { username:           re },
        { userId:             re },
        { mobileNumber:       re },
        { productName:        re },
        { packName:           re },
        { transactionDetails: re },
      ];
    }

    const ALLOWED_SORTS = new Set(['createdAt', 'updatedAt', 'name', 'status', 'productPrice', 'packPrice']);
    const safeSort = ALLOWED_SORTS.has(sortBy) ? sortBy : 'createdAt';

    {/* Query */}
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ [safeSort]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    const [summary] = await Order.aggregate([
      {
        $group: {
          _id:            null,
          totalOrders:    { $sum: 1 },
          totalPending:   { $sum: { $cond: [{ $eq: ['$status', 'pending']   }, 1, 0] } },
          totalConfirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          totalCompleted: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalCancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'cancelled'] }, 0,
                { $ifNull: [{ $ifNull: ['$productPrice', '$packPrice'] }, 0] },
              ],
            },
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page, limit, total,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      summary: summary ?? {
        totalOrders: 0, totalPending: 0, totalConfirmed: 0,
        totalCompleted: 0, totalCancelled: 0, totalRevenue: 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await orderGuard();
    if (guard) return guard;

    await connectDB();

    const id = new URL(req.url).searchParams.get('id');
    if (!id || !isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing order ID.' }, { status: 400 });
    }

    const body = await req.json();
    const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];

    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json(
        { success: false, message: `status must be one of: ${VALID_STATUSES.join(', ')}.` },
        { status: 400 }
      );
    }

    const updated = await Order.findByIdAndUpdate(
      id,
      { $set: { status: body.status } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Order status updated.', data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await orderGuard();
    if (guard) return guard;

    await connectDB();

    const id = new URL(req.url).searchParams.get('id');
    if (!id || !isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing order ID.' }, { status: 400 });
    }

    const deleted = await Order.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Order deleted successfully.' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
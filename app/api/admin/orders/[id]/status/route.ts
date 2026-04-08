import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/database';
import Order from '@/models/Order';
import mongoose from 'mongoose';

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
    }

    const body = await req.json();
    const { status, adminNote } = body;

    if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const previousStatus = order.status;
    order.status = status as OrderStatus;

    // Optionally store admin note if your schema supports it
    // order.adminNote = adminNote;

    await order.save();

    return NextResponse.json(
      {
        success: true,
        message: `Order status updated from "${previousStatus}" to "${status}".`,
        order: {
          id: order._id.toString(),
          status: order.status,
          orderType: order.orderType,
          name: order.name,
          updatedAt: order.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/admin/orders/[id]/status]', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── DELETE /api/admin/orders/[id]/status ── hard delete (admin only) ─────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as { role?: string })?.role;

    if (!session || userRole !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: 'Order deleted successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE /api/admin/orders/[id]/status]', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
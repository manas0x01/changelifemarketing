import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from "@/lib/database";
import Order from '@/models/Order';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const isOwner =
      order.username === session.user?.name || order.userId === session.user?.name;
    const isAdmin = (session.user as { role?: string })?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/orders/[id]]', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid order ID.' }, { status: 400 });
    }

    await connectDB();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    const isOwner =
      order.username === session.user?.name || order.userId === session.user?.name;

    if (!isOwner) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel an order with status "${order.status}". Only pending orders can be cancelled.` },
        { status: 400 }
      );
    }

    order.status = 'cancelled';
    await order.save();

    return NextResponse.json(
      { success: true, message: 'Order cancelled successfully.', order },
      { status: 200 }
    );
  } catch (error) {
    console.error('[PATCH /api/orders/[id]]', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

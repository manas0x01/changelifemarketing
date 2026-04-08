import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from "@/lib/database";
import Order from '@/models/Order';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login to place an order.' }, { status: 401 });
    }

    await connectDB();

    const body = await req.json();

    const {
      userId,
      username,
      name,
      mobileNumber,
      transactionDetails,
      orderType,
      productId,
      productName,
      productPrice,
      packId,
      packName,
      packPrice,
      quantity = 1,
    } = body;

    // ── Validation ──
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
      return NextResponse.json({ error: 'A valid 10-digit mobile number is required.' }, { status: 400 });
    }

    if (!transactionDetails || !transactionDetails.trim()) {
      return NextResponse.json({ error: 'Transaction details are required.' }, { status: 400 });
    }

    if (!orderType || !['product', 'pack'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type.' }, { status: 400 });
    }

    if (orderType === 'product' && (!productId || !productName || productPrice == null)) {
      return NextResponse.json({ error: 'Product details are incomplete.' }, { status: 400 });
    }

    if (orderType === 'pack' && (!packId || !packName || packPrice == null)) {
      return NextResponse.json({ error: 'Pack details are incomplete.' }, { status: 400 });
    }

    // ── Create Order ──
    const orderData: Record<string, unknown> = {
      userId: userId || null,
      username: username || null,
      name: name.trim(),
      mobileNumber,
      transactionDetails: transactionDetails.trim(),
      orderType,
      quantity,
      status: 'pending',
    };

    if (orderType === 'product') {
      orderData.productId = productId;
      orderData.productName = productName;
      orderData.productPrice = productPrice;
    } else {
      orderData.packId = packId;
      orderData.packName = packName;
      orderData.packPrice = packPrice;
    }

    const order = await Order.create(orderData);

    return NextResponse.json(
      {
        success: true,
        message: 'Order placed successfully! We will contact you soon.',
        orderId: order._id.toString(),
        order: {
          id: order._id.toString(),
          status: order.status,
          orderType: order.orderType,
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('[POST /api/orders/create]', error);

    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed. Please check your input.' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
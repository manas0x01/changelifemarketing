import { connectDB } from '@/lib/database';
import Order from '@/models/Order';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      userId,
      username,
      name,
      mobileNumber,
      transactionDetails,
      productId,
      productName,
      productPrice,
      packId,
      packName,
      packPrice,
      quantity = 1,
      orderType,
    } = body;

    // Validation
    if (!name || !mobileNumber || !transactionDetails || !orderType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate mobile number format
    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { error: 'Invalid mobile number. Must be 10 digits.' },
        { status: 400 }
      );
    }

    // Check if orderType is valid
    if (!['product', 'pack'].includes(orderType)) {
      return NextResponse.json(
        { error: 'Invalid order type. Must be product or pack.' },
        { status: 400 }
      );
    }

    // Create order
    const newOrder = new Order({
      userId: userId || null,
      username: username || null,
      name,
      mobileNumber,
      transactionDetails,
      productId: orderType === 'product' ? productId : null,
      productName: orderType === 'product' ? productName : null,
      productPrice: orderType === 'product' ? productPrice : null,
      packId: orderType === 'pack' ? packId : null,
      packName: orderType === 'pack' ? packName : null,
      packPrice: orderType === 'pack' ? packPrice : null,
      quantity,
      orderType,
      status: 'pending',
    });

    await newOrder.save();

    return NextResponse.json(
      {
        message: 'Order created successfully',
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

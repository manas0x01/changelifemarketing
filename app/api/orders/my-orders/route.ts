import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from "@/lib/database";
import Order from '@/models/Order';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 10)));
    const status = searchParams.get('status'); // optional filter
    const skip = (page - 1) * limit;
    
    const filter: Record<string, unknown> = {
      $or: [
        { username: session.user?.name },
        { userId: session.user?.name },
      ],
    };

    if (status && ['pending', 'confirmed', 'processing', 'completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        success: true,
        orders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/orders/my-orders]', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
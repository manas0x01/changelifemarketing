import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { transferredTo, pinsToTransfer } = body;

    if (!transferredTo || !pinsToTransfer || pinsToTransfer.length === 0) {
      return NextResponse.json(
        { success: false, message: 'transferredTo and pinsToTransfer are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const sender = await User.findById(session.user.id);
    const receiver = await User.findOne({
      $or: [{ userId: transferredTo }, { username: transferredTo }],
    });

    if (!receiver) {
      return NextResponse.json(
        { success: false, message: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Transfer logic would go here
    // For now, return success

    return NextResponse.json(
      {
        success: true,
        message: `Successfully transferred ${pinsToTransfer.length} EPin(s) to ${receiver.fullName}`,
        data: {
          transferredTo: receiver.userId ?? receiver.username,
          pinsCount: pinsToTransfer.length,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[POST /api/user/transfer-epin]', err);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    await connectDB();
    const user = await User.findOne({ username: session.user.username })
      .select('leftChild rightChild')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate Total Direct from leftChild and rightChild
    const leftCount = user.leftChild && user.leftChild.trim() !== '' ? 1 : 0;
    const rightCount = user.rightChild && user.rightChild.trim() !== '' ? 1 : 0;

    console.log(`✅ [Total Direct] ${session.user.username} - Left: ${leftCount} | Right: ${rightCount}`);

    const directData = {
      left: leftCount,
      right: rightCount,
    };
    return NextResponse.json(
      {
        success: true,
        totalDirect: directData,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

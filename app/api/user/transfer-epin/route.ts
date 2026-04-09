import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { recipientMemberId, pin, packageSelected, remark } = body;

    if (!recipientMemberId || !pin || !packageSelected) {
      return NextResponse.json(
        { success: false, message: 'recipientMemberId, pin, and packageSelected are required' },
        { status: 400 }
      );
    }
    await connectDB();
    const sender = await User.findOne({ username: session.user.username });
    const receiver = await User.findOne({
      $or: [{ userId: recipientMemberId }, { username: recipientMemberId }],
    });

    if (!sender) {
      return NextResponse.json(
        { success: false, message: 'Sender not found' },
        { status: 404 }
      );
    }

    if (!receiver) {
      return NextResponse.json(
        { success: false, message: 'Receiver not found' },
        { status: 404 }
      );
    }

    // Find and update the ePin
    const pinIndex = sender.ePins?.findIndex(p => p.pin === pin);
    if (pinIndex === -1 || pinIndex === undefined) {
      return NextResponse.json(
        { success: false, message: 'E-Pin not found' },
        { status: 404 }
      );
    }

    // Update sender's ePin status
    if (sender.ePins && sender.ePins[pinIndex]) {
      sender.ePins[pinIndex].status = 'Transferred';
      sender.ePins[pinIndex].transferredTo = receiver.userId || receiver.username;
      sender.ePins[pinIndex].transferredToName = receiver.fullName;
      sender.ePins[pinIndex].transferDate = new Date();
      sender.ePins[pinIndex].remark = remark;
    }

    // Add to receiver's ePins
    const newPin = {
      pin: pin,
      packageName: packageSelected,
      status: 'Active' as const,
      transferredFrom: sender.userId || sender.username,
      transferredFromName: sender.fullName,
      transferDate: new Date(),
      remark: remark,
    };

    if (!receiver.ePins) receiver.ePins = [];
    receiver.ePins.push(newPin);

    // Add to transfer history
    const today = new Date();
    const transferRecord = {
      date: today,
      time: today.toLocaleTimeString('en-IN', { hour12: true }),
      ePin: pin,
      package: packageSelected,
      transferredTo: receiver.userId || receiver.username,
      transferredToName: receiver.fullName || receiver.username || 'N/A',
      status: 'Success' as const,
      remark: remark,
    };

    if (!sender.transferredEpins) sender.transferredEpins = [];
    sender.transferredEpins.push(transferRecord);

    await sender.save();
    await receiver.save();

    return NextResponse.json(
      {
        success: true,
        message: `E-Pin transferred successfully to ${receiver.fullName}`,
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

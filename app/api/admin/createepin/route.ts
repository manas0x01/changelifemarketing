import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from "@/lib/database";
import { authOptions } from "@/lib/auth";
import User from '@/models/User';


export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required.' },
        { status: 401 }
      );
    }
    await connectDB();
    const body = await req.json();
    const { userId, quantity, pins: pinsArray, remark } = body;

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json(
        { success: false, message: 'userId is required.' },
        { status: 400 }
      );
    }

    const qty = parseInt(String(quantity), 10);
    if (!qty || qty < 1 || qty > 100) {
      return NextResponse.json(
        { success: false, message: 'quantity must be between 1 and 100.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(pinsArray) || pinsArray.length === 0) {
      return NextResponse.json(
        { success: false, message: 'pins array is required and must not be empty.' },
        { status: 400 }
      );
    }

    if (pinsArray.length !== qty) {
      return NextResponse.json(
        { success: false, message: `pins array length (${pinsArray.length}) must match quantity (${qty}).` },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      $or: [
        { userId: userId.trim() },
        { username: userId.trim() },
      ],
    }).select('_id username userId fullName ePins pinPurchaseHistory pinRequests');
    if (!user) {
      return NextResponse.json(
        { success: false, message: `No user found with ID or username: "${userId.trim()}".` },
        { status: 404 }
      );
    }

    // Use the provided pins array directly or generate unique ones
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const pins = pinsArray.map((p: any) => {
      const pinStr = String(p).trim();
      if (pinStr === 'EPIN') {
        const bytes = require('crypto').randomBytes(9);
        let randomPin = '';
        for (let i = 0; i < 12; i++) {
          const val = bytes[i % bytes.length];
          randomPin += chars[val % chars.length];
        }
        return randomPin;
      }
      return pinStr;
    });
    const now = new Date();
    const newEPins = pins.map((pin) => ({
      pin,
      packageName: 'EPIN',  // Fixed package name
      status: 'Active' as const,
      remark: remark?.trim() || `Assigned by admin on ${now.toLocaleDateString('en-IN')}`,
    }));

    const purchaseEntry = {
      date:        now,
      packageName: 'EPIN',
      quantity:    qty,
      totalAmount: 0,           // Admin credit — no payment
      paymentId:   `ADMIN-${Date.now()}`,
      status:      'Success' as const,
    };

    const existingReqs = user.pinRequests?.length ?? 0;
    const pinRequestEntry = {
      srNo:        existingReqs + 1,
      requestNo:   `REQ-ADMIN-${Date.now()}`,
      date:        now,
      memberId:    user.userId ?? user.username,
      name:        user.fullName ?? user.username,
      totalPins:   qty,
      totalAmount: '0',
      description: `Admin credited ${qty}x EPIN(s)${remark ? `: ${remark}` : ''}.`,
      type:        'Credit' as const,
    };
    await User.findByIdAndUpdate(
      user._id,
      {
        $push: {
          ePins:              { $each: newEPins },
          pinPurchaseHistory: purchaseEntry,
          pinRequests:        pinRequestEntry,
        },
        $inc: {
          activePins:        qty,
          totalPins:         qty,
        }
      },
      { runValidators: false }
    );
    return NextResponse.json(
      {
        success:  true,
        message:  `${qty} EPIN(s) successfully added to ${user.fullName ?? user.username}.`,
        data: {
          user: {
            userId:   user.userId,
            username: user.username,
            fullName: user.fullName,
          },
          pinsCreated: newEPins.map((e) => ({
            pin:         e.pin,
            packageName: e.packageName,
            status:      e.status,
          })),
          quantity: qty,
          packageName: 'EPIN',
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error.' },
      { status: 500 }
    );
  }
}
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() ?? '';

    if (!search || search.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const regex = { $regex: search, $options: 'i' };

    const users = await User.find({
      $or: [
        { userId:   regex },
        { username: regex },
        { fullName: regex },
        { phone:    regex },
        { mobileNo: regex },
      ],
    })
      .select('userId username fullName phone mobileNo memberType registeredPackage ePins')
      .limit(10)
      .lean();

    const result = users.map((u) => ({
      userId:      u.userId,
      username:    u.username,
      fullName:    u.fullName,
      phone:       u.phone ?? u.mobileNo,
      memberType:  u.memberType,
      package:     u.registeredPackage,
      activePins:  (u.ePins ?? []).filter((e: any) => e.status === 'Active').length,
      totalPins:   (u.ePins ?? []).length,
    }));
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
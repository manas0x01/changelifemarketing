import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from "@/lib/database";
import { authOptions } from "@/lib/auth";
import User from '@/models/User';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a cryptographically random EPin of given length */
function generatePin(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let pin = '';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (const n of arr) pin += chars[n % chars.length];
  return pin;
}

/** Check uniqueness of a pin across ALL users */
async function isPinUnique(pin: string): Promise<boolean> {
  const conflict = await User.findOne(
    { 'ePins.pin': pin },
    { _id: 1 }
  ).lean();
  return !conflict;
}

/** Generate N unique pins with retry logic */
async function generateUniquePins(count: number): Promise<string[]> {
  const pins: string[] = [];
  let attempts = 0;
  const MAX_ATTEMPTS = count * 20;

  while (pins.length < count && attempts < MAX_ATTEMPTS) {
    attempts++;
    const candidate = generatePin(12);
    if (pins.includes(candidate)) continue;
    if (await isPinUnique(candidate)) pins.push(candidate);
  }

  if (pins.length < count) {
    throw new Error('Could not generate enough unique EPins. Please try again.');
  }
  return pins;
}

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
    const { userId, packageName, quantity, customPins, remark } = body;
    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      return NextResponse.json(
        { success: false, message: 'userId is required.' },
        { status: 400 }
      );
    }
    const VALID_PACKAGES = ['Silver', 'Gold', 'Diamond', 'Platinum'];
    if (!packageName || !VALID_PACKAGES.includes(packageName)) {
      return NextResponse.json(
        {
          success: false,
          message: `packageName must be one of: ${VALID_PACKAGES.join(', ')}.`,
        },
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
    let pins: string[];

    if (customPins && Array.isArray(customPins) && customPins.length > 0) {
      // Admin provided custom pins — validate them
      if (customPins.length !== qty) {
        return NextResponse.json(
          { success: false, message: `customPins count (${customPins.length}) must match quantity (${qty}).` },
          { status: 400 }
        );
      }
      // Check each custom pin is unique
      for (const cp of customPins) {
        if (typeof cp !== 'string' || cp.length < 6) {
          return NextResponse.json(
            { success: false, message: 'Each custom pin must be a string of at least 6 characters.' },
            { status: 400 }
          );
        }
        if (!(await isPinUnique(cp.toUpperCase()))) {
          return NextResponse.json(
            { success: false, message: `Pin "${cp}" is already in use.` },
            { status: 409 }
          );
        }
      }
      pins = customPins.map((p: string) => p.toUpperCase().trim());
    } else {
      pins = await generateUniquePins(qty);
    }

    const now = new Date();
    const newEPins = pins.map((pin) => ({
      pin,
      packageName,
      status: 'Active' as const,
      remark: remark?.trim() || `Assigned by admin on ${now.toLocaleDateString('en-IN')}`,
    }));

    // ── Purchase History Entry ─────────────────────────────────────────────
    const purchaseEntry = {
      date:        now,
      packageName,
      quantity:    qty,
      totalAmount: 0,           // Admin credit — no payment
      paymentId:   `ADMIN-${Date.now()}`,
      status:      'Success' as const,
    };

    // ── Pin Request Log ────────────────────────────────────────────────────
    const existingReqs = user.pinRequests?.length ?? 0;
    const pinRequestEntry = {
      srNo:        existingReqs + 1,
      requestNo:   `REQ-ADMIN-${Date.now()}`,
      date:        now,
      memberId:    user.userId ?? user.username,
      name:        user.fullName ?? user.username,
      totalPins:   qty,
      totalAmount: '0',
      description: `Admin credited ${qty}x ${packageName} EPin(s)${remark ? `: ${remark}` : ''}.`,
      type:        'Credit' as const,
    };

    // ── Atomic Update ──────────────────────────────────────────────────────
    await User.findByIdAndUpdate(
      user._id,
      {
        $push: {
          ePins:              { $each: newEPins },
          pinPurchaseHistory: purchaseEntry,
          pinRequests:        pinRequestEntry,
        },
      },
      { runValidators: false }
    );

    return NextResponse.json(
      {
        success:  true,
        message:  `${qty} EPin(s) successfully added to ${user.fullName ?? user.username}.`,
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
          packageName,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[POST /api/admin/createepin]', err);
    return NextResponse.json(
      { success: false, message: err.message ?? 'Internal server error.' },
      { status: 500 }
    );
  }
}

// ─── GET /api/admin/createepin?search=xxx  (User search autocomplete) ────────

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
    console.error('[GET /api/admin/createepin]', err);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
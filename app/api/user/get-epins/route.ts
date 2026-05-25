import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

async function handleRequest(req: NextRequest) {
  try {
    console.log('🟢 [GET-EPINS] Entry');
    const session = await getServerSession(authOptions);

    console.log('🟢 [GET-EPINS] session.user:', {
      username: session?.user?.username ?? null,
      id: session?.user?.id ?? session?.user?.userId ?? null,
    });

    if (!session || !session.user) {
      console.log('🔴 [GET-EPINS] No session - unauthorized');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    console.log('✅ [DB] Database connected');

    const sessionUserId = (session.user as any)?.id ?? (session.user as any)?.userId ?? null;
    const sessionUsername = (session.user as any)?.username ?? null;

    // Helper to check if a string looks like a Mongo ObjectId
    const isObjectId = (id: any) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

    let user: any = null;

    if (isObjectId(sessionUserId)) {
      user = await User.findById(sessionUserId).select('ePins username userId').lean();
    }

    if (!user && sessionUsername) {
      user = await User.findOne({ username: sessionUsername }).select('ePins username userId').lean();
    }

    if (!user && sessionUserId) {
      user = await User.findOne({ $or: [{ userId: sessionUserId }, { username: sessionUserId }] }).select('ePins username userId').lean();
    }

    console.log('📌 [GET-EPINS] db user found:', {
      username: user?.username ?? null,
      id: user?._id ?? null,
      ePinsCount: user?.ePins?.length ?? 0,
    });

    if (!user) {
      console.log('❌ [GET-EPINS] User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ePinsRaw = user.ePins || [];

    // Fetch recipient user records to resolve their userIds dynamically
    const recipientUsernames: string[] = Array.from(new Set(ePinsRaw.map((p: any) => p.transferredTo).filter(Boolean))) as string[];
    const recipients = await User.find({ username: { $in: recipientUsernames } }).select("username userId fullName").lean();
    const recipientMap = new Map(recipients.map((r: any) => [r.username, r]));

    const availableEPins = ePinsRaw
      .filter((pin: any) => pin.status === 'Active' || !pin.status)
      .map((pin: any) => {
        if (typeof pin === 'string') return pin;
        if (pin && pin.pin) return { pin: pin.pin, packageName: pin.packageName, status: pin.status };
        return pin;
      });

    const allEPins = ePinsRaw.map((pin: any, index: number) => {
      const recipient = recipientMap.get(pin.transferredTo);
      return {
        srNo: index + 1,
        ePin: pin.pin,
        package: pin.packageName || 'EPIN',
        status: pin.status || 'Active',
        transferredTo: recipient?.userId || pin.transferredTo || 'N/A',
        transferredToName: recipient?.fullName || pin.transferredToName || 'N/A',
        transferredDate: pin.transferDate ? new Date(pin.transferDate).toLocaleDateString('en-GB') : 'N/A',
        usedDate: pin.usedDate ? new Date(pin.usedDate).toLocaleDateString('en-GB') : undefined,
      };
    });

    console.log('📌 [GET-EPINS] All PINs count:', user.ePins?.length ?? 0);
    console.log('📌 [GET-EPINS] Available E-PINs:', availableEPins);

    return NextResponse.json({
      success: true,
      ePins: allEPins,
      availableEPins,
      totalAvailable: availableEPins.length,
      message: 'Available E-PINs fetched successfully',
    });
  } catch (error) {
    console.error('❌ [GET-EPINS] Error fetching E-PINs:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

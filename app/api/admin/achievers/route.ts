import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/database';
import { authOptions } from '@/lib/auth';
import Achiever from '@/models/Achiever';

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

function adminGuard(session: any) {
  if (!session || session.user?.role !== 'admin') {
    return NextResponse.json(
      { success: false, message: 'Unauthorized: Admin access required.' },
      { status: 401 }
    );
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isPublic = searchParams.get('public') === '1';

    if (!isPublic) {
      const session = await getServerSession(authOptions);
      const guard   = adminGuard(session);
      if (guard) return guard;
    }

    await connectDB();

    const page    = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10));
    const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const search  = searchParams.get('search')?.trim() ?? '';
    const visible = searchParams.get('visible');
    const skip    = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (isPublic)           filter.isVisible = true;
    else if (visible === 'true')  filter.isVisible = true;
    else if (visible === 'false') filter.isVisible = false;

    if (search) {
      const re = { $regex: search, $options: 'i' };
      filter.$or = [
        { achieverName: re }, { rankAchievement: re },
        { locationState: re }, { description: re },
      ];
    }

    const [achievers, total] = await Promise.all([
      Achiever.find(filter).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Achiever.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true, data: achievers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit), hasPrevPage: page > 1 },
    });
  } catch (err: any) {
    console.error('[GET /api/admin/achievers]', err);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guard   = adminGuard(session);
    if (guard) return guard;

    await connectDB();

    const body = await req.json();
    const { achieverName, profilePhoto, rankAchievement, locationState,
            description, memberType, isFirstBooster, displayOrder, isVisible } = body;

    if (!achieverName?.trim()) {
      return NextResponse.json({ success: false, message: 'achieverName is required.' }, { status: 400 });
    }

    if (isFirstBooster) {
      await Achiever.updateMany({ isFirstBooster: true }, { $set: { isFirstBooster: false } });
    }

    const achiever = await Achiever.create({
      achieverName: achieverName.trim(),
      profilePhoto: profilePhoto?.trim() ?? '',
      rankAchievement: rankAchievement?.trim() ?? '',
      locationState: locationState?.trim() ?? '',
      description: description?.trim() ?? '',
      memberType: memberType ?? 'active',
      isFirstBooster: Boolean(isFirstBooster),
      displayOrder: Number(displayOrder) || 0,
      isVisible: isVisible !== false,
    });

    return NextResponse.json(
      { success: true, message: 'Achiever created successfully.', data: achiever },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/admin/achievers]', err);
    return NextResponse.json({ success: false, message: err.message ?? 'Internal server error.' }, { status: 500 });
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guard   = adminGuard(session);
    if (guard) return guard;

    await connectDB();

    const id = new URL(req.url).searchParams.get('id');
    if (!id || !isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing ID.' }, { status: 400 });
    }

    const body = await req.json();
    const { achieverName, profilePhoto, rankAchievement, locationState,
            description, memberType, isFirstBooster, displayOrder, isVisible } = body;

    if (!achieverName?.trim()) {
      return NextResponse.json({ success: false, message: 'achieverName is required.' }, { status: 400 });
    }

    if (isFirstBooster) {
      await Achiever.updateMany(
        { isFirstBooster: true, _id: { $ne: id } },
        { $set: { isFirstBooster: false } }
      );
    }

    const updated = await Achiever.findByIdAndUpdate(
      id,
      { $set: {
        achieverName: achieverName.trim(),
        profilePhoto: profilePhoto?.trim() ?? '',
        rankAchievement: rankAchievement?.trim() ?? '',
        locationState: locationState?.trim() ?? '',
        description: description?.trim() ?? '',
        memberType: memberType ?? 'active',
        isFirstBooster: Boolean(isFirstBooster),
        displayOrder: Number(displayOrder) || 0,
        isVisible: Boolean(isVisible),
      }},
      { new: true, runValidators: true }
    );

    if (!updated) return NextResponse.json({ success: false, message: 'Achiever not found.' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Achiever updated successfully.', data: updated });
  } catch (err: any) {
    console.error('[PUT /api/admin/achievers]', err);
    return NextResponse.json({ success: false, message: err.message ?? 'Internal server error.' }, { status: 500 });
  }
}

// ─── PATCH (toggle visibility / isFirstBooster / displayOrder) ───────────────

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guard   = adminGuard(session);
    if (guard) return guard;

    await connectDB();

    const id = new URL(req.url).searchParams.get('id');
    if (!id || !isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing ID.' }, { status: 400 });
    }

    const body    = await req.json();
    const allowed = ['isVisible', 'isFirstBooster', 'displayOrder', 'memberType'];
    const update: Record<string, any> = {};
    for (const key of allowed) if (key in body) update[key] = body[key];

    if (!Object.keys(update).length) {
      return NextResponse.json({ success: false, message: 'No valid fields.' }, { status: 400 });
    }

    if (update.isFirstBooster === true) {
      await Achiever.updateMany({ isFirstBooster: true, _id: { $ne: id } }, { $set: { isFirstBooster: false } });
    }

    const updated = await Achiever.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!updated) return NextResponse.json({ success: false, message: 'Achiever not found.' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Updated.', data: updated });
  } catch (err: any) {
    console.error('[PATCH /api/admin/achievers]', err);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const guard   = adminGuard(session);
    if (guard) return guard;

    await connectDB();

    const id = new URL(req.url).searchParams.get('id');
    if (!id || !isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid or missing ID.' }, { status: 400 });
    }

    const deleted = await Achiever.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ success: false, message: 'Achiever not found.' }, { status: 404 });

    return NextResponse.json({ success: true, message: 'Achiever deleted successfully.' });
  } catch (err: any) {
    console.error('[DELETE /api/admin/achievers]', err);
    return NextResponse.json({ success: false, message: 'Internal server error.' }, { status: 500 });
  }
}
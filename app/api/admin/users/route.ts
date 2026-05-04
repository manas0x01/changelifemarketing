import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from "@/lib/database";
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateTeamCounts } from '@/lib/teamUtils';

interface QueryFilter {
  role?: string;
  memberType?: string;
  $or?: Array<Record<string, { $regex: string; $options: string }>>;
}
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing user ID.' },
        { status: 400 }
      );
    }

    // Find the user first to get placement info before deleting
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }

    const { placementId, placementPosition } = userToDelete;

    // Delete the user
    await User.findByIdAndDelete(id);

    // Update ancestor counts
    if (placementId && placementPosition) {
      await updateTeamCounts(placementId, placementPosition, -1);
      
      // Also clear the reference in the parent's child field
      const parent = await User.findOne({
        $or: [{ userId: placementId }, { username: placementId }]
      });
      if (parent) {
        if (placementPosition === 'left') {
          parent.leftChild = "";
        } else {
          parent.rightChild = "";
        }
        await parent.save();
      }
    }

    return NextResponse.json(
      { success: true, message: 'User deleted successfully.' },
      { status: 200 }
    );
  } catch (err) {
    console.error('[DELETE USER ERROR]', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required.' },
        { status: 401 }
      );
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page        = Math.max(1, parseInt(searchParams.get('page')    ?? '1',  10));
    const limit       = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const search      = searchParams.get('search')?.trim()      ?? '';
    const role        = searchParams.get('role')?.trim()        ?? '';
    const memberType  = searchParams.get('memberType')?.trim()  ?? '';
    const sortBy      = searchParams.get('sortBy')              ?? 'createdAt';
    const sortOrder   = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const skip        = (page - 1) * limit;
    const filter: QueryFilter = {};

    if (role)       filter.role       = role;
    if (memberType) filter.memberType = memberType;

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [
        { username:  regex },
        { userId:    regex },
        { fullName:  regex },
        { email:     regex },
        { phone:     regex },
        { mobileNo:  regex },
        { sponsorId: regex },
        { city:      regex },
        { state:     regex },
      ];
    }
    const allowedSorts = new Set([
      'createdAt', 'updatedAt', 'username', 'fullName',
      'joiningDate', 'basicIncome', 'boosterIncomeAmount',
    ]);
    const safeSort = allowedSorts.has(sortBy) ? sortBy : 'createdAt';
    let sortKey: string = safeSort;
    if (safeSort === 'boosterIncomeAmount') sortKey = 'boosterIncome.amount';
    const [users, total] = await Promise.all([
      User.find(filter)
        .select(
          'username userId fullName email phone mobileNo role memberType ' +
          'joiningDate sponsorId sponsorName placementId placementName ' +
          'placementPosition registeredPackage state district city ' +
          'basicIncome boosterIncome.amount boosterIncomeAmount totalTeam ' +
          'createdAt updatedAt'
        )
        .sort({ [sortKey]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);
    const [summary] = await User.aggregate([
      {
        $group: {
          _id:           null,
          totalUsers:    { $sum: 1 },
          totalAdmin:    { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          totalBooster:     { $sum: { $cond: [{ $eq: ['$memberType', 'gold'] }, 1, 0] } },
          totalActive:   { $sum: { $cond: [{ $eq: ['$memberType', 'active'] }, 1, 0] } },
          totalIncome:   { $sum: { $add: ['$basicIncome', { $ifNull: [ { $ifNull: ['$boosterIncome.amount', '$boosterIncomeAmount'] }, 0 ] } ] } },
        },
      },
    ]);

    return NextResponse.json(
      {
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1,
        },
        summary: summary ?? {
          totalUsers: 0,
          totalAdmin: 0,
          totalBooster:  0,
          totalActive: 0,
          totalIncome: 0,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized.' },
        { status: 401 }
      );
    }
    await connectDB();
    const body = await req.json();
    const { id, role, memberType } = body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing user ID.' },
        { status: 400 }
      );
    }
    const allowedRoles       = ['user', 'admin', 'moderator'];
    const allowedMemberTypes = ['gold', 'active'];
    const update: Record<string, string> = {};
    if (role       && allowedRoles.includes(role))             update.role       = role;
    if (memberType && allowedMemberTypes.includes(memberType)) update.memberType = memberType;
    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid fields to update.' },
        { status: 400 }
      );
    }
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('username userId fullName role memberType');
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: 'User updated successfully.', data: updated },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
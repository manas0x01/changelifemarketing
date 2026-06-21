import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from "@/lib/database";
import User from '@/models/User';
import { authOptions, verifyAdminPermission } from '@/lib/auth';
import { updateTeamCounts } from '@/lib/teamUtils';

interface QueryFilter {
  role?: string;
  memberType?: string;
  $or?: Array<Record<string, { $regex: string; $options: string }>>;
}
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyAdminPermission('users');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
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
    const auth = await verifyAdminPermission('users');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));
    const search = searchParams.get('search')?.trim() ?? '';
    const role = searchParams.get('role')?.trim() ?? '';
    const memberType = searchParams.get('memberType')?.trim() ?? '';
    const sortBy = searchParams.get('sortBy') ?? 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;
    const filter: QueryFilter = {};

    if (role) filter.role = role;
    if (memberType) filter.memberType = memberType;

    if (search) {
      const regex = { $regex: search, $options: 'i' };
      filter.$or = [
        { username: regex },
        { userId: regex },
        { fullName: regex },
        { email: regex },
        { phone: regex },
        { mobileNo: regex },
        { sponsorId: regex },
        { city: regex },
        { state: regex },
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
          'username userId fullName email phone mobileNo role memberType subAdminPermissions ' +
          'joiningDate sponsorId sponsorName placementId placementName ' +
          'placementPosition registeredPackage state district city ' +
          'basicIncome boosterIncome.amount boosterIncomeAmount totalTeam ' +
          'isBlocked plainPassword plainTransactionPassword panNo bankName branchName accountNo ifsc accountType createdAt updatedAt'
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
          _id: null,
          totalUsers: { $sum: 1 },
          totalAdmin: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          totalBooster: { $sum: { $cond: [{ $eq: ['$memberType', 'gold'] }, 1, 0] } },
          totalActive: { $sum: { $cond: [{ $eq: ['$memberType', 'active'] }, 1, 0] } },
          totalIncome: { $sum: { $add: ['$basicIncome', { $ifNull: [{ $ifNull: ['$boosterIncome.amount', '$boosterIncomeAmount'] }, 0] }] } },
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
          totalBooster: 0,
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
    const auth = await verifyAdminPermission('users');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status }
      );
    }
    await connectDB();
    const body = await req.json();
    const {
      id, role, memberType, isBlocked, password, transactionPassword,
      bankName, branchName, accountNo, ifsc, accountType,
      username, userId, fullName, subAdminPermissions
    } = body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or missing user ID.' },
        { status: 400 }
      );
    }
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }

    const oldUsername = user.username || "";
    const oldUserId = user.userId || user.username || "";
    const oldFullName = user.fullName || user.username || "";

    // Validate and update username
    if (username && username.trim() && username.trim() !== oldUsername) {
      const uTrim = username.trim();
      const existingUser = await User.findOne({ username: uTrim, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Username is already taken by another user.' },
          { status: 400 }
        );
      }
      user.username = uTrim;
    }

    // Validate and update userId
    if (userId && userId.trim() && userId.trim() !== oldUserId) {
      const uIdTrim = userId.trim();
      const existingUser = await User.findOne({ userId: uIdTrim, _id: { $ne: id } });
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'User ID is already taken by another user.' },
          { status: 400 }
        );
      }
      user.userId = uIdTrim;
    }

    // Update fullName
    if (fullName && fullName.trim()) {
      user.fullName = fullName.trim();
    }

    const allowedRoles = ['user', 'admin', 'moderator', 'sub-admin'];
    const allowedMemberTypes = ['gold', 'active'];

    if (role && allowedRoles.includes(role)) {
      user.role = role;
      if (role === 'sub-admin' && Array.isArray(subAdminPermissions)) {
        user.subAdminPermissions = subAdminPermissions;
      }
    }
    if (memberType && allowedMemberTypes.includes(memberType)) {
      user.memberType = memberType;
    }
    if (typeof isBlocked === 'boolean') {
      user.isBlocked = isBlocked;
    }
    if (password && password.trim()) {
      if (password.trim().length < 5) {
        return NextResponse.json(
          { success: false, message: 'Password must be at least 5 characters long.' },
          { status: 400 }
        );
      }
      user.password = password.trim();
    }
    if (transactionPassword && transactionPassword.trim()) {
      if (transactionPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, message: 'Transaction Password must be at least 6 characters long.' },
          { status: 400 }
        );
      }
      user.transactionPassword = transactionPassword.trim();
    }

    // Direct bank details editing by Admin
    let updatedBank = false;
    
    if (Object.prototype.hasOwnProperty.call(body, 'bankName') && (body.bankName || '') !== ((user as any).bankName || '')) {
      (user as any).bankName = body.bankName || '';
      updatedBank = true;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'branchName') && (body.branchName || '') !== ((user as any).branchName || '')) {
      (user as any).branchName = body.branchName || '';
      updatedBank = true;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'accountNo') && (body.accountNo || '') !== ((user as any).accountNo || '')) {
      (user as any).accountNo = body.accountNo || '';
      updatedBank = true;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'ifsc') && (body.ifsc || '') !== ((user as any).ifsc || '')) {
      (user as any).ifsc = body.ifsc || '';
      updatedBank = true;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'accountType') && (body.accountType || '') !== ((user as any).accountType || '')) {
      (user as any).accountType = body.accountType || '';
      updatedBank = true;
    }

    if (updatedBank) {
      if ((user as any).accountNo || (user as any).bankName) {
        user.bankDetailsStatus = 'approved';
      } else {
        user.bankDetailsStatus = 'none';
      }
    }

    // Synchronize nested bankAccountDetails if bank credentials changed
    if (updatedBank) {
      user.bankAccountDetails = {
        accountHolderName: user.fullName || user.username || "",
        accountNumber: (user as any).accountNo || "",
        ifscCode: (user as any).ifsc || "",
        bankName: (user as any).bankName || "",
      };
    }

    await user.save();

    // If username, userId, or fullName has changed, perform cascading updates to keep database consistent
    const newUsername = user.username || "";
    const newUserId = user.userId || user.username || "";
    const newFullName = user.fullName || user.username || "";

    if (oldUsername !== newUsername || oldUserId !== newUserId || oldFullName !== newFullName) {
      // 1. Update direct descendants' sponsor fields
      await User.updateMany(
        { sponsorId: { $in: [oldUsername, oldUserId] } },
        { $set: { sponsorId: newUserId, sponsorName: newFullName } }
      );

      // 2. Update direct descendants' placement fields
      await User.updateMany(
        { placementId: { $in: [oldUsername, oldUserId] } },
        { $set: { placementId: newUserId, placementName: newFullName } }
      );

      // 3. Update leftChild/rightChild fields in ancestors
      await User.updateMany(
        { leftChild: oldUsername },
        { $set: { leftChild: newUsername } }
      );
      await User.updateMany(
        { rightChild: oldUsername },
        { $set: { rightChild: newUsername } }
      );

      // 4. Update elements in sponsor's directMembers list
      await User.updateMany(
        { "directMembers.memberId": { $in: [oldUsername, oldUserId] } },
        { $set: { "directMembers.$.memberId": newUserId, "directMembers.$.name": newFullName } }
      );

      // 5. Update WithdrawRequest collections
      try {
        const WithdrawRequest = mongoose.models.WithdrawRequest || require('@/models/WithdrawRequest').default;
        if (WithdrawRequest) {
          await WithdrawRequest.updateMany(
            { userId: { $in: [oldUsername, oldUserId] } },
            { $set: { userId: newUserId, userName: newUsername, userFullName: newFullName } }
          );
          await WithdrawRequest.updateMany(
            { userName: oldUsername },
            { $set: { userName: newUsername } }
          );
        }
      } catch (e) {
        console.error("Error updating WithdrawRequest references:", e);
      }

      // 6. Update Order collections
      try {
        const Order = mongoose.models.Order || require('@/models/Order').default;
        if (Order) {
          await Order.updateMany(
            { userId: { $in: [oldUsername, oldUserId] } },
            { $set: { userId: newUserId, username: newUsername, name: newFullName } }
          );
        }
      } catch (e) {
        console.error("Error updating Order references:", e);
      }
    }

    const updated = await User.findById(id).select('username userId fullName role memberType isBlocked plainPassword plainTransactionPassword bankName branchName accountNo ifsc accountType bankDetailsStatus subAdminPermissions');

    return NextResponse.json(
      { success: true, message: 'User updated successfully.', data: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json(
      { success: false, message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
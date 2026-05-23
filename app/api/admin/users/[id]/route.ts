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
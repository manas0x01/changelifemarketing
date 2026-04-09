import { connectDB } from '@/lib/database';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';
import { NextRequest, NextResponse } from 'next/server';

interface TreeNode {
  id: string;
  name: string;
  userId: string;
  type: 'gold' | 'active';
  position?: 'left' | 'right';
  children?: TreeNode[];
}

async function buildPlacementTree(userId: string): Promise<TreeNode | null> {
  try {
    let rootUser = await User.findOne({ userId }).lean();
    if (!rootUser) {
      rootUser = await User.findOne({ username: userId }).lean();
    }
    if (!rootUser) {
      return null;
    }
    // Use memberType field: 'gold' or 'active' (default: 'active')
    const userType = (rootUser.memberType || 'active') as 'gold' | 'active';
    const treeNode: TreeNode = {
      id: rootUser.userId || rootUser.username,
      name: rootUser.fullName || rootUser.username,
      userId: rootUser.userId || rootUser.username,
      type: userType,
      children: []
    };
    async function fetchChildren(parentUserId: string) {
      const children = await User.find({ placementId: parentUserId }).lean();
      const result: TreeNode[] = [];
      for (const child of children) {
        // Use memberType field instead of boosterIncomeAmount
        const childType = (child.memberType || 'active') as 'gold' | 'active';
        const childNode: TreeNode = {
          id: child.userId || child.username,
          name: child.fullName || child.username,
          userId: child.userId || child.username,
          type: childType,
          position: child.placementPosition as 'left' | 'right' | undefined,
          children: []
        };
        const grandchildren = await fetchChildren(child.userId || child.username);
        if (grandchildren.length > 0) {
          childNode.children = grandchildren;
        }
        result.push(childNode);
      }

      return result;
    }

    treeNode.children = await fetchChildren(rootUser.userId || rootUser.username);

    return treeNode;
  } catch (error) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify session authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const tree = await buildPlacementTree(userId);

    if (!tree) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tree,
      message: 'Placement tree fetched successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

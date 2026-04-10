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
    console.log('🌳 [API] buildPlacementTree - Starting tree build for:', userId);
    let rootUser = await User.findOne({ userId }).lean();
    if (!rootUser) {
      console.log('🔍 [API] User not found by userId, trying username...');
      rootUser = await User.findOne({ username: userId }).lean();
    }
    if (!rootUser) {
      console.log('❌ [API] Root user not found:', userId);
      return null;
    }
    console.log('✅ [API] Root user found:', rootUser.userId || rootUser.username);
    // Use memberType field: 'gold' or 'active' (default: 'active')
    const userType = (rootUser.memberType || 'active') as 'gold' | 'active';
    console.log('📝 [API] User type:', userType);
    const treeNode: TreeNode = {
      id: rootUser.userId || rootUser.username,
      name: rootUser.fullName || rootUser.username,
      userId: rootUser.userId || rootUser.username,
      type: userType,
      children: []
    };
    async function fetchChildren(parentUserId: string) {
      console.log('👶 [API] Fetching children for parent:', parentUserId);
      const children = await User.find({ placementId: parentUserId }).lean();
      console.log('📊 [API] Found', children.length, 'children for parent');
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
          console.log('✅ [API] Child:', childNode.id, 'has', grandchildren.length, 'grandchildren');
        }
        result.push(childNode);
      }

      return result;
    }

    treeNode.children = await fetchChildren(rootUser.userId || rootUser.username);
    console.log('🌳 [API] Tree building completed. Root children count:', treeNode.children?.length || 0);

    return treeNode;
  } catch (error) {
    console.error('❌ [API] buildPlacementTree error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🌐 [API] PLACEMENT-TREE - Request received');
    // Verify session authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.username) {
      console.log('❌ [API] PLACEMENT-TREE - Unauthorized: No session');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.log('✅ [API] PLACEMENT-TREE - Session verified:', session.user.username);

    await connectDB();
    console.log('🗄️ [API] PLACEMENT-TREE - Database connected');

    const body = await request.json();
    const { userId } = body;
    console.log('📝 [API] PLACEMENT-TREE - Requested userId:', userId);

    if (!userId) {
      console.log('❌ [API] PLACEMENT-TREE - User ID is missing');
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔧 [API] PLACEMENT-TREE - Building placement tree...');
    const tree = await buildPlacementTree(userId);

    if (!tree) {
      console.log('❌ [API] PLACEMENT-TREE - Tree building failed, user not found');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('✅ [API] PLACEMENT-TREE - Tree built successfully');
    console.log('🎯 [API] PLACEMENT-TREE - Returning tree with root:', tree.id);
    return NextResponse.json({
      success: true,
      tree,
      message: 'Placement tree fetched successfully'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [API] PLACEMENT-TREE - Error:', errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

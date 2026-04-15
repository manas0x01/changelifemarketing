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
    const userType = (rootUser.memberType || 'active') as 'gold' | 'active';
    console.log('📝 [API] User type:', userType);
    
    const treeNode: TreeNode = {
      id: rootUser.userId || rootUser.username,
      name: rootUser.fullName || rootUser.username,
      userId: rootUser.userId || rootUser.username,
      type: userType,
      children: []
    };
    
    async function buildChildNode(childUserId: string | null, position: 'left' | 'right'): Promise<TreeNode | null> {
      if (!childUserId) return null;
      
      console.log(`👶 [API] Fetching child (${position}):`, childUserId);
      let childUser = await User.findOne({ userId: childUserId }).lean();
      if (!childUser) {
        childUser = await User.findOne({ username: childUserId }).lean();
      }
      if (!childUser) {
        console.log(`❌ [API] Child user not found: ${childUserId}`);
        return null;
      }
      
      const childType = (childUser.memberType || 'active') as 'gold' | 'active';
      const childNode: TreeNode = {
        id: childUser.userId || childUser.username,
        name: childUser.fullName || childUser.username,
        userId: childUser.userId || childUser.username,
        type: childType,
        position,
        children: []
      };
      
      // Recursively build the tree using leftChild and rightChild
      const leftChildId = (childUser.leftChild || null) as string | null;
      const rightChildId = (childUser.rightChild || null) as string | null;
      
      const leftChild = await buildChildNode(leftChildId, 'left');
      const rightChild = await buildChildNode(rightChildId, 'right');
      
      if (leftChild) childNode.children!.push(leftChild);
      if (rightChild) childNode.children!.push(rightChild);
      
      console.log(`✅ [API] Child ${childNode.id} processed with ${childNode.children?.length || 0} children`);
      return childNode;
    }
    
    // Fetch left and right children using the new fields
    const leftChildId = (rootUser.leftChild || null) as string | null;
    const rightChildId = (rootUser.rightChild || null) as string | null;
    
    const leftChild = await buildChildNode(leftChildId, 'left');
    const rightChild = await buildChildNode(rightChildId, 'right');
    
    if (leftChild) treeNode.children!.push(leftChild);
    if (rightChild) treeNode.children!.push(rightChild);
    
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

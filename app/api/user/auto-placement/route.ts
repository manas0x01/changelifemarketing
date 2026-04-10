import { connectDB } from '@/lib/database';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { sponsorId, position } = await req.json();

    if (!sponsorId || !position) {
      return Response.json(
        { error: "sponsorId and position are required" },
        { status: 400 }
      );
    }
    const normalizedPosition = position.toLowerCase() as 'left' | 'right';
    await connectDB();
    const sponsor = await User.findOne({
      $or: [{ username: sponsorId }, { userId: sponsorId }],
    });
    if (!sponsor) {
      return Response.json({ error: "Sponsor not found" }, { status: 404 });
    }
    const sponsorIdForSearch = sponsor.userId || sponsor.username;
    const findPlacementParentBFS = async (
      rootId: string,
      requestedSide: 'left' | 'right'
    ): Promise<{ placementParentId: string; placementPosition: 'left' | 'right' }> => {
      console.log('🔄 [AUTO-PLACEMENT] Starting BFS from:', rootId, 'for side:', requestedSide);
      console.log('📊 Optimization: Using batch queries instead of individual lookups');
      const queue: string[] = [rootId];
      const visited = new Set<string>();
      const BATCH_SIZE = 15; // Fetch 15 users per DB query
      while (queue.length > 0) {
        const batch = queue.splice(0, BATCH_SIZE);
        console.log(`📦 Processing batch of ${batch.length} nodes (remaining in queue: ${queue.length})`);
        console.log(`📋 Batch node IDs to query:`, batch);
        const orConditions = batch.flatMap(id => [
          { username: id },
          { userId: id }
        ]);
        
        console.log(`🔍 Built $or query with ${orConditions.length} conditions`); // ← DEBUG
        
        const users = await User.find({ $or: orConditions });
        
        console.log(`✅ Batch query returned ${users.length} users from ${batch.length} node IDs`);
        if (users.length > 0) {
          console.log(`📊 Found users:`, users.map(u => ({ userId: u.userId, username: u.username })));
        }
        
        if (users.length === 0) {
          console.log('⚠️ No users found in batch, skipping to next batch');
          continue;
        }
        
        for (const currentNode of users) {
          const nodeId = currentNode.userId || currentNode.username;
          
          if (visited.has(nodeId)) {
            console.log('⏭️ Already visited:', nodeId);
            continue;
          }
          visited.add(nodeId);
          
          const leftChild = await User.findOne({ placementId: nodeId, placementPosition: 'left' }).select('username fullName');
          const rightChild = await User.findOne({ placementId: nodeId, placementPosition: 'right' }).select('username fullName');
          
          console.log('🔍 Checking node:', {
            nodeId,
            hasLeft: !!leftChild,
            hasRight: !!rightChild,
          });

          console.log(`👶 Children for ${nodeId}:`, {
            left: leftChild ? { id: leftChild.username, name: leftChild.fullName } : null,
            right: rightChild ? { id: rightChild.username, name: rightChild.fullName } : null
          });

          const hasRequestedSide = (requestedSide === 'left' ? !!leftChild : !!rightChild);
          
          if (!hasRequestedSide) {
            console.log('✅ [AUTO-PLACEMENT] Found available position at:', {
              parentId: nodeId,
              position: requestedSide,
              reason: requestedSide === 'left' 
                ? 'Left position empty' 
                : 'Right position empty',
            });
            return { 
              placementParentId: nodeId, 
              placementPosition: requestedSide 
            };
          }
          if (leftChild && !visited.has(leftChild.username)) {
            console.log('📌 Adding left child to queue:', leftChild.username);
            queue.push(leftChild.username);
          }
          if (rightChild && !visited.has(rightChild.username)) {
            console.log('📌 Adding right child to queue:', rightChild.username);
            queue.push(rightChild.username);
          }
        }
      }
      console.log('⚠️ [AUTO-PLACEMENT] No available position found, placing under sponsor');
      return { 
        placementParentId: sponsorIdForSearch, 
        placementPosition: requestedSide 
      };
    };
    const { placementParentId, placementPosition } = await findPlacementParentBFS(
      sponsorIdForSearch,
      normalizedPosition
    );
    const placementParent = await User.findOne({
      $or: [{ username: placementParentId }, { userId: placementParentId }],
    });
    const placementName = placementParent?.fullName || placementParentId;
    console.log("✅ AUTO-PLACEMENT DETERMINED (BFS):", {
      sponsorId: sponsorIdForSearch,
      requestedPosition: normalizedPosition,
      placementParentId,
      placementPosition,
      placementName,
    });

    return Response.json({
      placementId: placementParentId,
      placementName,
      placementPosition,
    });
  } catch (error) {
    console.error("❌ Auto-placement error:", error);
    return Response.json(
      { error: "Failed to determine placement" },
      { status: 500 }
    );
  }
}


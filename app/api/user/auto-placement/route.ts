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
    const normalizedPosition = position.toLowerCase() as 'left' | 'right'
    await connectDB();
    const sponsor = await User.findOne({
      $or: [{ username: sponsorId }, { userId: sponsorId }],
    });
    if (!sponsor) {
      console.error('  ❌ Sponsor not found - Returning 404');
      return Response.json({ error: "Sponsor not found" }, { status: 404 });
    }
    
    // console.log('  🔧 Preparing sponsor ID for search...');
    const sponsorIdForSearch = sponsor.userId || sponsor.username;
    // console.log(`  ✅ Sponsor ID for search: "${sponsorIdForSearch}"`);
    const findPlacementParentBFS = async (
      rootId: string,
      requestedSide: 'left' | 'right'
    ): Promise<{ placementParentId: string; placementPosition: 'left' | 'right' }> => {
      const queue: string[] = [rootId];
      const visited = new Set<string>();
      const BATCH_SIZE = 15; // Fetch 15 users per DB query
      
      let iterationCount = 0;
      while (queue.length > 0) {
        iterationCount++;
        const batch = queue.splice(0, BATCH_SIZE);
        const orConditions = batch.flatMap(id => [
          { username: id },
          { userId: id }
        ]);
        const users = await User.find({ $or: orConditions });
        if (users.length === 0) {
          continue;
        }
        
        for (const currentNode of users) {
          const nodeId = currentNode.userId || currentNode.username;
          if (visited.has(nodeId)) {
            continue;
          }
          visited.add(nodeId);
          const leftChild = await User.findOne({ placementId: nodeId, placementPosition: 'left' }).select('username fullName');
          const rightChild = await User.findOne({ placementId: nodeId, placementPosition: 'right' }).select('username fullName');
          const hasRequestedSide = (requestedSide === 'left' ? !!leftChild : !!rightChild);
          // console.log(`          📍 Has ${requestedSide} side: ${hasRequestedSide ? 'Yes' : 'No'}`);
          
          if (!hasRequestedSide) {
            // console.log(`        🎯 FOUND! Empty ${requestedSide} position at "${nodeId}"`);
            return { 
              placementParentId: nodeId, 
              placementPosition: requestedSide 
            };
          }
          
          if (leftChild && !visited.has(leftChild.username)) {
            // console.log(`        ➕ Adding left child to queue: "${leftChild.username}"`);
            queue.push(leftChild.username);
          }
          if (rightChild && !visited.has(rightChild.username)) {
            // console.log(`        ➕ Adding right child to queue: "${rightChild.username}"`);
            queue.push(rightChild.username);
          }
        }
      }
      // console.log(`\n    ⚠️ BFS completed without finding empty slot - Returning sponsor as default`);
      // console.log(`    📊 Total iterations: ${iterationCount}, Total visited: ${visited.size}`);
      return { 
        placementParentId: sponsorIdForSearch, 
        placementPosition: requestedSide 
      };
    };
    // console.log(`\n  🔄 Executing BFS algorithm...`);
    const { placementParentId, placementPosition } = await findPlacementParentBFS(
      sponsorIdForSearch,
      normalizedPosition
    );
    // console.log(`  ✅ BFS completed - Found placement parent: "${placementParentId}" at ${placementPosition} position`);
    
    // console.log(`  👤 Fetching placement parent details...`);
    const placementParent = await User.findOne({
      $or: [{ username: placementParentId }, { userId: placementParentId }],
    });
    const placementName = placementParent?.fullName || placementParentId;
    // console.log(`  ✅ Placement parent found: "${placementName}"`);
    
    // console.log(`  📤 Preparing response...`);
    const response = {
      placementId: placementParentId,
      placementName,
      placementPosition,
    };
    // console.log(`  ✅ Response prepared:`);
    // console.log(`    - Placement ID: ${response.placementId}`);
    // console.log(`    - Placement Name: ${response.placementName}`);
    // console.log(`    - Placement Position: ${response.placementPosition}`);
    // console.log(`  ✅ Returning success response\n`);
    
    return Response.json(response);
  } catch (error) {
    console.error(`  💥 ERROR caught in try-catch block`);
    console.error(`    - Error type: ${error instanceof Error ? error.name : typeof error}`);
    console.error(`    - Error message: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`  ❌ Returning 500 error response\n`);
    
    return Response.json(
      { error: "Failed to determine placement" },
      { status: 500 }
    );
  }
}


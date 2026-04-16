import { connectDB } from '@/lib/database';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    console.log('\n📨 [AUTO-PLACEMENT] POST request received');
    
    console.log('  🔍 Parsing request JSON...');
    const { sponsorId, position } = await req.json();
    console.log(`  ✅ Request parsed: sponsorId="${sponsorId}", position="${position}"`);

    console.log('  🔐 Validating required parameters...');
    if (!sponsorId || !position) {
      console.error('  ❌ VALIDATION FAILED - Missing parameters');
      console.log(`    - sponsorId: ${sponsorId ? '✓' : '✗'}`);
      console.log(`    - position: ${position ? '✓' : '✗'}`);
      return Response.json(
        { error: "sponsorId and position are required" },
        { status: 400 }
      );
    }
    console.log('  ✅ All parameters valid');
    
    console.log(`  🔤 Normalizing position: "${position}" → `);
    const normalizedPosition = position.toLowerCase() as 'left' | 'right';
    console.log(`    "${normalizedPosition}"`);
    
    console.log('  🗄️ Connecting to MongoDB...');
    await connectDB();
    console.log('  ✅ Database connected');
    
    console.log(`  👤 Searching for sponsor: ${sponsorId}...`);
    const sponsor = await User.findOne({
      $or: [{ username: sponsorId }, { userId: sponsorId }],
    });
    console.log(`  ${sponsor ? '✅' : '❌'} Sponsor search result: ${sponsor ? 'Found' : 'Not found'}`);
    if (sponsor) {
      console.log(`    - Sponsor ID: ${sponsor.userId}`);
      console.log(`    - Sponsor Username: ${sponsor.username}`);
      console.log(`    - Sponsor Name: ${sponsor.fullName}`);
    }
    if (!sponsor) {
      console.error('  ❌ Sponsor not found - Returning 404');
      return Response.json({ error: "Sponsor not found" }, { status: 404 });
    }
    
    console.log('  🔧 Preparing sponsor ID for search...');
    const sponsorIdForSearch = sponsor.userId || sponsor.username;
    console.log(`  ✅ Sponsor ID for search: "${sponsorIdForSearch}"`);
    const findPlacementParentBFS = async (
      rootId: string,
      requestedSide: 'left' | 'right'
    ): Promise<{ placementParentId: string; placementPosition: 'left' | 'right' }> => {
      console.log(`\n  🌳 [BFS ALGORITHM] Starting BFS traversal`);
      console.log(`    🎯 Root ID: "${rootId}"`);
      console.log(`    🎯 Requested Side: "${requestedSide}"`);
      
      const queue: string[] = [rootId];
      const visited = new Set<string>();
      const BATCH_SIZE = 15; // Fetch 15 users per DB query
      
      let iterationCount = 0;
      console.log(`    📊 Batch size: ${BATCH_SIZE} users per query`);
      
      while (queue.length > 0) {
        iterationCount++;
        console.log(`\n    ➡️ [Iteration ${iterationCount}] Queue length: ${queue.length}, Visited: ${visited.size}`);
        const batch = queue.splice(0, BATCH_SIZE);
        console.log(`      📦 Processing batch of ${batch.length} IDs: [${batch.join(', ')}]`);
        const orConditions = batch.flatMap(id => [
          { username: id },
          { userId: id }
        ]);
        console.log(`      🔍 Querying database for ${batch.length} users (${orConditions.length} conditions)...`);
        const users = await User.find({ $or: orConditions });
        console.log(`      ✅ Found ${users.length} users from database`);
        
        if (users.length === 0) {
          console.log(`      ⏭️ Skipping empty batch - continuing to next iteration`);
          continue;
        }
        
        for (const currentNode of users) {
          const nodeId = currentNode.userId || currentNode.username;
          console.log(`\n      👤 Processing node: "${nodeId}"`);
          
          if (visited.has(nodeId)) {
            console.log(`        ⏭️ Already visited - Skipping`);
            continue;
          }
          visited.add(nodeId);
          console.log(`        ✅ Marked as visited`);
          
          console.log(`        🔍 Checking child nodes for "${nodeId}"...`);
          const leftChild = await User.findOne({ placementId: nodeId, placementPosition: 'left' }).select('username fullName');
          console.log(`          👈 Left child: ${leftChild ? `Found (${leftChild.username})` : 'Not found'}`);
          
          const rightChild = await User.findOne({ placementId: nodeId, placementPosition: 'right' }).select('username fullName');
          console.log(`          👉 Right child: ${rightChild ? `Found (${rightChild.username})` : 'Not found'}`);
          
          const hasRequestedSide = (requestedSide === 'left' ? !!leftChild : !!rightChild);
          console.log(`          📍 Has ${requestedSide} side: ${hasRequestedSide ? 'Yes' : 'No'}`);
          
          if (!hasRequestedSide) {
            console.log(`        🎯 FOUND! Empty ${requestedSide} position at "${nodeId}"`);
            return { 
              placementParentId: nodeId, 
              placementPosition: requestedSide 
            };
          }
          
          if (leftChild && !visited.has(leftChild.username)) {
            console.log(`        ➕ Adding left child to queue: "${leftChild.username}"`);
            queue.push(leftChild.username);
          }
          if (rightChild && !visited.has(rightChild.username)) {
            console.log(`        ➕ Adding right child to queue: "${rightChild.username}"`);
            queue.push(rightChild.username);
          }
        }
      }
      console.log(`\n    ⚠️ BFS completed without finding empty slot - Returning sponsor as default`);
      console.log(`    📊 Total iterations: ${iterationCount}, Total visited: ${visited.size}`);
      return { 
        placementParentId: sponsorIdForSearch, 
        placementPosition: requestedSide 
      };
    };
    console.log(`\n  🔄 Executing BFS algorithm...`);
    const { placementParentId, placementPosition } = await findPlacementParentBFS(
      sponsorIdForSearch,
      normalizedPosition
    );
    console.log(`  ✅ BFS completed - Found placement parent: "${placementParentId}" at ${placementPosition} position`);
    
    console.log(`  👤 Fetching placement parent details...`);
    const placementParent = await User.findOne({
      $or: [{ username: placementParentId }, { userId: placementParentId }],
    });
    const placementName = placementParent?.fullName || placementParentId;
    console.log(`  ✅ Placement parent found: "${placementName}"`);
    
    console.log(`  📤 Preparing response...`);
    const response = {
      placementId: placementParentId,
      placementName,
      placementPosition,
    };
    console.log(`  ✅ Response prepared:`);
    console.log(`    - Placement ID: ${response.placementId}`);
    console.log(`    - Placement Name: ${response.placementName}`);
    console.log(`    - Placement Position: ${response.placementPosition}`);
    console.log(`  ✅ Returning success response\n`);
    
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


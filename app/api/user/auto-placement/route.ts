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
      const queue: string[] = [rootId];
      const visited = new Set<string>();
      const BATCH_SIZE = 15; // Fetch 15 users per DB query
      while (queue.length > 0) {
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
          
          if (!hasRequestedSide) {
            return { 
              placementParentId: nodeId, 
              placementPosition: requestedSide 
            };
          }
          if (leftChild && !visited.has(leftChild.username)) {
            queue.push(leftChild.username);
          }
          if (rightChild && !visited.has(rightChild.username)) {
            queue.push(rightChild.username);
          }
        }
      }
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
    return Response.json({
      placementId: placementParentId,
      placementName,
      placementPosition,
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to determine placement" },
      { status: 500 }
    );
  }
}


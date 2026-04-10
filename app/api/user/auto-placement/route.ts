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
    const findPlacementParent = async (
      parentId: string,
      side: 'left' | 'right'
    ): Promise<{ placementParentId: string; placementPosition: 'left' | 'right' }> => {
      const parent = await User.findOne({
        $or: [{ username: parentId }, { userId: parentId }],
      });

      if (!parent) {
        return { placementParentId: parentId, placementPosition: side };
      }
      const hasLeftChild = parent.directMembers?.some(m => m.position === 'left');
      const hasRightChild = parent.directMembers?.some(m => m.position === 'right');

      if (side === 'left' && !hasLeftChild) {
        return { placementParentId: parent.userId || parent.username, placementPosition: 'left' };
      } else if (side === 'right' && !hasRightChild) {
        return { placementParentId: parent.userId || parent.username, placementPosition: 'right' };
      } else if (side === 'left' && hasLeftChild) {
        const leftChild = parent.directMembers?.find(m => m.position === 'left');
        if (leftChild) {
          return findPlacementParent(leftChild.memberId, 'left');
        }
      } else if (side === 'right' && hasRightChild) {
        const rightChild = parent.directMembers?.find(m => m.position === 'right');
        if (rightChild) {
          return findPlacementParent(rightChild.memberId, 'right');
        }
      }

      return { placementParentId: parent.userId || parent.username, placementPosition: side };
    };

    const { placementParentId, placementPosition } = await findPlacementParent(
      sponsor.userId || sponsor.username,
      normalizedPosition
    );

    const placementParent = await User.findOne({
      $or: [{ username: placementParentId }, { userId: placementParentId }],
    });

    const placementName = placementParent?.fullName || placementParentId;

    console.log("✅ AUTO-PLACEMENT DETERMINED:", {
      sponsorId: sponsor.userId || sponsor.username,
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


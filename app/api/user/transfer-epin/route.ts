import { connectDB } from "@/lib/database";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientMemberId, pin, package: packageName, remark } = await req.json();

    // Validate inputs
    if (!recipientMemberId || !pin) {
      return Response.json({ 
        error: "Recipient Member ID and E-Pin are required" 
      }, { status: 400 });
    }

    await connectDB();

    // Find sender user
    const senderUser = await User.findById(session.user.id);
    if (!senderUser) {
      return Response.json({ error: "Sender user not found" }, { status: 404 });
    }

    // Find recipient user by username or userId
    let recipientUser = await User.findOne({ username: recipientMemberId });
    if (!recipientUser) {
      recipientUser = await User.findOne({ userId: recipientMemberId });
    }

    if (!recipientUser) {
      return Response.json({ 
        error: `Recipient member ${recipientMemberId} not found` 
      }, { status: 404 });
    }

    // Check if sender has the pin
    const pinIndex = (senderUser.ePins || []).findIndex(
      (p: any) => p.pin === pin && !p.usedDate
    );

    if (pinIndex === -1 || pinIndex === undefined) {
      return Response.json({ 
        error: "E-Pin not found or already used" 
      }, { status: 400 });
    }

    // Get the pin object
    const pinToTransfer = (senderUser.ePins || [])[pinIndex];

    // Remove pin from sender
    (senderUser.ePins || []).splice(pinIndex, 1);
    await senderUser.save();

    console.log(`📤 Removed pin ${pin} from sender ${senderUser.username}`);

    // Add pin to recipient
    if (!recipientUser.ePins) {
      recipientUser.ePins = [];
    }
    
    recipientUser.ePins.push({
      pin: pinToTransfer.pin,
      packageName: pinToTransfer.packageName,
      transferredFrom: senderUser.username,
      transferredFromName: senderUser.fullName || senderUser.username,
      transferDate: new Date(),
      remark: remark || undefined,
    });

    await recipientUser.save();

    console.log(`📥 Added pin ${pin} to recipient ${recipientUser.username}`);

    return Response.json({
      success: true,
      message: `E-Pin ${pin} transferred successfully to ${recipientUser.fullName || recipientUser.username}`,
      senderPinsRemaining: (senderUser.ePins || []).length,
      recipientPinsTotal: (recipientUser.ePins || []).length
    });

  } catch (error) {
    console.error("Transfer E-Pin error:", error);
    return Response.json({ 
      error: "An error occurred during transfer" 
    }, { status: 500 });
  }
}

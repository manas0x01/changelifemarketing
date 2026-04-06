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
    const { transactionPassword } = await req.json();
    await connectDB();
    const user = await User.findById(session.user.id).select("+transactionPassword");
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    const isPasswordValid = await user.compareTransactionPassword(transactionPassword);
    if (!isPasswordValid) {
      return Response.json({
        error: "Invalid transaction password",
        verified: false
      }, { status: 400 });
    }
    const availablePins = user.ePins?.filter((pin: any) => !pin.usedDate) || [];
    if (availablePins.length === 0) {
      return Response.json({
        error: "No PIN available. First Buy The PIN",
        verified: false,
        pinsAvailable: false
      }, { status: 400 });
    }
    return Response.json({
      success: true,
      verified: true,
      pinsAvailable: true,
      availablePinsCount: availablePins.length,
      pins: availablePins.map((pin: any) => ({
        pin: pin.pin,
        packageName: pin.packageName
      }))
    });
  } catch (error) {
    return Response.json({
      error: "An error occurred during verification"
    }, { status: 500 });
  }
}

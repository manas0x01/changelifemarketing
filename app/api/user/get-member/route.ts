import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("id");

    if (!memberId) {
      return Response.json({ error: "Member ID is required" }, { status: 400 });
    }

    await connectDB();

    // Find user by username or userId
    let user = await User.findOne({ username: memberId });
    if (!user) {
      user = await User.findOne({ userId: memberId });
    }

    if (!user) {
      return Response.json({ 
        error: `Member ${memberId} not found` 
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      memberId: user.username || user.userId,
      memberName: user.fullName || user.username,
      email: user.email,
      joiningDate: user.joiningDate
    });

  } catch (error) {
    console.error("Fetch member error:", error);
    return Response.json({ 
      error: "An error occurred while fetching member details" 
    }, { status: 500 });
  }
}

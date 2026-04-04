import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.username) {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { oldPassword, newPassword, confirmPassword } = body;

        // Validation
        if (!oldPassword || !newPassword || !confirmPassword) {
            return Response.json({ 
                success: false, 
                message: "All fields are required" 
            }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return Response.json({ 
                success: false, 
                message: "New password must be at least 6 characters" 
            }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return Response.json({ 
                success: false, 
                message: "Passwords do not match" 
            }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ username: session.user.username }).select("+transactionPassword");

        if (!user) {
            return Response.json({ 
                success: false, 
                message: "User not found" 
            }, { status: 404 });
        }

        // Verify old transaction password
        const isOldPasswordValid = await user.compareTransactionPassword(oldPassword);

        if (!isOldPasswordValid) {
            return Response.json({ 
                success: false, 
                message: "Old transaction password is incorrect" 
            }, { status: 400 });
        }

        // Update with new transaction password
        user.transactionPassword = newPassword;
        await user.save();

        return Response.json({
            success: true,
            message: "Transaction password changed successfully!"
        });

    } catch (error) {
        console.error("Error changing transaction password:", error);
        return Response.json({ 
            success: false, 
            message: "Internal server error" 
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session?.user?.username) {
            return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findOne({ username: session.user.username }).select("+transactionPassword");

        if (!user) {
            return Response.json({ 
                success: false, 
                message: "User not found" 
            }, { status: 404 });
        }

        // Check if user has transaction password set
        return Response.json({
            success: true,
            hasTransactionPassword: !!user.transactionPassword
        });

    } catch (error) {
        console.error("Error checking transaction password:", error);
        return Response.json({ 
            success: false, 
            message: "Internal server error" 
        }, { status: 500 });
    }
}

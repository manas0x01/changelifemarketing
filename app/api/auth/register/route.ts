import { connectDB } from "@/lib/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const registrationData = await req.json();

        const {
            userId,
            sponsorId,
            placementId,
            position,
            package: packageName,
            epin,
            fullName,
            gender,
            mobileNo,
            email,
            dateOfBirth,
            panNo,
            state,
            district,
            city,
            address,
            pincode,
            nomineeName,
            nomineeRelation,
            bankName,
            branchName,
            accountNo,
            ifsc,
            accountType,
            password,
            transactionPassword,
        } = registrationData;

        // Validate required fields
        if (!fullName?.trim()) {
            return Response.json({ error: "Full name is required" }, { status: 400 });
        }
        if (!mobileNo?.trim()) {
            return Response.json({ error: "Mobile number is required" }, { status: 400 });
        }
        if (!password?.trim()) {
            return Response.json({ error: "Password is required" }, { status: 400 });
        }
        if (!transactionPassword?.trim()) {
            return Response.json({ error: "Transaction password is required" }, { status: 400 });
        }

        await connectDB();

        // Check if mobile number already exists
        const existingUser = await User.findOne({ mobileNo });
        if (existingUser) {
            return Response.json({ error: "Mobile number already registered" }, { status: 400 });
        }

        // Check if sponsor exists and has available E-Pins
        const sponsor = await User.findOne({
            $or: [
                { username: sponsorId },
                { userId: sponsorId },
            ]
        });

        if (!sponsor) {
            return Response.json({ error: "Sponsor ID not found" }, { status: 404 });
        }

        // Check available E-Pins
        const availableEPin = sponsor.ePins?.find((pin: any) => pin.pin === epin && !pin.usedDate);
        if (!availableEPin) {
            return Response.json({ error: "E-Pin not available or already used" }, { status: 400 });
        }

        // Generate sequential userId with CLM2026 prefix
        // Find the highest existing userId
        const lastUser = await User.findOne({ userId: /^CLM2026/ }).sort({ userId: -1 });
        let nextSequence = 1;
        
        if (lastUser?.userId) {
            const match = lastUser.userId.match(/CLM2026(\d+)/);
            if (match) {
                nextSequence = parseInt(match[1]) + 1;
            }
        }
        
        const autoUserId = `CLM2026${nextSequence}`;
        
        // Use provided userId or auto-generated one
        const finalUserId = userId && userId !== "CLM" ? userId : autoUserId;
        const username = finalUserId; // Username is same as userId
        
        // Check if userId already exists
        const existingUserId = await User.findOne({ userId: finalUserId });
        if (existingUserId) {
            return Response.json({ error: "User ID already exists" }, { status: 400 });
        }

        const newUser = new User({
            username,
            userId: finalUserId,
            password,
            transactionPassword,
            fullName,
            gender,
            mobileNo,
            email,
            dateOfBirth,
            panNo,
            state,
            district,
            city,
            address,
            pincode,
            nomineeName,
            nomineeRelation,
            bankName,
            branchName,
            accountNo,
            ifsc,
            accountType,
            sponsorId,
            placementId,
            role: "user",
            joiningDate: new Date().toISOString().split("T")[0],
        });

        await newUser.save();

        // Mark E-Pin as used
        const pinIndex = sponsor.ePins!.findIndex((pin: any) => pin.pin === epin);
        if (pinIndex !== -1) {
            sponsor.ePins![pinIndex].usedDate = new Date();
            await sponsor.save();
        }

        return Response.json({
            success: true,
            message: "Registration successful",
            user: {
                id: newUser._id,
                userId: finalUserId,
                username,
                fullName,
            },
        });
    } catch (error) {
        // Handle specific error cases
        if (error instanceof Error) {
            
            if (error.message.includes("password")) {
                return Response.json({ error: "Password hashing failed" }, { status: 500 });
            }
            
            if (error.message.includes("duplicate")) {
                return Response.json({ error: "User already exists" }, { status: 400 });
            }
        }
        
        return Response.json({ 
            error: error instanceof Error ? error.message : "Registration failed",
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}

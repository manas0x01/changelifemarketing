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
        } = registrationData;
        if (!fullName?.trim()) {
            return Response.json({ error: "Full name is required" }, { status: 400 });
        }
        if (!mobileNo?.trim()) {
            return Response.json({ error: "Mobile number is required" }, { status: 400 });
        }
        if (!password?.trim()) {
            return Response.json({ error: "Password is required" }, { status: 400 });
        }
        await connectDB();
        const existingUser = await User.findOne({ mobileNo });
        if (existingUser) {
            return Response.json({ error: "Mobile number already registered" }, { status: 400 });
        }
        const sponsor = await User.findOne({
            $or: [
                { username: sponsorId },
                { userId: sponsorId },
            ]
        });
        if (!sponsor) {
            return Response.json({ error: "Sponsor ID not found" }, { status: 404 });
        }
        const availableEPin = sponsor.ePins?.find((pin: any) => pin.pin === epin && !pin.usedDate);
        if (!availableEPin) {
            return Response.json({ error: "E-Pin not available or already used" }, { status: 400 });
        }
        const lastUser = await User.findOne({ userId: /^CLM2026/ }).sort({ userId: -1 });
        let nextSequence = 1;
        
        if (lastUser?.userId) {
            const match = lastUser.userId.match(/CLM2026(\d+)/);
            if (match) {
                nextSequence = parseInt(match[1]) + 1;
            }
        }
        const autoUserId = `CLM2026${nextSequence}`;
        const finalUserId = userId && userId !== "CLM" ? userId : autoUserId;
        const username = finalUserId; // Username is same as userId
        const existingUserId = await User.findOne({ userId: finalUserId });
        if (existingUserId) {
            return Response.json({ error: "User ID already exists" }, { status: 400 });
        }

        const newUser = new User({
            username,
            userId: finalUserId,
            password,
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
            placementPosition: position.toLowerCase(),
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

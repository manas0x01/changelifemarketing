import { connectDB } from "@/lib/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const registrationData = await req.json();

        const {
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

        // Create new user
        const userId = `USR${Date.now()}`;
        const username = mobileNo; // Use mobile number as username

        const newUser = new User({
            username,
            userId,
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

        console.log(`✅ User registered successfully: ${username} (${userId})`);

        return Response.json({
            success: true,
            message: "Registration successful",
            user: {
                id: newUser._id,
                userId,
                username,
                fullName,
            },
        });
    } catch (error) {
        console.error("❌ Registration error:", error);
        if (error instanceof Error && error.message.includes("password")) {
            return Response.json({ error: "Password hashing failed" }, { status: 500 });
        }
        return Response.json({ error: "Registration failed" }, { status: 500 });
    }
}

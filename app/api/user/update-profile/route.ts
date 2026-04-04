import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        console.log("\n========== 🔵 [UpdateProfile-GET] START ==========");
        
        const session = await getServerSession(authOptions);
        console.log("📥 [UpdateProfile-GET] Session exists:", !!session);
        console.log("📥 [UpdateProfile-GET] Full session:", JSON.stringify(session, null, 2));
        
        if (!session) {
            console.error("❌ [UpdateProfile-GET] NO SESSION AT ALL");
            return Response.json({
                success: true,
                data: {
                    id: null,
                    username: "",
                    fullName: "",
                    gender: "Male",
                    email: "",
                    phone: "",
                    mobileNo: "",
                    dateOfBirth: "",
                    panNo: "",
                    state: "Bihar",
                    district: "Patna",
                    city: "",
                    address: "",
                    pincode: "",
                    bankName: "",
                    branchName: "",
                    accountNo: "",
                    ifsc: "",
                    accountType: "",
                    nomineeName: "",
                    nomineeRelation: "Son",
                    joiningDate: "",
                    sponsorId: "",
                    sponsorName: "",
                    placementId: "",
                    placementName: "",
                }
            });
        }
        
        if (!session?.user?.username) {
            console.error("❌ [UpdateProfile-GET] No username in session");
            console.log("   session.user:", session.user);
            return Response.json({
                success: true,
                data: {
                    id: null,
                    username: "",
                    fullName: "",
                    gender: "Male",
                    email: "",
                    phone: "",
                    mobileNo: "",
                    dateOfBirth: "",
                    panNo: "",
                    state: "Bihar",
                    district: "Patna",
                    city: "",
                    address: "",
                    pincode: "",
                    bankName: "",
                    branchName: "",
                    accountNo: "",
                    ifsc: "",
                    accountType: "",
                    nomineeName: "",
                    nomineeRelation: "Son",
                    joiningDate: "",
                    sponsorId: "",
                    sponsorName: "",
                    placementId: "",
                    placementName: "",
                }
            });
        }

        console.log(`✅ [UpdateProfile-GET] Session username found: "${session.user.username}"`);

        console.log("🔵 [UpdateProfile-GET] Connecting to database...");
        await connectDB();
        console.log("✅ [UpdateProfile-GET] Database connected");
        
        console.log(`🔍 [UpdateProfile-GET] Querying user with username: "${session.user.username}"`);
        const user = await User.findOne({ username: session.user.username }).select("-password -transactionPassword");

        if (!user) {
            console.error(`❌ [UpdateProfile-GET] User not found in database for username: "${session.user.username}"`);
            console.log("🔍 [UpdateProfile-GET] Checking all users in database:");
            const allUsers = await User.find({}).select("username fullName email");
            console.log("   All users:", allUsers);
            
            return Response.json({
                success: true,
                data: {
                    id: null,
                    username: "",
                    fullName: "",
                    gender: "Male",
                    email: "",
                    phone: "",
                    mobileNo: "",
                    dateOfBirth: "",
                    panNo: "",
                    state: "Bihar",
                    district: "Patna",
                    city: "",
                    address: "",
                    pincode: "",
                    bankName: "",
                    branchName: "",
                    accountNo: "",
                    ifsc: "",
                    accountType: "",
                    nomineeName: "",
                    nomineeRelation: "Son",
                    joiningDate: "",
                    sponsorId: "",
                    sponsorName: "",
                    placementId: "",
                    placementName: "",
                }
            });
        }

        console.log(`✅ [UpdateProfile-GET] User found: ${user.username}`);
        console.log(`🔍 [UpdateProfile-GET] User ID: ${user._id}`);
        console.log(`🔍 [UpdateProfile-GET] User fullName: ${user.fullName}`);
        console.log(`🔍 [UpdateProfile-GET] Placement data from database:`, {
            joiningDate: user.joiningDate || "(EMPTY)",
            sponsorId: user.sponsorId || "(EMPTY)",
            sponsorName: user.sponsorName || "(EMPTY)",
            placementId: user.placementId || "(EMPTY)",
            placementName: user.placementName || "(EMPTY)",
        });

        const responseData = {
            id: user._id,
            username: user.username || "",
            fullName: user.fullName || "",
            gender: user.gender || "Male",
            email: user.email || "",
            phone: user.phone || "",
            mobileNo: user.mobileNo || "",
            dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : "",
            panNo: user.panNo || "",
            state: user.state || "Bihar",
            district: user.district || "Patna",
            city: user.city || "",
            address: user.address || "",
            pincode: user.pincode || "",
            bankName: user.bankName || "",
            branchName: user.branchName || "",
            accountNo: user.accountNo || "",
            ifsc: user.ifsc || "",
            accountType: user.accountType || "",
            nomineeName: user.nomineeName || "",
            nomineeRelation: user.nomineeRelation || "Son",
            joiningDate: user.joiningDate || "",
            sponsorId: user.sponsorId || "",
            sponsorName: user.sponsorName || "",
            placementId: user.placementId || "",
            placementName: user.placementName || "",
        };

        console.log(`📤 [UpdateProfile-GET] Sending response data:`, responseData);
        console.log("========== ✅ [UpdateProfile-GET] END ==========\n");

        return Response.json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error("❌ [UpdateProfile-GET] EXCEPTION:", error);
        console.error("   Stack:", error instanceof Error ? error.stack : "no stack");
        console.log("========== ❌ [UpdateProfile-GET] END (ERROR) ==========\n");
        
        return Response.json({
            success: true,
            data: {
                id: null,
                username: "",
                fullName: "",
                gender: "Male",
                email: "",
                phone: "",
                mobileNo: "",
                dateOfBirth: "",
                panNo: "",
                state: "Bihar",
                district: "Patna",
                city: "",
                address: "",
                pincode: "",
                bankName: "",
                branchName: "",
                accountNo: "",
                ifsc: "",
                accountType: "",
                nomineeName: "",
                nomineeRelation: "Son",
                joiningDate: "",
                sponsorId: "",
                sponsorName: "",
                placementId: "",
                placementName: "",
            },
        });
    }
}

export async function POST(req: Request) {
    try {
        console.log("🔵 [UpdateProfile-POST] Route called");
        
        const session = await getServerSession(authOptions);
        console.log("✅ [UpdateProfile-POST] Session check:", session ? "Present" : "Missing");
        
        if (session?.user) {
            console.log("🔍 [UpdateProfile-POST] Session user:", {
                username: session.user.username,
                email: session.user.email,
            });
        }
        
        if (!session?.user?.username) {
            console.log('❌ [UpdateProfile-POST] No valid authentication found');
            return Response.json({ 
                error: "Unauthorized - Please login" 
            }, { status: 401 });
        }

        const profileData = await req.json();
        console.log("📥 [UpdateProfile-POST] Profile data received:", {
            fullName: profileData.fullName,
            joiningDate: profileData.joiningDate,
            sponsorId: profileData.sponsorId,
            sponsorName: profileData.sponsorName,
            placementId: profileData.placementId,
            placementName: profileData.placementName,
        });

        await connectDB();

        // Validate mobile number format if provided (must be 10 digits)
        if (profileData.mobileNo && !/^\d{10}$/.test(profileData.mobileNo)) {
            return Response.json(
                { error: "Mobile number must be 10 digits" },
                { status: 400 }
            );
        }

        // Validate PAN number format if provided (ABCDE1234F format)
        if (profileData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(profileData.panNo)) {
            return Response.json(
                { error: "PAN number format is invalid" },
                { status: 400 }
            );
        }

        // Build update object - only include fields that are provided
        const updateData: any = {};
        
        if (profileData.fullName !== undefined) updateData.fullName = profileData.fullName;
        if (profileData.gender !== undefined) updateData.gender = profileData.gender;
        if (profileData.phone !== undefined) updateData.phone = profileData.phone;
        if (profileData.mobileNo !== undefined) updateData.mobileNo = profileData.mobileNo;
        if (profileData.dateOfBirth !== undefined) updateData.dateOfBirth = profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : null;
        if (profileData.panNo !== undefined) updateData.panNo = profileData.panNo ? profileData.panNo.toUpperCase() : null;
        if (profileData.state !== undefined) updateData.state = profileData.state;
        if (profileData.district !== undefined) updateData.district = profileData.district;
        if (profileData.city !== undefined) updateData.city = profileData.city;
        if (profileData.address !== undefined) updateData.address = profileData.address;
        if (profileData.pincode !== undefined) updateData.pincode = profileData.pincode;
        if (profileData.bankName !== undefined) updateData.bankName = profileData.bankName;
        if (profileData.branchName !== undefined) updateData.branchName = profileData.branchName;
        if (profileData.accountNo !== undefined) updateData.accountNo = profileData.accountNo;
        if (profileData.ifsc !== undefined) updateData.ifsc = profileData.ifsc;
        if (profileData.accountType !== undefined) updateData.accountType = profileData.accountType;
        if (profileData.nomineeName !== undefined) updateData.nomineeName = profileData.nomineeName;
        if (profileData.nomineeRelation !== undefined) updateData.nomineeRelation = profileData.nomineeRelation;
        if (profileData.joiningDate !== undefined) updateData.joiningDate = profileData.joiningDate;
        if (profileData.sponsorId !== undefined) updateData.sponsorId = profileData.sponsorId;
        if (profileData.sponsorName !== undefined) updateData.sponsorName = profileData.sponsorName;
        if (profileData.placementId !== undefined) updateData.placementId = profileData.placementId;
        if (profileData.placementName !== undefined) updateData.placementName = profileData.placementName;

        console.log("🔍 [UpdateProfile-POST] Update data to be saved:", {
            joiningDate: updateData.joiningDate,
            sponsorId: updateData.sponsorId,
            sponsorName: updateData.sponsorName,
            placementId: updateData.placementId,
            placementName: updateData.placementName,
        });

        // Update user (using username for consistency)
        console.log(`📍 [UpdateProfile-POST] Looking up user by username: ${session.user.username}`);
        
        const user = await User.findOneAndUpdate(
            { username: session.user.username },
            updateData,
            { new: true }
        ).select('-password -transactionPassword');

        if (!user) {
            console.log(`❌ [UpdateProfile-POST] User not found: ${session.user.username}`);
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        console.log("✅ [UpdateProfile-POST] Profile updated successfully");
        console.log("🔍 [UpdateProfile-POST] Updated placement data in DB:", {
            joiningDate: user.joiningDate,
            sponsorId: user.sponsorId,
            sponsorName: user.sponsorName,
            placementId: user.placementId,
            placementName: user.placementName,
        });

        return Response.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("❌ Error updating profile:", error);
        return Response.json({ 
            error: "Failed to update profile" 
        }, { status: 500 });
    }
}

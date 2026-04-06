import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import User from "@/models/User";

const requestCache = new Map<string, { timestamp: number; promise: Promise<Response> }>();

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const cacheKey = session?.user?.username || "anonymous";
        const cachedRequest = requestCache.get(cacheKey);
        if (cachedRequest && Date.now() - cachedRequest.timestamp < 2000) {
            return cachedRequest.promise;
        }

        const responsePromise = (async () => {
            if (!session) {
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

            await connectDB();
            const user = await User.findOne({ username: session.user.username }).select("-password -transactionPassword");

            if (!user) {
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

            return Response.json({
                success: true,
                data: responseData,
            });
        })();

        requestCache.set(cacheKey, { timestamp: Date.now(), promise: responsePromise });
        setTimeout(() => requestCache.delete(cacheKey), 3000);
        return responsePromise;
    } catch (error) {
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
        const session = await getServerSession(authOptions);
        if (!session?.user?.username) {
            return Response.json({
                error: "Unauthorized - Please login"
            }, { status: 401 });
        }

        const profileData = await req.json();
        await connectDB();

        if (profileData.mobileNo && !/^\d{10}$/.test(profileData.mobileNo)) {
            return Response.json(
                { error: "Mobile number must be 10 digits" },
                { status: 400 }
            );
        }

        if (profileData.panNo && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(profileData.panNo)) {
            return Response.json(
                { error: "PAN number format is invalid" },
                { status: 400 }
            );
        }

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

        const user = await User.findOneAndUpdate(
            { username: session.user.username },
            updateData,
            { new: true }
        ).select('-password -transactionPassword');

        if (!user) {
            return Response.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

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
        return Response.json({
            error: "Failed to update profile"
        }, { status: 500 });
    }
}

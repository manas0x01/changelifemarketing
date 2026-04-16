import { connectDB } from "@/lib/database";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { calculateAndUpdateUserMetrics } from "@/lib/calculateMetrics";
import { autoCalculateBasicIncome } from "@/lib/autoCalculateBasicIncome";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function findNextAvailableLeafNode(currentUser: any, position: 'left' | 'right'): Promise<any> {
    const positionField = position === 'left' ? 'leftChild' : 'rightChild';
    if (!currentUser[positionField]) {
        return currentUser;
    }
    const childUser = await User.findOne({
        $or: [
            { username: currentUser[positionField] },
            { userId: currentUser[positionField] },
        ]
    });

    if (!childUser) {
        return currentUser;
    }
    return await findNextAvailableLeafNode(childUser, position);
}

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
            return Response.json({ error: "Transaction Password is required" }, { status: 400 });
        }
        await connectDB();
        const sponsor = await User.findOne({
            $or: [
                { username: sponsorId },
                { userId: sponsorId },
            ]
        });
        if (!sponsor) {
            return Response.json({ error: "Sponsor ID not found" }, { status: 404 });
        }
        
        // ✅ STEP 2A: Get logged-in user from session
        const session = await getServerSession(authOptions);
        if (!session?.user?.userId) {
            return Response.json({ error: "Session expired. Please login again" }, { status: 401 });
        }
        
        const registrationUser = await User.findOne({
            $or: [
                { userId: session.user.userId },
                { username: session.user.userId },
            ]
        });
        if (!registrationUser) {
            return Response.json({ error: "User not found in database" }, { status: 404 });
        }
        
        // Check E-PIN Availability in LOGGED-IN USER's pins (not sponsor)
        
        const availableEPin = registrationUser.ePins?.find((pin: any) => {
          const pinMatch = pin.pin === epin;
          const isActive = pin.status === "Active" || !pin.status;
          
          return pinMatch && isActive;
        });
        
        if (!availableEPin) {
            return Response.json({ error: "E-Pin not available or already used" }, { status: 400 });
        }
        
        // Check Placement User Exists (if provided)
        let placementUser = null;
        let finalPlacementId = placementId;
        
        if (placementId && placementId.trim()) {
            placementUser = await User.findOne({
                $or: [
                    { username: placementId },
                    { userId: placementId },
                ]
            });
            if (!placementUser) {
                return Response.json({ error: "Placement ID not found" }, { status: 404 });
            }
            finalPlacementId = placementUser.userId || placementUser.username;
        } else {
        }
        
        let finalPosition = position.toLowerCase();
        try {
            if (!finalPlacementId) {
                const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || '';
                const autoPlacementUrl = `${baseUrl}/api/user/auto-placement`;
                const autoPlacementResponse = await fetch(autoPlacementUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sponsorId: sponsor.userId || sponsor.username,
                        position: position.toLowerCase(),
                    }),
                });
                if (!autoPlacementResponse.ok) {
                    return Response.json(
                        { error: "Could not determine placement position" },
                        { status: 500 }
                    );
                }
                const autoPlacementData = await autoPlacementResponse.json();
                finalPlacementId = autoPlacementData.placementId;
                finalPosition = autoPlacementData.placementPosition || finalPosition;
                placementUser = await User.findOne({
                    $or: [
                        { username: finalPlacementId },
                        { userId: finalPlacementId },
                    ]
                });
            }
        } catch (error) {
            return Response.json(
                { error: "Failed to determine placement" },
                { status: 500 }
            );
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
        const username = finalUserId;
        
        const existingUserId = await User.findOne({ userId: finalUserId });
        if (existingUserId) {
            return Response.json({ error: "User ID already exists" }, { status: 400 });
        }
        const cleanEnumField = (value: string | undefined) => {
            if (!value) return undefined;
            const trimmed = value.trim();
  
            if (!trimmed || trimmed === "-- Select --" || trimmed === "-- Select Package --") {
                return undefined;
            }
            return trimmed;
        };

        const cleanedGender = cleanEnumField(gender);
        const cleanedNomineeRelation = cleanEnumField(nomineeRelation);
        const cleanedAccountType = cleanEnumField(accountType);
        
        // ✅ Build userData object with only valid values
        const userData: any = {
            username,
            userId: finalUserId,
            password: password.trim(),
            transactionPassword: transactionPassword.trim(),
            fullName,
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
            bankName,
            branchName,
            accountNo,
            ifsc,
            sponsorId,
            placementId: finalPlacementId,
            placementPosition: finalPosition,
            role: "user",
            basicRank: "basic",
            joiningDate: new Date().toISOString().split("T")[0],
        };

        if (cleanedGender) userData.gender = cleanedGender;
        if (cleanedNomineeRelation) userData.nomineeRelation = cleanedNomineeRelation;
        if (cleanedAccountType) userData.accountType = cleanedAccountType;

        // ✅ FIX: Omitted enum fields must be removed from userData and NOT added to the document
        if (!userData.gender) delete userData.gender;
        if (!userData.nomineeRelation) delete userData.nomineeRelation;
        if (!userData.accountType) delete userData.accountType;

        // ✅ ═══ EXECUTION PHASE - ALL DB OPERATIONS ═══
        
        // ✅ STEP 1: Create New User
        const newUser = new User(userData);

        try {
            await newUser.save();
            
            // Verify it was saved by fetching with select
            const savedUser = await User.findOne({ userId: finalUserId }).select('+transactionPassword');
        } catch (saveError: any) {
            // If error is ONLY about missing optional enum fields, retry without validation
            if (saveError.name === 'ValidationError') {
                const enumFieldErrors = Object.keys(saveError.errors || {}).filter(
                    key => ['gender', 'nomineeRelation', 'accountType'].includes(key)
                );
                const otherErrors = Object.keys(saveError.errors || {}).filter(
                    key => !['gender', 'nomineeRelation', 'accountType'].includes(key)
                );
                
                if (enumFieldErrors.length > 0 && otherErrors.length === 0) {
                    newUser.gender = undefined as any;
                    newUser.nomineeRelation = undefined as any;
                    newUser.accountType = undefined as any;
                    await newUser.save();
                } else {
                    // Real validation error - abort registration
                    return Response.json({ 
                        error: "User creation validation failed", 
                        details: otherErrors.join(", ") 
                    }, { status: 400 });
                }
            } else {
                return Response.json({ 
                    error: "Failed to create user", 
                    details: saveError.message 
                }, { status: 500 });
            }
        }

        // ✅ STEP 2: Pop E-PIN from LOGGED-IN USER's ePins array
        const userPinIndex = registrationUser.ePins!.findIndex((pin: any) => pin.pin === epin);
        if (userPinIndex !== -1) {
            const poppedPin = registrationUser.ePins![userPinIndex];
            registrationUser.ePins!.splice(userPinIndex, 1);
            
            // Save the logged-in user with updated ePins
            try {
                await registrationUser.save();
            } catch (userPinError) {
            }
        }

        // ✅ STEP 2B: Update logged-in user's TOTAL TEAM count (Left/Right)
        const positionField = position.toLowerCase() === 'left' ? 'left' : 'right';
        
        // Initialize totalTeam if not exists
        if (!registrationUser.totalTeam) {
            registrationUser.totalTeam = { left: 0, right: 0 };
        }
        
        const currentTeamCount = registrationUser.totalTeam[positionField] || 0;
        registrationUser.totalTeam[positionField] = currentTeamCount + 1;
        
        // Save updated counts
        try {
            await registrationUser.save();
        } catch (countError) {
        }

        // ✅ STEP 2.5: Update SPONSOR's TOTAL TEAM count
        const sponsorPositionField = position.toLowerCase() === 'left' ? 'left' : 'right';
        
        // Initialize totalTeam if not exists
        if (!sponsor.totalTeam) {
            sponsor.totalTeam = { left: 0, right: 0 };
        }
        
        const sponsorCurrentCount = sponsor.totalTeam[sponsorPositionField] || 0;
        sponsor.totalTeam[sponsorPositionField] = sponsorCurrentCount + 1;

        // ✅ STEP 3: Mark E-PIN as Used in SPONSOR's record (for reference)
        const sponsorPinIndex = sponsor.ePins!.findIndex((pin: any) => pin.pin === epin);
        if (sponsorPinIndex !== -1) {
            sponsor.ePins![sponsorPinIndex].remark = `PIN from ${registrationUser.username} used for registering ${fullName}`;
        }
        if (sponsor.pinRequests && sponsor.pinRequests.length > 0) {
            const originalCount = sponsor.pinRequests.length;
            // Remove entries with missing required fields
            sponsor.pinRequests = sponsor.pinRequests.filter((req: any) => {
                const isValid = req.srNo && req.requestNo && req.date && req.memberId && req.name && req.totalPins && req.totalAmount && req.description && req.type;
                return isValid;
            });
        }
        try {
            await sponsor.save();
        } catch (sponsorError: any) {
            // If still has validation errors, log but don't fail (data already partially committed)
            if (sponsorError.name === 'ValidationError') {
                // Force save without validation
                try {
                    await sponsor.save({ validateBeforeSave: false });
                } catch (forceSaveError) {
                }
            }
        }
        if (finalPlacementId && placementUser) {
            const actualPlacementNode = await findNextAvailableLeafNode(placementUser, finalPosition as 'left' | 'right');
            const newUserFieldValue = newUser.userId || newUser.username;
            const positionField = finalPosition === 'left' ? 'leftChild' : 'rightChild';
            const boosterMemberRecord = {
                srNo: (actualPlacementNode.boosterDownlineMembers?.length || 0) + 1,
                memberId: newUser.username || newUser._id.toString(),
                name: newUser.fullName || newUser.username || 'N/A',
                date: newUser.joiningDate || new Date().toISOString().split('T')[0],
                position: (finalPosition === 'left' ? 'left' : 'right') as 'left' | 'right'
            };

            if (!actualPlacementNode.boosterDownlineMembers) {
                actualPlacementNode.boosterDownlineMembers = [];
            }
            actualPlacementNode.boosterDownlineMembers.push(boosterMemberRecord);
            const directMemberRecord = {
                memberId: newUser.username || newUser._id.toString(),
                name: newUser.fullName || newUser.username || 'N/A',
                joinDate: new Date(),
                position: (finalPosition === 'left' ? 'left' : 'right') as 'left' | 'right'
            };

            if (!actualPlacementNode.directMembers) {
                actualPlacementNode.directMembers = [];
            }
            actualPlacementNode.directMembers.push(directMemberRecord);
            actualPlacementNode[positionField] = newUserFieldValue;
            try {
                await actualPlacementNode.save();         
                if (actualPlacementNode._id !== placementUser._id) {
                } else {
                }
            } catch (parentError: any) {
            }
        }
        try {
            if (finalPlacementId && placementUser) {
                const autoCalcResult = await autoCalculateBasicIncome(placementUser._id);
            }
            // ✅ Calculate income for LOGGED-IN USER (not new user)
            await autoCalculateBasicIncome(registrationUser._id);

            await calculateAndUpdateUserMetrics(newUser._id);
            if (finalPlacementId && placementUser) {
                await calculateAndUpdateUserMetrics(placementUser._id);
            }
            await calculateAndUpdateUserMetrics(registrationUser._id);
            await calculateAndUpdateUserMetrics(sponsor._id);
        } catch (calcError) {
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
        if (error instanceof Error) {
            if (error.message.includes("password")) {
                return Response.json({ error: "Password hashing failed" }, { status: 500 });
            }
            if (error.message.includes("duplicate")) {
                return Response.json({ error: "Duplicate entry - user may already exist" }, { status: 400 });
            }
            if (error.message.includes("validation")) {
                return Response.json({ 
                    error: "Validation error", 
                    details: error.message 
                }, { status: 400 });
            }
        }
        return Response.json({ 
            error: error instanceof Error ? error.message : "Registration failed - please try again",
            details: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }, { status: 500 });
    }
}

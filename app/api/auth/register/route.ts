import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import mongoose from "mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { handleBinaryAndIncome } from "@/lib/mlmEngine";
import { updateTeamCounts } from "@/lib/teamUtils";

export async function POST(req: NextRequest) {
  const dbSession = await mongoose.startSession();
  console.log('[DEBUG] register: DB session started');

  try {
    const session = await getServerSession(authOptions);

    console.log('[DEBUG] register: session', { sessionUser: session?.user?.username });

    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    //////////////////////////////////////////////////////////////
    // 🔹 TYPE SAFE INPUTS
    //////////////////////////////////////////////////////////////

    const username = (body.username || "").trim().toUpperCase();
    const fullName = body.fullName;
    const password = body.password;
    const mobileNo = body.mobileNo;
    const sponsorId = (body.sponsorId || "").trim().toUpperCase();
    const epin = body.epin;

    let placementPosition: "left" | "right" | undefined = body.placementPosition;

    if (!placementPosition || !["left", "right"].includes(placementPosition)) {
      return NextResponse.json(
        { success: false, message: "Please select a position (Left or Right)" },
        { status: 400 }
      );
    }

    console.log('[DEBUG] register: parsed body', { username, fullName, mobileNo, sponsorId, placementPosition, epin });

    //////////////////////////////////////////////////////////////
    // 🔹 VALIDATION
    //////////////////////////////////////////////////////////////

    if (
      !username ||
      !fullName ||
      !password ||
      !mobileNo ||
      !sponsorId ||
      !placementPosition ||
      !epin
    ) {
      console.log('[DEBUG] register: validation failed - missing fields', { username, fullName, mobileNo, sponsorId, placementPosition, epin });
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9]+$/.test(username)) {
      console.log('[DEBUG] register: validation failed - invalid username format', { username });
      return NextResponse.json(
        { success: false, message: "Invalid username format" },
        { status: 400 }
      );
    }

    await connectDB();
    console.log('[DEBUG] register: connected to DB');

    //////////////////////////////////////////////////////////////
    // 🔹 CHECK EXISTING USER
    //////////////////////////////////////////////////////////////

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('[DEBUG] register: username exists', { username });
      return NextResponse.json(
        { success: false, message: "Username already exists" },
        { status: 400 }
      );
    }

    //////////////////////////////////////////////////////////////
    // 🔹 GET LOGGED-IN USER
    //////////////////////////////////////////////////////////////

    const loggedInUser = await User.findOne({
      username: session.user.username,
    });

    if (!loggedInUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    console.log('[DEBUG] register: loggedInUser', { username: loggedInUser.username, userId: loggedInUser.userId, ePinsCount: Array.isArray(loggedInUser.ePins) ? loggedInUser.ePins.length : 0 });

    //////////////////////////////////////////////////////////////
    // 🔹 EPIN SAFE CHECK
    //////////////////////////////////////////////////////////////

    if (!Array.isArray(loggedInUser.ePins)) {
      console.log('[DEBUG] register: loggedInUser has no ePins array');
      return NextResponse.json(
        { success: false, message: "No EPINs available" },
        { status: 400 }
      );
    }

    const pinIndex = loggedInUser.ePins.findIndex(
      (p: any) => p.pin === epin && p.status === "Active"
    );

    console.log('[DEBUG] register: epin check', { epin, pinIndex, ePinsLength: loggedInUser.ePins.length });

    if (pinIndex === -1) {
      console.log('[DEBUG] register: invalid or used epin', { epin });
      return NextResponse.json(
        { success: false, message: "Invalid or used EPIN" },
        { status: 400 }
      );
    }

    //////////////////////////////////////////////////////////////
    // 🔹 SPONSOR CHECK
    //////////////////////////////////////////////////////////////

    const sponsor = await User.findOne({
      $or: [
        { userId: { $regex: new RegExp(`^${sponsorId}$`, 'i') } },
        { username: { $regex: new RegExp(`^${sponsorId}$`, 'i') } }
      ],
    });

    if (!sponsor) {
      console.log('[DEBUG] register: sponsor not found', { sponsorId });
      return NextResponse.json(
        { success: false, message: "Invalid sponsor ID" },
        { status: 400 }
      );
    }

    console.log('[DEBUG] register: sponsor found', { sponsorId: sponsor.userId || sponsor.username });

    const positionField =
      placementPosition === "left" ? "leftChild" : "rightChild";

    // Check if position is filled - but also verify if it's currently valid (not flushed out)
    const currentHour = new Date().getHours();
    const currentSessionType = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";
    
    // Check if session changed and would cause a flush
    let effectiveLeftCount = sponsor.totalTeam?.left || 0;
    let effectiveRightCount = sponsor.totalTeam?.right || 0;
    
    if (sponsor.lastSessionType && sponsor.lastSessionType !== currentSessionType) {
      if (effectiveLeftCount !== effectiveRightCount) {
        if (effectiveLeftCount > effectiveRightCount) effectiveLeftCount = effectiveRightCount;
        else effectiveRightCount = effectiveLeftCount;
      }
    }

    const sideValid = placementPosition === "left" ? effectiveLeftCount > 0 : effectiveRightCount > 0;

    if (sponsor[positionField]) {
      const childUserId = sponsor[positionField];
      console.log('[DEBUG] register: checking if child exists and is valid', { positionField, childUserId, sideValid });
      
      // If the side is flushed out (sideValid is false), we can overwrite it
      if (!sideValid) {
        console.log('[DEBUG] register: position flushed out, allowing overwrite', { positionField });
        sponsor.set(positionField, undefined);
      } else {
        // Verify the child user actually exists in database
        const childExists = await User.findOne({
          $or: [
            { userId: { $regex: new RegExp(`^${childUserId}$`, 'i') } },
            { username: { $regex: new RegExp(`^${childUserId}$`, 'i') } }
          ]
        });
        
        if (childExists) {
          console.log('[DEBUG] register: sponsor position already filled', { positionField, filledBy: childUserId });
          return NextResponse.json(
            { success: false, message: `${placementPosition} already filled` },
            { status: 400 }
          );
        } else {
          // Child reference exists but user doesn't - clear it
          console.log('[DEBUG] register: child reference exists but user deleted, clearing position', { positionField, childUserId });
          sponsor.set(positionField, undefined);
          await sponsor.save();
        }
      }
    }

    //////////////////////////////////////////////////////////////
    // 🔹 START TRANSACTION
    //////////////////////////////////////////////////////////////

    console.log('[DEBUG] register: starting DB transaction');
    dbSession.startTransaction();

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      userId: username,
      username,
      fullName,
      password: hashedPassword,
      mobileNo,

      sponsorId: sponsor.userId || sponsor.username,
      sponsorName: sponsor.fullName || sponsor.username,

      placementId: sponsor.userId || sponsor.username,
      placementName: sponsor.fullName || sponsor.username,
      placementPosition,

      registeredEPIN: epin,
      joiningDate: new Date(),

      leftChild: "",
      rightChild: "",

      totalTeam: { left: 0, right: 0 },

      basicIncome: 0,
      boosterMatchingIncome: 0,
      totalIncome: 0,

      isBooster: false,
      boosterCuts: [],
      basicPairs: 0,
    });

    //////////////////////////////////////////////////////////////
    // 🔹 SAVE USER
    //////////////////////////////////////////////////////////////

    await newUser.save({ session: dbSession });
    console.log('[DEBUG] register: newUser saved', { userId: newUser.userId, username: newUser.username });

    //////////////////////////////////////////////////////////////
    // 🔹 UPDATE SPONSOR (LEFT / RIGHT CHILD + TOTAL TEAM)
    //////////////////////////////////////////////////////////////

    sponsor[positionField] = newUser.username;
    
    // Recursive update for all ancestors - MUST PASS THE SESSION
    await updateTeamCounts(sponsor.userId || sponsor.username, placementPosition, 1, dbSession);
    
    await sponsor.save({ session: dbSession });
    console.log('[DEBUG] register: sponsor updated', { 
      sponsorId: sponsor.userId || sponsor.username, 
      positionField, 
      totalTeam: sponsor.totalTeam 
    });

    //////////////////////////////////////////////////////////////
    // 🔹 UPDATE LOGGED-IN USER
    //////////////////////////////////////////////////////////////

    // remove EPIN
    loggedInUser.ePins.splice(pinIndex, 1);

    // pins stats
    loggedInUser.usedPins = (loggedInUser.usedPins || 0) + 1;
    loggedInUser.activePins = Math.max(
      0,
      (loggedInUser.activePins || 0) - 1
    );

    // safe totalTeam
    if (!loggedInUser.totalTeam) {
      loggedInUser.totalTeam = { left: 0, right: 0 };
    }

    // Update team count for the placement position
    loggedInUser.totalTeam[placementPosition] = (loggedInUser.totalTeam[placementPosition] || 0) + 1;

    // Check if this completes a pair (both sides have at least 1)
    const leftCount = loggedInUser.totalTeam.left || 0;
    const rightCount = loggedInUser.totalTeam.right || 0;

    console.log('[REGISTER] Pair check:', { userId: loggedInUser.userId, leftCount, rightCount, position: placementPosition });

    if (leftCount > 0 && rightCount > 0) {
      // Pair completed - but only 1 pair per session allowed
      const now = new Date();
      const currentHour = now.getHours();
      const currentSessionType: "morning" | "evening" = currentHour >= 0 && currentHour < 12 ? "morning" : "evening";

      console.log('[REGISTER] Pair detected! Checking session:', { currentSessionType, currentHour });

      // Check if user already completed a pair this session
      const sessionBasedIncome = loggedInUser.sessionBasedIncome || [];
      const hasCompletedPairThisSession = sessionBasedIncome.some(
        (record: any) => record.sessionType === currentSessionType && record.status === "Completed"
      );

      console.log('[REGISTER] Session check:', { hasCompletedPairThisSession, sessionRecords: sessionBasedIncome.length });

      // Only allow 1 pair per session
      if (!hasCompletedPairThisSession) {
        const incomeAmount = 1000; // Only 1 pair = ₹1000
        
        // Count existing completed records and set basicPairs accordingly
        const completedRecords = loggedInUser.sessionBasedIncome?.filter(
          (r: any) => r.status === "Completed"
        ) || [];
        loggedInUser.basicPairs = completedRecords.length + 1;
        loggedInUser.lastSessionType = currentSessionType;
        loggedInUser.lastSessionDate = new Date();

        const sessionIncomeRecord = {
          date: new Date(),
          sessionType: currentSessionType,
          pairs: 1,
          netIncome: incomeAmount,
          status: "Completed" as const,
        };

        loggedInUser.sessionBasedIncome = loggedInUser.sessionBasedIncome || [];
        loggedInUser.sessionBasedIncome.push(sessionIncomeRecord);
        
        // IMPORTANT: Mark the array as modified so Mongoose pre-save hook detects the change
        loggedInUser.markModified('sessionBasedIncome');

        // Check for booster upgrade (10 pairs)
        if (loggedInUser.basicPairs >= 10) {
          loggedInUser.isBooster = true;
          loggedInUser.boosterAchievedAt = new Date();
          loggedInUser.basicRank = "booster";
        }

        console.log('[REGISTER] Pair completed and income added:', { session: currentSessionType, basicPairs: loggedInUser.basicPairs, income: incomeAmount });
      } else {
        console.log('[REGISTER] Pair already completed this session - only 1 pair per session allowed');
      }
    } else {
      console.log('[REGISTER] No pair yet - team count updated:', { left: leftCount, right: rightCount });
    }

    //////////////////////////////////////////////////////////////
    // 🔹 DIRECT MEMBERS SAFE ADD
    //////////////////////////////////////////////////////////////

    if (!Array.isArray(loggedInUser.directMembers)) {
      loggedInUser.directMembers = [];
    }

    const exists = loggedInUser.directMembers.some(
      (m: any) => m.memberId === (newUser.userId || newUser.username)
    );

    if (!exists) {
      loggedInUser.directMembers.push({
        memberId: newUser.userId || newUser.username,
        name: newUser.fullName || newUser.username,
        joinDate: new Date(),
        position: placementPosition,
      });
    }

    await loggedInUser.save({ session: dbSession });
    console.log('[DEBUG] register: loggedInUser updated', { userId: loggedInUser.userId || loggedInUser.username, usedPins: loggedInUser.usedPins, activePins: loggedInUser.activePins, totalTeam: loggedInUser.totalTeam });

    //////////////////////////////////////////////////////////////
    // 🔹 COMMIT
    //////////////////////////////////////////////////////////////

    await dbSession.commitTransaction();
    dbSession.endSession();
    console.log('[DEBUG] register: transaction committed');

    //////////////////////////////////////////////////////////////
    // 🔥 MLM ENGINE
    //////////////////////////////////////////////////////////////

    try {
      console.log('[DEBUG] register: calling MLM engine', { loggedInUserId: loggedInUser._id, placementPosition });
      await handleBinaryAndIncome(
        loggedInUser._id,
        placementPosition
      );
      console.log('[DEBUG] register: MLM engine completed');
    } catch (err) {
      console.error("MLM Engine Error:", err);
    }

    //////////////////////////////////////////////////////////////
    // ✅ RESPONSE
    //////////////////////////////////////////////////////////////

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        username: newUser.username,
        fullName: newUser.fullName,
      },
    });

  } catch (error: any) {
    console.error("❌ Registration Error:", error);

    try {
      await dbSession.abortTransaction();
      dbSession.endSession();
    } catch {}

    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/database";
import mongoose from "mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { updateTeamCounts } from "@/lib/teamUtils";
import { escapeRegex } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const dbSession = await mongoose.startSession();
  console.log('[DEBUG] register: DB session started');

  try {
    let session: any;
    if (process.env.NODE_ENV === "test" && (global as any).mockSession) {
      session = (global as any).mockSession;
    } else {
      session = await getServerSession(authOptions);
    }

    console.log('[DEBUG] register: session', { sessionUser: session?.user?.username });

    if (!session?.user?.username) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🔹 REGISTRATION FREEZE (12:00 - 12:10 AM/PM IST)
    const now = new Date();
    const istDate = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
    const istHour = istDate.getUTCHours();
    const istMin = istDate.getUTCMinutes();
    if ((istHour === 12 && istMin >= 0 && istMin < 10) || (istHour === 0 && istMin >= 0 && istMin < 10)) {
      return NextResponse.json(
        { success: false, message: "Registration is frozen during session transition (12:00 - 12:10). Please try again after 12:10." },
        { status: 403 }
      );
    }    const body = await req.json();

    //////////////////////////////////////////////////////////////
    // 🔹 GENERATE UNIQUE CREDENTIALS
    //////////////////////////////////////////////////////////////

    await connectDB();

    let username = "";
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      username = `CLM${randomDigits}`;
      const existing = await User.findOne({ username });
      if (!existing) isUnique = true;
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json({ success: false, message: "Could not generate a unique User ID. Please try again." }, { status: 500 });
    }

    const rawPassword = Math.floor(10000 + Math.random() * 90000).toString();
    const rawTransactionPassword = Math.floor(100000 + Math.random() * 900000).toString();

    //////////////////////////////////////////////////////////////
    // 🔹 TYPE SAFE INPUTS
    //////////////////////////////////////////////////////////////

    const fullName = body.fullName;
    const mobileNo = body.mobileNo;
    const sponsorId = escapeRegex((body.sponsorId || "").trim().toUpperCase());
    const uplineId = escapeRegex((body.uplineId || body.sponsorId || "").trim().toUpperCase());
    const epin = body.epin;
    const upiId = (body.upiId || "").trim();
    const pincode = (body.pincode || "").trim();
    const state = (body.state || "").trim();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

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

    if (!pincode) {
      return NextResponse.json(
        { success: false, message: "Pin Code is required" },
        { status: 400 }
      );
    }

    if (!state) {
      return NextResponse.json(
        { success: false, message: "State is required" },
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

    // 🔹 DUPLICATE ACCOUNT DETECTION REMOVED
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
    // 🔹 SPONSOR & UPLINE CHECK (PARALLEL & INDEXED LOOKUP)
    //////////////////////////////////////////////////////////////

    const fetchSponsor = async () => {
      let s = await User.findOne({ $or: [{ userId: sponsorId }, { username: sponsorId }] });
      if (!s) {
        s = await User.findOne({
          $or: [
            { userId: { $regex: new RegExp(`^${sponsorId}$`, 'i') } },
            { username: { $regex: new RegExp(`^${sponsorId}$`, 'i') } }
          ]
        });
      }
      return s;
    };

    const fetchUpline = async () => {
      let u = await User.findOne({ $or: [{ userId: uplineId }, { username: uplineId }] });
      if (!u) {
        u = await User.findOne({
          $or: [
            { userId: { $regex: new RegExp(`^${uplineId}$`, 'i') } },
            { username: { $regex: new RegExp(`^${uplineId}$`, 'i') } }
          ]
        });
      }
      return u;
    };

    const [sponsor, upline] = await Promise.all([fetchSponsor(), fetchUpline()]);

    if (!sponsor) {
      console.log('[DEBUG] register: sponsor not found', { sponsorId });
      return NextResponse.json(
        { success: false, message: "Invalid sponsor ID" },
        { status: 400 }
      );
    }

    if (!upline) {
      console.log('[DEBUG] register: upline not found', { uplineId });
      return NextResponse.json(
        { success: false, message: "Invalid Upline ID" },
        { status: 400 }
      );
    }

    const positionField =
      placementPosition === "left" ? "leftChild" : "rightChild";

    if (upline[positionField]) {
      const childUserId = upline[positionField];
      console.log('[DEBUG] register: checking if child exists under upline', { positionField, childUserId });

      let childExists = await User.findOne({
        $or: [{ userId: childUserId }, { username: childUserId }]
      });

      if (!childExists) {
        childExists = await User.findOne({
          $or: [
            { userId: { $regex: new RegExp(`^${childUserId}$`, 'i') } },
            { username: { $regex: new RegExp(`^${childUserId}$`, 'i') } }
          ]
        });
      }

      if (childExists) {
        console.log('[DEBUG] register: upline position already filled', { positionField, filledBy: childUserId });
        return NextResponse.json(
          { success: false, message: `${placementPosition} already filled under upline` },
          { status: 400 }
        );
      } else {
        console.log('[DEBUG] register: child reference exists under upline but user deleted, clearing position', { positionField, childUserId });
        upline.set(positionField, undefined);
        await upline.save();
      }
    }

    //////////////////////////////////////////////////////////////
    // 🔹 START TRANSACTION & PARALLEL PASSWORD HASHING
    //////////////////////////////////////////////////////////////

    console.log('[DEBUG] register: starting DB transaction & parallel password hashing');
    dbSession.startTransaction();

    // Fast parallel hashing (cost factor 10)
    const [hashedPassword, hashedTransactionPassword] = await Promise.all([
      bcrypt.hash(rawPassword, 10),
      bcrypt.hash(rawTransactionPassword, 10)
    ]);

    const newUser = new User({
      userId: username,
      username,
      fullName,
      password: hashedPassword,
      transactionPassword: hashedTransactionPassword,
      // Store plain-text credentials for admin visibility
      plainPassword: rawPassword,
      plainTransactionPassword: rawTransactionPassword,
      mobileNo,
      upiId: upiId || undefined,
      registrationIp: ip,
      registrationDevice: userAgent,
      email: body.email,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,
      panNo: body.panNo,
      state: body.state,
      district: body.district,
      city: body.city,
      address: body.address,
      pincode: body.pincode,
      nomineeName: body.nomineeName,
      nomineeRelation: body.nomineeRelation,
      bankName: body.bankName,
      branchName: body.branchName,
      accountNo: body.accountNo,
      ifsc: body.ifsc,
      accountType: body.accountType,
      registeredPackage: body.package,

      sponsorId: sponsor.userId || sponsor.username,
      sponsorName: sponsor.fullName || sponsor.username,

      placementId: upline.userId || upline.username,
      placementName: upline.fullName || upline.username,
      placementPosition,

      registeredEPIN: epin,
      joiningDate: (() => { const ist = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000); return ist.toISOString().split('T')[0]; })(), // 🔧 FIX: IST date (not UTC) — avoids wrong date for joins between 12AM-5:30AM IST

      leftChild: "",
      rightChild: "",

      totalTeam: { left: 0, right: 0 },
      sessionTeam: { left: 0, right: 0 }, // 🔧 FIX: Initialize sessionTeam to ensure proper session tracking

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
    // 🔹 UPDATE SPONSOR (CHILD + TOTAL DIRECTS)
    //////////////////////////////////////////////////////////////

    // Push to directMembers array and update totalDirect count
    // 1. Update upline child field
    await User.findByIdAndUpdate(upline._id, {
      $set: {
        [positionField]: newUser.username
      }
    }, { session: dbSession });

    // 2. Update sponsor direct count & direct members list
    await User.findByIdAndUpdate(sponsor._id, {
      $inc: { totalDirect: 1 },
      $push: {
        directMembers: {
          memberId: newUser.userId || newUser.username,
          name: newUser.fullName || newUser.username,
          joinDate: new Date(),
          position: placementPosition,
        }
      }
    }, { session: dbSession });

    // Recursive update for all ancestors starting from upline
    await updateTeamCounts(upline.userId || upline.username, placementPosition, 1, dbSession);

    console.log('[DEBUG] register: upline and sponsor updated', {
      uplineId: upline.userId || upline.username,
      sponsorId: sponsor.userId || sponsor.username,
      positionField
    });

    //////////////////////////////////////////////////////////////
    // 🔹 UPDATE LOGGED-IN USER (EPIN + PINS STATS)
    //////////////////////////////////////////////////////////////

    const upToDateLoggedInUser = await User.findOne({
      username: session.user.username,
    }).session(dbSession);

    if (!upToDateLoggedInUser) {
      throw new Error("LoggedIn user not found");
    }

    // remove EPIN
    if (Array.isArray(upToDateLoggedInUser.ePins)) {
      const uPinIndex = upToDateLoggedInUser.ePins.findIndex((p: any) => p.pin === epin && p.status === "Active");
      if (uPinIndex !== -1) {
        upToDateLoggedInUser.ePins.splice(uPinIndex, 1);
      }
    }

    // pins stats
    upToDateLoggedInUser.usedPins = (upToDateLoggedInUser.usedPins || 0) + 1;
    upToDateLoggedInUser.activePins = Math.max(
      0,
      (upToDateLoggedInUser.activePins || 0) - 1
    );

    // Update team count for the placement position 
    if (upline.username !== session.user.username) {
      if (!upToDateLoggedInUser.totalTeam) upToDateLoggedInUser.totalTeam = { left: 0, right: 0 };
      upToDateLoggedInUser.totalTeam[placementPosition] = (upToDateLoggedInUser.totalTeam[placementPosition] || 0) + 1;
      console.log('[REGISTER] Team count updated for logged-in user:', { left: upToDateLoggedInUser.totalTeam.left, right: upToDateLoggedInUser.totalTeam.right });
    }

    // Use findByIdAndUpdate to avoid VersionError
    await User.findByIdAndUpdate(upToDateLoggedInUser._id, {
      $set: {
        totalTeam: upToDateLoggedInUser.totalTeam,
        usedPins: upToDateLoggedInUser.usedPins,
        activePins: upToDateLoggedInUser.activePins,
        ePins: upToDateLoggedInUser.ePins
      }
    }, { session: dbSession });
    console.log('[DEBUG] register: loggedInUser updated', { userId: upToDateLoggedInUser.userId || upToDateLoggedInUser.username, usedPins: upToDateLoggedInUser.usedPins, activePins: upToDateLoggedInUser.activePins, totalTeam: upToDateLoggedInUser.totalTeam });

    //////////////////////////////////////////////////////////////
    // 🔹 COMMIT
    //////////////////////////////////////////////////////////////

    await dbSession.commitTransaction();
    dbSession.endSession();
    console.log('[DEBUG] register: transaction committed');

    //////////////////////////////////////////////////////////////
    // ✅ RESPONSE
    //////////////////////////////////////////////////////////////

    return NextResponse.json({
      success: true,
      message: "Registration successful",
      user: {
        username: newUser.username,
        fullName: newUser.fullName,
        password: rawPassword,
        transactionPassword: rawTransactionPassword,
      },
    });

  } catch (error: any) {
    console.error("❌ Registration Error:", error);

    try {
      await dbSession.abortTransaction();
      dbSession.endSession();
    } catch { }

    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
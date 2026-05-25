import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions, getServerSession } from "next-auth";
import User from "@/models/User";
import { connectDB } from "./database";
import { escapeRegex } from "./utils";
import { logActivity } from "./activityLogger";
import nodemailer from "nodemailer";
declare module "next-auth" {
  interface User {
    role?: string;
    username?: string;
    fullName?: string;
    mobileNo?: string;
    userId?: string;
    sponsorId?: string;
    placementId?: string;
    placementPosition?: 'left' | 'right';
    memberType?: string;
    registeredPackage?: string;
    isBlocked?: boolean;
    subAdminPermissions?: string[];
  }

  interface Session {
    user: {
      id?: string | null;
      email?: string | null;
      name?: string | null;
      username?: string | null;
      role?: string | null;
      fullName?: string | null;
      mobileNo?: string | null;
      userId?: string | null;
      sponsorId?: string | null;
      placementId?: string | null;
      placementPosition?: 'left' | 'right' | null;
      memberType?: string | null;
      registeredPackage?: string | null;
      isBlocked?: boolean;
      subAdminPermissions?: string[] | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    username?: string | null;
    role?: string | null;
    fullName?: string | null;
    mobileNo?: string | null;
    userId?: string | null;
    sponsorId?: string | null;
    placementId?: string | null;
    placementPosition?: 'left' | 'right' | null;
    memberType?: string | null;
    registeredPackage?: string | null;
    isBlocked?: boolean | null;
    subAdminPermissions?: string[] | null;
  }
}

async function send2FaEmail(toEmail: string, fullName: string, code: string): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || "587");
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SERVER_PASSWORD;
  const smtpFrom = process.env.SMTP_FROM || process.env.EMAIL_FROM || "no-reply@changelifemarketing.com";

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Change Life Marketing" <${smtpFrom}>`,
        to: toEmail,
        subject: "Your 2FA Verification Code - Change Life Marketing",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #0A6E5A; text-align: center;">Change Life Marketing</h2>
            <h3 style="color: #333; text-align: center;">Two-Factor Authentication</h3>
            <p>Hello ${fullName},</p>
            <p>You are attempting to sign in to the Administrative Panel. Please use the following 2FA verification code to complete your login:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0A6E5A; padding: 10px 20px; background-color: #f0fdf4; border: 2px dashed #0a6e5a; border-radius: 5px; display: inline-block;">${code}</span>
            </div>
            <p>This code is valid for 5 minutes. If you did not request this code, please secure your account immediately.</p>
          </div>
        `,
      });
      console.log(`📧 [2FA OTP] Email sent successfully to ${toEmail}`);
      return true;
    } catch (mailErr) {
      console.error("❌ Failed to send 2FA OTP email via SMTP:", mailErr);
      return false;
    }
  } else {
    console.warn("⚠️ SMTP credentials not configured. OTP for admin login:", code);
    return false;
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials, req) {
        const ip = (req?.headers?.["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req?.headers?.["x-real-ip"] || "unknown";
        const userAgent = req?.headers?.["user-agent"] || "unknown";

        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid username or password");
        }
        try {
          await connectDB();
          const cleanUsername = escapeRegex(credentials.username.trim());
          const user = await User.findOne({
            $or: [
              { username: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } },
              { userId: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } },
              { email: { $regex: new RegExp(`^${cleanUsername}$`, 'i') } },
            ],
          }).select("+password");
          
          console.log("Login attempt for:", credentials.username);
          console.log("User found:", user ? user.username : "No user found");
          
          if (!user) {
            throw new Error("Invalid username or password");
          }

          const isAdminOrSubAdmin = user.role === 'admin' || user.role === 'sub-admin';

          const now = new Date();
          if (!isAdminOrSubAdmin && user.lockUntil) {
            if (user.lockUntil > now) {
              throw new Error("Try after 10 minutes");
            } else {
              user.loginAttempts = 0;
              user.lockUntil = undefined;
            }
          }
          
          const isPasswordValid = await user.comparePassword(credentials.password.trim());
          console.log("Is password valid?", isPasswordValid);
          
          if (!isPasswordValid) {
            if (isAdminOrSubAdmin) {
              await logActivity(user._id.toString(), user.username, "Login Failed", ip, userAgent, `Incorrect password entered for admin/sub-admin account`);
              throw new Error("Invalid username or password");
            }

            const newAttempts = (user.loginAttempts || 0) + 1;
            await logActivity(user._id.toString(), user.username, "Login Failed", ip, userAgent, `Incorrect password entered (Attempt ${newAttempts}/3)`);
            if (newAttempts >= 3) {
              const lockUntil = new Date(Date.now() + 10 * 60 * 1000);
              await User.updateOne(
                { _id: user._id },
                { $set: { loginAttempts: 0, lockUntil: lockUntil } }
              );
              throw new Error("Try after 10 minutes");
            } else {
              await User.updateOne(
                { _id: user._id },
                { $set: { loginAttempts: newAttempts, lockUntil: null } }
              );
              throw new Error("Invalid username or password");
            }
          }

          // If admin or sub-admin, enforce 2FA
          if (isAdminOrSubAdmin) {
            if (!credentials.otp?.trim()) {
              const code = Math.floor(100000 + Math.random() * 900000).toString();
              const twoFactorOtpExpires = new Date(Date.now() + 5 * 60 * 1000);
              await User.updateOne(
                { _id: user._id },
                { $set: { twoFactorOtp: code, twoFactorOtpExpires } }
              );
              const emailSent = await send2FaEmail(user.email || "", user.fullName || user.username, code);
              await logActivity(user._id.toString(), user.username, "2FA OTP Sent", ip, userAgent, `2FA verification code sent to ${user.role}'s email`);
              // If SMTP is not configured on this environment, embed the code in the error
              // so the login page can display it directly to the admin
              if (!emailSent) {
                throw new Error(`2FA_REQUIRED:${code}`);
              }
              throw new Error("2FA_REQUIRED");
            } else {
              if (
                !user.twoFactorOtp || 
                user.twoFactorOtp !== credentials.otp.trim() || 
                !user.twoFactorOtpExpires || 
                user.twoFactorOtpExpires < new Date()
              ) {
                await logActivity(user._id.toString(), user.username, "2FA Failed", ip, userAgent, "Invalid or expired OTP entered");
                throw new Error("Invalid or expired 2FA code.");
              }
              // Clear OTP
              await User.updateOne(
                { _id: user._id },
                { $unset: { twoFactorOtp: "", twoFactorOtpExpires: "" } }
              );
            }
          }

          if ((user.loginAttempts && user.loginAttempts > 0) || user.lockUntil) {
            await User.updateOne(
              { _id: user._id },
              { $set: { loginAttempts: 0, lockUntil: null } }
            );
          }

          const loginAction = isAdminOrSubAdmin ? `Login (${user.role === 'admin' ? 'Admin' : 'Sub-Admin'})` : "Login";
          const loginDetails = isAdminOrSubAdmin ? `Successful ${user.role} login with 2FA` : "Successful user login";
          await logActivity(user._id.toString(), user.username, loginAction, ip, userAgent, loginDetails);

          return {
            id: user._id.toString(),
            email: user.email ?? undefined,
            name: user.fullName ?? user.username,
            username: user.username,
            role: user.role || "user",
            fullName: user.fullName ?? undefined,
            mobileNo: user.mobileNo ?? undefined,
            userId: user.userId ?? undefined,
            sponsorId: user.sponsorId ?? undefined,
            placementId: user.placementId ?? undefined,
            placementPosition: user.placementPosition ?? undefined,
            memberType: user.memberType ?? undefined,
            registeredPackage: user.registeredPackage ?? undefined,
            isBlocked: user.isBlocked || false,
            subAdminPermissions: user.subAdminPermissions || [],
          } as any;

        } catch (error: any) {
          console.error("❌ AUTH ERROR:", error.message);
          throw new Error(error.message || "Authorization failed");
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id || null;
        token.email = user.email || null;
        token.name = user.name || null;
        token.username = user.username || null;
        token.userId = user.userId || null;
        token.role = user.role || "user";
        token.fullName = user.fullName || null;
        token.mobileNo = user.mobileNo || null;
        token.sponsorId = user.sponsorId || null;
        token.placementId = user.placementId || null;
        token.placementPosition = user.placementPosition || null;
        token.memberType = user.memberType || null;
        token.registeredPackage = user.registeredPackage || null;
        token.isBlocked = (user as any).isBlocked || false;
        token.subAdminPermissions = (user as any).subAdminPermissions || null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id || null;
        session.user.email = token.email || null;
        session.user.name = token.name || null;
        session.user.username = token.username || null;
        session.user.userId = token.userId || null;
        session.user.role = token.role || null;
        session.user.fullName = token.fullName || null;
        session.user.mobileNo = token.mobileNo || null;
        session.user.sponsorId = token.sponsorId || null;
        session.user.placementId = token.placementId || null;
        session.user.placementPosition = token.placementPosition || null;
        session.user.memberType = token.memberType || null;
        session.user.registeredPackage = token.registeredPackage || null;
        session.user.isBlocked = !!token.isBlocked;
        session.user.subAdminPermissions = token.subAdminPermissions || null;
      }

      return session;
    },
  },
};

export async function verifyAdminPermission(permission?: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { authorized: false, status: 401, message: "Unauthorized: Please log in." };
  }
  const role = session.user.role;
  if (role === 'admin') {
    return { authorized: true, session };
  }
  if (role === 'sub-admin') {
    if (!permission) {
      return { authorized: true, session }; // general sub-admin layout check
    }
    const permissions = (session.user as any).subAdminPermissions || [];
    if (permissions.includes(permission)) {
      return { authorized: true, session };
    }
    return { authorized: false, status: 403, message: "Forbidden: Insufficient permissions." };
  }
  return { authorized: false, status: 403, message: "Forbidden: Access denied." };
}
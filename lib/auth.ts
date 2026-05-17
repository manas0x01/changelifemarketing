import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import User from "@/models/User";
import { connectDB } from "./database";
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
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Invalid username or password");
        }
        try {
          await connectDB();
          const user = await User.findOne({
            $or: [
              { username: { $regex: new RegExp(`^${credentials.username}$`, 'i') } },
              { userId: { $regex: new RegExp(`^${credentials.username}$`, 'i') } },
              { email: { $regex: new RegExp(`^${credentials.username}$`, 'i') } },
            ],
          }).select("+password");
          if (!user || !(await user.comparePassword(credentials.password))) {
            throw new Error("Invalid username or password");
          }
          if (user.isBlocked) {
            throw new Error("Your account has been blocked by the Administrator.");
          }
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
      }

      return session;
    },
  },
};
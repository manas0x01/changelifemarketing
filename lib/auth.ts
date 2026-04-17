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
          throw new Error("Invalid credentials");
        }

        try {
          await connectDB();
          const user = await User.findOne({ username: credentials.username }).select("+password");
          if (!user) {
            throw new Error("User not found");
          }
          const isPasswordValid = await user.comparePassword(credentials.password);
          if (!isPasswordValid) {

            throw new Error("Invalid password");
          }

          const userData = {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName || user.username,
            username: user.username,
            role: user.role,
            fullName: user.fullName,
            mobileNo: user.mobileNo,
            userId: user.userId,
            sponsorId: user.sponsorId,
            placementId: user.placementId,
            placementPosition: user.placementPosition,
            memberType: user.memberType,
            registeredPackage: user.registeredPackage,
          };
          return userData;
        } catch (error) {
          throw new Error("Authorization failed");
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {

      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;  // ⭐ CRITICAL: Username MUST come from user
        token.userId = user.userId;      // ⭐ CRITICAL: UserId MUST come from user
        token.role = user.role;
        token.fullName = user.fullName;
        token.mobileNo = user.mobileNo;
        token.sponsorId = user.sponsorId;
        token.placementId = user.placementId;
        token.placementPosition = user.placementPosition;
        token.memberType = user.memberType;
        token.registeredPackage = user.registeredPackage;
      }
      token.role = (user && (user.role as any)) || token.role || null;
      return token;
    },
    async session({ session, token }) {
      if (session && session.user) {
        (session.user as any).id = token.id || null;
        (session.user as any).email = token.email || null;
        (session.user as any).name = token.name || null;
        (session.user as any).username = token.username || null;  // ⭐ CRITICAL: Username must be set
        (session.user as any).userId = token.userId || null;      // ⭐ CRITICAL: UserId must be set  
        (session.user as any).role = token.role || null; 
        (session.user as any).fullName = token.fullName || null;
        (session.user as any).mobileNo = token.mobileNo || null;
        (session.user as any).sponsorId = token.sponsorId || null;
        (session.user as any).placementId = token.placementId || null;
        (session.user as any).placementPosition = token.placementPosition || null;
        (session.user as any).memberType = token.memberType || null;
        (session.user as any).registeredPackage = token.registeredPackage || null;
      }
      
      return session;
    },
  },
};

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

          return {
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
      console.log('🔐 [JWT] JWT callback - user:', user?.username);
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.username = user.username;
        token.role = user.role;
        token.fullName = user.fullName;
        token.mobileNo = user.mobileNo;
        token.userId = user.userId;
        token.sponsorId = user.sponsorId;
        token.placementId = user.placementId;
        token.placementPosition = user.placementPosition;
        token.memberType = user.memberType;
        token.registeredPackage = user.registeredPackage;
        console.log('🔐 [JWT] Token updated:', token.username);
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔐 [SESSION] Session callback - token.username:', token.username);
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.fullName = token.fullName as string;
        session.user.mobileNo = token.mobileNo as string;
        session.user.userId = token.userId as string;
        session.user.sponsorId = token.sponsorId as string;
        session.user.placementId = token.placementId as string;
        session.user.placementPosition = token.placementPosition as 'left' | 'right';
        session.user.memberType = token.memberType as string;
        session.user.registeredPackage = token.registeredPackage as string;
        console.log('🔐 [SESSION] Session user updated:', session.user.username);
      }
      return session;
    },
  },
};

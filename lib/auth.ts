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
        console.log('🔐 [AUTHORIZE] Starting - Username:', credentials?.username);
        
        if (!credentials?.username || !credentials?.password) {
          console.log('❌ [AUTHORIZE] Missing credentials - username:', !!credentials?.username, '| password:', !!credentials?.password);
          throw new Error("Invalid credentials");
        }

        try {
          console.log('🔗 [AUTHORIZE] Connecting to database...');
          await connectDB();
          console.log('✅ [AUTHORIZE] Database connected');

          console.log('🔍 [AUTHORIZE] Searching for user:', credentials.username);
          const user = await User.findOne({ username: credentials.username }).select("+password");
          console.log('📊 [AUTHORIZE] User found:', !!user, user ? `ID: ${user._id}` : 'null');

          if (!user) {
            console.log('❌ [AUTHORIZE] User not found in database');
            throw new Error("User not found");
          }

          console.log('🔑 [AUTHORIZE] Verifying password...');
          const isPasswordValid = await user.comparePassword(credentials.password);
          console.log('✅ [AUTHORIZE] Password valid:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ [AUTHORIZE] Invalid password for user:', credentials.username);
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
          
          console.log('✅ [AUTHORIZE] Authorization successful - User data prepared:', {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            userId: userData.userId,
          });
          
          return userData;
        } catch (error) {
          console.log('❌ [AUTHORIZE] Error:', (error as Error).message);
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
      console.log('🔐 [JWT] JWT callback triggered');
      console.log('  👤 User object:', user ? `${user.username || user.email} (ID: ${user.id})` : 'undefined');
      console.log('  🎫 Token state:', `username: ${token.username}, userId: ${token.userId}`);
      
      if (user) {
        console.log('🔐 [JWT] 📝 Setting token values from user object (LOGIN)...');
        // ⭐ Set username from user object (during login)
        token.id = user.id;
        console.log('  ✓ token.id =', token.id);
        
        token.email = user.email;
        console.log('  ✓ token.email =', token.email);
        
        token.name = user.name;
        console.log('  ✓ token.name =', token.name);
        
        token.username = user.username;  // ⭐ CRITICAL: Username MUST come from user
        console.log('  ✓ token.username =', token.username);
        
        token.userId = user.userId;      // ⭐ CRITICAL: UserId MUST come from user
        console.log('  ✓ token.userId =', token.userId);
        
        token.role = user.role;
        console.log('  ✓ token.role =', token.role);
        
        token.fullName = user.fullName;
        console.log('  ✓ token.fullName =', token.fullName);
        
        token.mobileNo = user.mobileNo;
        console.log('  ✓ token.mobileNo =', token.mobileNo);
        
        token.sponsorId = user.sponsorId;
        console.log('  ✓ token.sponsorId =', token.sponsorId);
        
        token.placementId = user.placementId;
        console.log('  ✓ token.placementId =', token.placementId);
        
        token.placementPosition = user.placementPosition;
        console.log('  ✓ token.placementPosition =', token.placementPosition);
        
        token.memberType = user.memberType;
        console.log('  ✓ token.memberType =', token.memberType);
        
        token.registeredPackage = user.registeredPackage;
        console.log('  ✓ token.registeredPackage =', token.registeredPackage);
        
        console.log('🔐 [JWT] ✅ Token created during LOGIN with username:', token.username, '| userId:', token.userId);
      } else {
        // Token refresh - keep existing values
        console.log('🔐 [JWT] 🔄 TOKEN REFRESH (no user object) - keeping existing values');
        console.log('  ℹ️ Existing username:', token.username);
        console.log('  ℹ️ Existing userId:', token.userId);
        console.log('  ℹ️ Existing email:', token.email);
      }
      // Ensure role is preserved or set from the user object on login
      token.role = (user && (user.role as any)) || token.role || null;

      console.log('🔐 [JWT] 📤 Returning token:', { username: token.username, userId: token.userId, email: token.email, role: token.role });
      return token;
    },
    async session({ session, token }) {
      console.log('🔐 [SESSION] Session callback triggered');
      console.log('  🎫 Token received:', { username: token?.username, userId: token?.userId, email: token?.email });
      console.log('  📋 Session object exists:', !!session, '| session.user exists:', !!session?.user);
      
      if (session && session.user) {
        console.log('🔐 [SESSION] 📝 Mapping token properties to session.user...');
        
        // Ensure all properties are set directly on user object
        (session.user as any).id = token.id || null;
        console.log('  ✓ session.user.id =', (session.user as any).id);
        
        (session.user as any).email = token.email || null;
        console.log('  ✓ session.user.email =', (session.user as any).email);
        
        (session.user as any).name = token.name || null;
        console.log('  ✓ session.user.name =', (session.user as any).name);
        
        (session.user as any).username = token.username || null;  // ⭐ CRITICAL: Username must be set
        console.log('  ✓ session.user.username =', (session.user as any).username);
        
        (session.user as any).userId = token.userId || null;      // ⭐ CRITICAL: UserId must be set
        console.log('  ✓ session.user.userId =', (session.user as any).userId);
        
        (session.user as any).role = token.role || null;
        console.log('  ✓ session.user.role =', (session.user as any).role);
        
        (session.user as any).fullName = token.fullName || null;
        console.log('  ✓ session.user.fullName =', (session.user as any).fullName);
        
        (session.user as any).mobileNo = token.mobileNo || null;
        console.log('  ✓ session.user.mobileNo =', (session.user as any).mobileNo);
        
        (session.user as any).sponsorId = token.sponsorId || null;
        console.log('  ✓ session.user.sponsorId =', (session.user as any).sponsorId);
        
        (session.user as any).placementId = token.placementId || null;
        console.log('  ✓ session.user.placementId =', (session.user as any).placementId);
        
        (session.user as any).placementPosition = token.placementPosition || null;
        console.log('  ✓ session.user.placementPosition =', (session.user as any).placementPosition);
        
        (session.user as any).memberType = token.memberType || null;
        console.log('  ✓ session.user.memberType =', (session.user as any).memberType);
        
        (session.user as any).registeredPackage = token.registeredPackage || null;
        console.log('  ✓ session.user.registeredPackage =', (session.user as any).registeredPackage);
        
        console.log('🔐 [SESSION] ✅ All session user properties set successfully:', {
          username: (session.user as any).username,
          userId: (session.user as any).userId,
          email: (session.user as any).email,
          name: (session.user as any).name,
          role: (session.user as any).role,
        });
      } else {
        console.log('⚠️ [SESSION] Warning: session or session.user is missing!');
        console.log('  session exists:', !!session);
        console.log('  session.user exists:', !!session?.user);
      }
      
      console.log('🔐 [SESSION] 📤 Returning session object with user:', {
        username: (session?.user as any)?.username,
        userId: (session?.user as any)?.userId,
        email: session?.user?.email,
        role: (session?.user as any)?.role,
      });
      
      return session;
    },
  },
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);
  
  console.log('🔍 [ADMIN-LAYOUT] Session check:', { 
    hasSession: !!session, 
    username: session?.user?.username,
    role: session?.user?.role,
    email: session?.user?.email 
  });

  // First check: must have a session with username
  if (!session?.user?.username) {
    console.log('❌ [ADMIN-LAYOUT] No session or username');
    redirect("/auth/login");
  }

  // Second check: check role from session first (fastest)
  if (session.user?.role !== "admin") {
    console.log('❌ [ADMIN-LAYOUT] Not admin - Session role:', session.user?.role);
    redirect("/dashboard");
  }

  // If we get here, role is already verified from session
  console.log('✅ [ADMIN-LAYOUT] Admin access granted for:', session.user.username, '| Role from session:', session.user.role);

  return <>{children}</>;
}

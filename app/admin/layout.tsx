import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/database";
import { redirect } from "next/navigation";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  await connectDB();
  
  // Look up user by username (primary identifier) since email might be empty
  const userIdentifier = session.user?.username || session.user?.email;
  console.log('🔍 [ADMIN-LAYOUT] Looking up user by identifier:', userIdentifier);
  
  const user = await User.findOne({
    $or: [
      { username: userIdentifier },
      { email: userIdentifier }
    ]
  });

  console.log('👤 [ADMIN-LAYOUT] Found User:', user?.username, '| Role:', user?.role);

  if (!user || user.role !== "admin") {
    console.log('❌ [ADMIN-LAYOUT] Access denied - Not admin or user not found');
    redirect("/dashboard");
  }
  
  console.log('✅ [ADMIN-LAYOUT] Admin access granted for:', user.username);

  return <>{children}</>;
}

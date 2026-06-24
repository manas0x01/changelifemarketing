"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const routePermissions: Record<string, string> = {
  "/clm-portal/dashboard/achievers": "achievers",
  "/clm-portal/dashboard/createepin": "createepin",
  "/clm-portal/dashboard/pinrequests": "pinrequests",
  "/clm-portal/dashboard/pintransfers": "pintransfers",
  "/clm-portal/dashboard/orders": "orders",
  "/clm-portal/dashboard/users": "users",
  "/clm-portal/dashboard/bank-approvals": "bank-approvals",
  "/clm-portal/dashboard/withdrawrequests": "withdrawrequests",
  "/clm-portal/dashboard/daily-payouts": "withdrawrequests",
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isSubAdmin = session?.user?.role === "sub-admin";
  const permissions = (session?.user as any)?.subAdminPermissions || [];

  // Determine if the current page has a required permission
  let isAuthorized = true;
  
  if (isSubAdmin) {
    // If the path matches one of the known protected dashboard sub-paths
    // check if the sub-admin has permission for it.
    for (const route in routePermissions) {
      if (pathname.startsWith(route)) {
        const requiredPermission = routePermissions[route];
        if (!permissions.includes(requiredPermission)) {
          isAuthorized = false;
          break;
        }
      }
    }

    // Also protect the main dashboard overview page itself if they don't have dashboard permission
    if (pathname === "/clm-portal/dashboard") {
      if (!permissions.includes("dashboard")) {
        isAuthorized = false;
      }
    }
  }

  return (
    <div className="h-screen bg-[#F8F8F8]">
      <AdminSidebar />
      <main className="h-screen overflow-y-auto lg:ml-60">
        {status === "loading" ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#0A6E5A]"></div>
          </div>
        ) : !isAuthorized ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-white rounded shadow-sm max-w-lg mx-auto my-16 border border-red-100 animate-fadeIn">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="font-['Fraunces'] text-[1.5rem] text-[#0A6E5A] mb-3">Access Denied</h2>
            <p className="font-['Roboto'] text-[0.95rem] text-[#333333]/70 mb-8 max-w-sm">
              You do not have administrative permission to view the <span className="font-bold text-[#0A6E5A]">{pathname.split("/").pop()}</span> section. Please contact the administrator.
            </p>
            <Link
              href="/clm-portal/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A6E5A] text-white font-['Roboto'] text-[0.875rem] font-semibold rounded shadow hover:bg-[#0A6E5A]/90 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

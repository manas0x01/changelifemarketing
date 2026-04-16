"use client";

import AdminSidebar from "@/components/AdminSidebar";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="h-screen bg-[#F8F8F8]">
      <AdminSidebar />
      <main className="h-screen overflow-y-auto lg:ml-60">
        {children}
      </main>
    </div>
  );
}

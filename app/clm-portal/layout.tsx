import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  if (session && session.user?.role !== 'admin' && session.user?.role !== 'sub-admin') {
    redirect('/dashboard');
  }

  // IP Restriction check
  const allowedIpsStr = process.env.ALLOWED_ADMIN_IPS;
  if (allowedIpsStr) {
    const headerList = await headers();
    const ip = (headerList.get("x-forwarded-for") as string)?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
    const allowedIps = allowedIpsStr.split(",").map(item => item.trim());
    if (!allowedIps.includes(ip)) {
      console.warn(`Blocked access to admin panel from unauthorized IP: ${ip}`);
      redirect('/');
    }
  }

  return <>{children}</>;
}

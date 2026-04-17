import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);


  if (!session) {
    redirect('/auth/login');
  }

  if (session && session.user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}

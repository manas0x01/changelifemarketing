"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { LoadingProvider } from "@/context/LoadingContext";
import { UserProvider } from "@/context/UserContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LoadingProvider>
        <UserProvider>
          <Toaster />
          {children}
        </UserProvider>
      </LoadingProvider>
    </SessionProvider>
  );
}

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

interface UserData {
  username: string;
  fullName: string;
}

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const isLoading = status === "loading";

  // Populate userData directly from the next-auth session JWT
  // — no API call needed, the token already has fullName & username
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const username = session.user.username || session.user.name || "";
      const fullName = session.user.fullName || session.user.name || "";

      // Only update state if values actually changed
      setUserData((prev) => {
        if (prev?.username === username && prev?.fullName === fullName) {
          return prev;
        }
        return { username, fullName };
      });
    } else if (status === "unauthenticated") {
      setUserData(null);
    }
  }, [session, status]);

  // refetchUser kept for API compatibility — re-reads session
  const refetchUser = useCallback(async () => {
    if (session?.user) {
      setUserData({
        username: session.user.username || session.user.name || "",
        fullName: session.user.fullName || session.user.name || "",
      });
    }
  }, [session]);

  const value: UserContextType = {
    userData,
    isLoading,
    refetchUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}

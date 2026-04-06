"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchUserData = useCallback(async (force = false) => {
    // If already fetched and not forcing refresh, skip
    if (hasFetched && !force) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/user/update-profile", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.data) {
          setUserData({
            username: data.data.username,
            fullName: data.data.fullName,
          });
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, [hasFetched]);

  // Fetch user data only once on mount
  useEffect(() => {
    if (!hasFetched) {
      fetchUserData();
    }
  }, [hasFetched, fetchUserData]);

  const refetchUser = useCallback(async () => {
    await fetchUserData(true);
  }, [fetchUserData]);

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

"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface LoadingContextType {
  isPageLoading: boolean;
  setPageLoading: (loading: boolean) => void;
  startPageLoad: () => void;
  endPageLoad: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isPageLoading, setIsPageLoading] = useState(false);

  const startPageLoad = useCallback(() => {
    setIsPageLoading(true);
  }, []);

  const endPageLoad = useCallback(() => {
    setIsPageLoading(false);
  }, []);

  const setPageLoading = useCallback((loading: boolean) => {
    setIsPageLoading(loading);
  }, []);

  const value: LoadingContextType = {
    isPageLoading,
    setPageLoading,
    startPageLoad,
    endPageLoad,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function usePageLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("usePageLoading must be used within LoadingProvider");
  }
  return context;
}

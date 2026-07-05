"use client";

import React from "react";
import { ThemeProvider } from "@/context/ThemeContext";
import { AppProvider } from "@/context/AppContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppProvider>{children}</AppProvider>
    </ThemeProvider>
  );
}

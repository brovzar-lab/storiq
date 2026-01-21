"use client";

import { AIProvider } from "@/lib/ai/context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <AIProvider>{children}</AIProvider>;
}

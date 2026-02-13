"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

type ConvexClientProviderProps = {
  children: ReactNode;
};

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex =
  convexUrl && convexUrl.trim().length > 0
    ? new ConvexReactClient(convexUrl)
    : null;

export default function ConvexClientProvider({
  children,
}: ConvexClientProviderProps) {
  if (!convex) {
    return <>{children}</>;
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

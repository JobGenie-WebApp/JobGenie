"use client";

import { cn } from "@/lib/utils";

export function AuthCardAnimator({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

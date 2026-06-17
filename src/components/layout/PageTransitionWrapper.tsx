"use client";

import { usePathname } from "next/navigation";

/**
 * Route segment wrapper (keyed remount on navigation).
 * No overflow on this node: parent flex columns are not viewport-height–locked, so
 * `overflow-auto` would size to content and trap scroll (no inner overflow, no document scroll).
 * Window scroll + `sticky top-0` headers behave correctly this way.
 */
export function PageTransitionWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="min-h-0 w-full min-w-0 flex-1">
      {children}
    </div>
  );
}

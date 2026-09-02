import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The actual Admin Control mark — theme-swapped via CSS (`dark:` variant)
 * rather than JS, so it never flashes the wrong variant on first paint and
 * works identically whether `.dark` sits on <html> (theme toggle) or on a
 * local wrapper (forced-dark auth pages).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <>
      <Image
        src="/logo-mark-light.png"
        alt=""
        aria-hidden="true"
        width={342}
        height={294}
        className={cn("dark:hidden", className)}
      />
      <Image
        src="/logo-mark-dark.png"
        alt=""
        aria-hidden="true"
        width={347}
        height={303}
        className={cn("hidden dark:block", className)}
      />
    </>
  );
}

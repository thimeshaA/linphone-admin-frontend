import { Logo } from "./logo";

export function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <Logo className="h-8 w-auto shrink-0" />
      <span>
        <span className="block text-sm tracking-tight text-foreground">
          <span className="font-bold">Admin</span>{" "}
          <span className="font-normal">Control</span>
        </span>
        <span className="block font-mono text-[10px] tracking-[0.18em] text-foreground/45 uppercase">
          Operations
        </span>
      </span>
    </div>
  );
}

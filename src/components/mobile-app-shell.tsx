import type { ReactNode } from "react";

const PHONE_W = 390;
const PHONE_MIN_H = 844;

type MobileAppShellProps = {
  children: ReactNode;
};

export function MobileAppShell({ children }: MobileAppShellProps) {
  return (
    <div
      className="min-h-dvh bg-[#E8ECF2] flex justify-center items-stretch py-4 px-3 sm:py-8"
      style={{ minHeight: "100dvh" }}
    >
      <div
        className="flex w-full flex-col overflow-hidden rounded-[2.75rem] border border-black/[0.06] bg-white shadow-[0_16px_56px_rgba(15,23,42,0.12)]"
        style={{
          maxWidth: PHONE_W,
          minHeight: PHONE_MIN_H,
        }}
      >
        {children}
      </div>
    </div>
  );
}

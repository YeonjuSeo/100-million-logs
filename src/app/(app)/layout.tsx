import type { ReactNode } from "react";

import { BottomTabBar } from "@/components/bottom-tab-bar";
import { MobileAppShell } from "@/components/mobile-app-shell";

export default function AppSectionLayout({ children }: { children: ReactNode }) {
  return (
    <MobileAppShell>
      <div className="flex min-h-0 min-h-[780px] flex-1 flex-col">
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-2">
          {children}
        </div>
        <BottomTabBar />
      </div>
    </MobileAppShell>
  );
}

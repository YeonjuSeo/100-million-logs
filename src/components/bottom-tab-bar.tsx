"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Target, User, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/assets", label: "자산", Icon: Wallet },
  { href: "/ledger", label: "가계부", Icon: BookOpen },
  { href: "/goal", label: "목표", Icon: Target },
  { href: "/profile", label: "MY", Icon: User },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="border-t border-[#E5E8EB] bg-white/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
      aria-label="주요 메뉴"
    >
      <ul className="flex items-stretch justify-between gap-1">
        {tabs.map(({ href, label, Icon }) => {
          const on =
            pathname === href ||
            (href === "/assets" && pathname === "/");

          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                  on
                    ? "text-[#3182F6]"
                    : "text-[#8B95A1] hover:text-[#4E5968]"
                )}
              >
                <Icon
                  className={cn("size-6", on ? "stroke-[2.5px]" : "stroke-[2px]")}
                  aria-hidden
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

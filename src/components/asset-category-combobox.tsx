"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AssetCategory } from "@/types/sheets-model";

type AssetCategoryComboboxProps = {
  categories: AssetCategory[];
  valueId: string;
  onValueIdChange: (id: string) => void;
  onEnsureNewCategory: (name: string) => Promise<string>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function AssetCategoryCombobox({
  categories,
  valueId,
  onValueIdChange,
  onEnsureNewCategory,
  disabled,
  placeholder = "\uBD84\uB958 \uC120\uD0DD \uB610\uB294 \uC785\uB825",
  className,
}: AssetCategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const labelForId = useMemo(() => {
    const c = categories.find((x) => x.id === valueId);
    return c?.name ?? "";
  }, [categories, valueId]);

  useEffect(() => {
    setQuery(labelForId);
  }, [labelForId, valueId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, query]);

  const exactMatch = useMemo(
    () =>
      categories.find(
        (c) => c.name.trim().toLowerCase() === query.trim().toLowerCase()
      ),
    [categories, query]
  );

  function selectCategory(c: AssetCategory) {
    onValueIdChange(c.id);
    setQuery(c.name);
    setOpen(false);
  }

  async function handleAddNew() {
    const name = query.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const id = await onEnsureNewCategory(name);
      onValueIdChange(id);
      setQuery(name);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative w-full", className)}>
        <PopoverAnchor asChild>
          <Input
            value={query}
            disabled={disabled}
            placeholder={placeholder}
            className="rounded-xl border-[#E5E8EB] bg-white"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (exactMatch) selectCategory(exactMatch);
                else if (query.trim()) void handleAddNew();
              }
            }}
          />
        </PopoverAnchor>
      </div>
      <PopoverContent
        align="start"
        className="max-h-[min(70vh,420px)] w-[min(calc(100vw-2.5rem),22rem)] overflow-y-auto p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="mb-2 space-y-1">
          {filtered.length === 0 && (
            <p className="text-xs text-[#8B95A1]">
              {"\uC77C\uCE58\uD558\uB294 \uBD84\uB958\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
            </p>
          )}
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[#F2F4F6]"
              onClick={() => selectCategory(c)}
            >
              <span
                className="mr-2 inline-block size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: c.color }}
              />
              {c.name}
            </button>
          ))}
        </div>
        {query.trim() && !exactMatch && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mb-3 w-full rounded-lg"
            disabled={busy || disabled}
            onClick={() => void handleAddNew()}
          >
            {busy
              ? "..."
              : `\u201C${query.trim()}\u201D \uBD84\uB958 \uCD94\uAC00`}
          </Button>
        )}
        <div className="border-t border-[#EEF1F4] pt-2">
          <p className="mb-2 text-[10px] font-medium text-[#8B95A1]">
            {"\uC804\uCCB4 \uBD84\uB958"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#E5E8EB] bg-[#F9FAFB] px-2.5 py-1 text-xs font-medium text-[#4E5968]"
                onClick={() => selectCategory(c)}
              >
                <span
                  className="inline-block size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { AssetCategoryCombobox } from "@/components/asset-category-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKRW } from "@/lib/format-krw";
import type { Asset, AssetCategory, MonthlyAssetRow } from "@/types/sheets-model";

const PALETTE = ["#3182F6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"];

function parseAmount(raw: string): number {
  return Number(String(raw).replace(/,/g, "")) || 0;
}

function normalizeMonth(s: string): string {
  const t = s.trim().slice(0, 7);
  return /^\d{4}-\d{2}$/.test(t) ? t : "";
}

export default function MonthlyAssetsManagePage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [monthly, setMonthly] = useState<MonthlyAssetRow[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [draftMonth, setDraftMonth] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, m, c] = await Promise.all([
        fetch("/api/sheets/assets").then((r) => r.json()),
        fetch("/api/sheets/monthly-assets").then((r) => r.json()),
        fetch("/api/sheets/asset-categories").then((r) => r.json()),
      ]);
      setConfigured(a.configured ?? false);
      setAssets(a.assets ?? []);
      setMonthly(m.monthlyAssets ?? []);
      setAssetCategories(c.assetCategories ?? []);
    } catch {
      setError("\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rowsDesc = useMemo(() => {
    return [...monthly]
      .filter((r) => r.month)
      .sort((x, y) => y.month.localeCompare(x.month));
  }, [monthly]);

  useEffect(() => {
    if (slide >= rowsDesc.length) setSlide(Math.max(0, rowsDesc.length - 1));
  }, [rowsDesc.length, slide]);

  const current = rowsDesc[slide];

  function colorForType(typeId: string, i: number): string {
    const c = assetCategories.find((x) => x.id === typeId);
    if (c?.color) return c.color;
    return PALETTE[i % PALETTE.length];
  }

  const pieData = useMemo(() => {
    if (!current?.assets?.length) return [];
    return current.assets.map((a, i) => ({
      name: a.name,
      value: a.amount,
      color: colorForType(a.type, i),
    }));
  }, [current, assetCategories]);

  async function ensureCategory(name: string): Promise<string> {
    const t = name.trim();
    const hit = assetCategories.find(
      (c) => c.name.trim().toLowerCase() === t.toLowerCase()
    );
    if (hit) return hit.id;
    const res = await fetch("/api/sheets/asset-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: t,
        color: PALETTE[assetCategories.length % PALETTE.length],
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error ?? "fail");
    }
    const j = (await res.json()) as { id: string };
    await load();
    return j.id;
  }

  function openEdit(rowMonth: string, a: Asset) {
    const key = `${rowMonth}|${a.id}`;
    setEditingKey(key);
    setDraftName(a.name);
    setDraftAmount(String(a.amount));
    setDraftMonth(rowMonth.slice(0, 7));
    setDraftCategoryId(a.type);
  }

  async function saveEdit(master: Asset, rowMonth: string) {
    const nk = `${rowMonth}|${master.id}`;
    setPending(nk);
    setError(null);
    try {
      const monthNew = normalizeMonth(draftMonth);
      if (!monthNew) {
        setError("YYYY-MM \uD615\uC2DD\uC73C\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
        return;
      }
      const name = draftName.trim();
      if (!name) return;

      const resPut = await fetch("/api/sheets/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...master,
          name,
          type: draftCategoryId,
          amount: master.amount,
        }),
      });
      if (!resPut.ok) {
        const j = await resPut.json().catch(() => ({}));
        throw new Error(j.error ?? "PUT fail");
      }

      const amt = parseAmount(draftAmount);
      const oldM = rowMonth.slice(0, 7);

      if (oldM !== monthNew) {
        const z = await fetch("/api/sheets/asset-month", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId: master.id, month: oldM, amount: 0 }),
        });
        if (!z.ok) {
          const j = await z.json().catch(() => ({}));
          throw new Error(j.error ?? "move fail");
        }
      }
      const resM = await fetch("/api/sheets/asset-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: master.id,
          month: monthNew,
          amount: amt,
        }),
      });
      if (!resM.ok) {
        const j = await resM.json().catch(() => ({}));
        throw new Error(j.error ?? "month fail");
      }

      setEditingKey(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "save fail");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/assets"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#3182F6]"
        >
          <ChevronLeft className="size-4" />
          ??
        </Link>
      </div>
      <h1 className="mb-1 text-[22px] font-bold text-[#191F28]">
        ?? ?? ??
      </h1>
      <p className="mb-6 text-sm text-[#8B95A1]">
        ??? ??? ????? ?????.
      </p>

      {configured === false && (
        <div className="mb-4 rounded-2xl bg-[#FFF4E6] px-4 py-3 text-sm text-[#B65C00]">
          Sheets ???
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-[#3182F6]" />
        </div>
      ) : rowsDesc.length === 0 ? (
        <p className="rounded-2xl bg-[#F2F4F6] px-4 py-10 text-center text-sm text-[#8B95A1]">
          ?? ???? ????.
        </p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full"
              disabled={slide <= 0}
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <p className="min-w-0 flex-1 text-center text-sm font-semibold text-[#191F28]">
              {current.month}
            </p>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full"
              disabled={slide >= rowsDesc.length - 1}
              onClick={() =>
                setSlide((s) => Math.min(rowsDesc.length - 1, s + 1))
              }
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[#E5E8EB] bg-white p-4">
            <p className="mb-1 text-xs text-[#8B95A1]">?? ? ? ??</p>
            <p className="mb-4 text-2xl font-bold tabular-nums text-[#191F28]">
              {formatKRW(current.totalAmount)}
            </p>

            <div className="mb-4 h-[200px] w-full">
              {pieData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-[#8B95A1]">
                  ??? ?? ??? ????
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(v) =>
                        typeof v === "number"
                          ? formatKRW(v)
                          : String(v ?? "")
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <p className="mb-2 text-xs font-medium text-[#4E5968]">?? ??</p>
            <ul className="flex flex-col gap-2">
              {current.assets.map((a) => {
                const master = assets.find((x) => String(x.id) === String(a.id));
                if (!master) return null;
                const pct =
                  current.totalAmount > 0
                    ? Math.round((a.amount / current.totalAmount) * 1000) / 10
                    : 0;
                const key = `${current.month}|${a.id}`;
                const isEd = editingKey === key;

                return (
                  <li key={a.id}>
                    {!isEd ? (
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#E5E8EB] bg-[#F9FAFB] px-3 py-2.5 text-left"
                        onClick={() => openEdit(current.month, a)}
                      >
                        <span className="min-w-0 flex-1 truncate font-medium text-[#191F28]">
                          {a.name}
                        </span>
                        <span className="shrink-0 text-xs text-[#8B95A1]">
                          {pct}%
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-[#191F28]">
                          {formatKRW(a.amount)}
                        </span>
                      </button>
                    ) : (
                      <div className="space-y-2 rounded-xl border border-[#3182F6] bg-white p-3">
                        <Input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="rounded-lg"
                          placeholder="??"
                        />
                        <AssetCategoryCombobox
                          categories={assetCategories}
                          valueId={draftCategoryId}
                          onValueIdChange={setDraftCategoryId}
                          onEnsureNewCategory={ensureCategory}
                          disabled={configured === false}
                        />
                        <Input
                          inputMode="numeric"
                          value={draftAmount}
                          onChange={(e) => setDraftAmount(e.target.value)}
                          className="rounded-lg"
                          placeholder="??"
                        />
                        <Input
                          value={draftMonth}
                          onChange={(e) => setDraftMonth(e.target.value)}
                          className="rounded-lg"
                          placeholder="YYYY-MM"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="flex-1 rounded-lg bg-[#3182F6]"
                            disabled={pending === key || configured === false}
                            onClick={() => void saveEdit(master, current.month)}
                          >
                            {pending === key ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              "??"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="rounded-lg"
                            onClick={() => setEditingKey(null)}
                          >
                            ??
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-3 text-center text-xs text-[#8B95A1]">
            {slide + 1} / {rowsDesc.length}
          </p>
        </>
      )}
    </div>
  );
}

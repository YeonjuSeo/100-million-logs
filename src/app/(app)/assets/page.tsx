"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { AssetCategoryCombobox } from "@/components/asset-category-combobox";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MonthlyAssetsChart } from "@/components/monthly-assets-chart";
import { formatKRW } from "@/lib/format-krw";
import type { Asset, AssetCategory, MonthlyAssetRow } from "@/types/sheets-model";

const LEGACY_TYPE_LABEL: Record<string, string> = {
  deposit: "\uC608\uAE08",
  stock: "\uC8FC\uC2DD",
  savings: "\uC801\uAE08",
  other: "\uAE30\uD0C0",
};

const PALETTE = ["#3182F6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#6b7280"];

function parseAmount(raw: string): number {
  return Number(String(raw).replace(/,/g, "")) || 0;
}

function latestRecordedAmount(asset: Asset, monthly: MonthlyAssetRow[]): number {
  const sorted = [...monthly].sort((a, b) => b.month.localeCompare(a.month));
  for (const row of sorted) {
    const hit = row.assets.find((x) => String(x.id) === String(asset.id));
    if (hit) return hit.amount;
  }
  return asset.amount;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [monthly, setMonthly] = useState<MonthlyAssetRow[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const [draftName, setDraftName] = useState("");
  const [draftBaseline, setDraftBaseline] = useState("");
  const [draftCategoryId, setDraftCategoryId] = useState("");

  const [addName, setAddName] = useState("");
  const [addBaseline, setAddBaseline] = useState("");
  const [addCategoryId, setAddCategoryId] = useState("");
  const now = useMemo(() => new Date(), []);
  const [addYear, setAddYear] = useState(now.getFullYear());
  const [addMon, setAddMon] = useState(now.getMonth() + 1);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
    }
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
      const cats = c.assetCategories ?? [];
      setAssetCategories(cats);
    } catch {
      setError(
        "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const displayTotal = useMemo(() => {
    return assets.reduce(
      (s, a) => s + latestRecordedAmount(a, monthly),
      0
    );
  }, [assets, monthly]);

  function categoryLabel(type: string): string {
    const c = assetCategories.find((x) => x.id === type);
    if (c) return c.name;
    return LEGACY_TYPE_LABEL[type] ?? type;
  }

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
      throw new Error(j.error ?? "category");
    }
    const j = (await res.json()) as { id: string };
    await load({ silent: true });
    return j.id;
  }

  function beginEdit(a: Asset) {
    setShowAdd(false);
    setEditingId(String(a.id));
    setDraftName(a.name);
    setDraftBaseline(String(a.amount));
    setDraftCategoryId(a.type);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(master: Asset) {
    const idKey = String(master.id);
    setPending(`save-${idKey}`);
    setError(null);
    try {
      const res = await fetch("/api/sheets/assets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...master,
          name: draftName.trim(),
          amount: parseAmount(draftBaseline),
          type: draftCategoryId,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "fail");
      }
      setEditingId(null);
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "fail");
    } finally {
      setPending(null);
    }
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addCategoryId) return;
    setPending("add");
    setError(null);
    try {
      const ym = `${addYear}-${String(addMon).padStart(2, "0")}`;
      const res = await fetch("/api/sheets/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim(),
          amount: parseAmount(addBaseline),
          type: addCategoryId,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "fail");
      }
      const { id } = (await res.json()) as { id: string };
      const resM = await fetch("/api/sheets/asset-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: id,
          month: ym,
          amount: parseAmount(addBaseline),
        }),
      });
      if (!resM.ok) {
        const j = await resM.json().catch(() => ({}));
        throw new Error(j.error ?? "month");
      }
      setAddName("");
      setAddBaseline("");
      setShowAdd(false);
      await load({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "fail");
    } finally {
      setPending(null);
    }
  }

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return Array.from({ length: 11 }, (_, i) => y - 5 + i);
  }, [now]);

  return (
    <div className="px-4 pt-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#191F28]">
          내 자산
        </h1>
        <p className="mt-1 text-sm text-[#8B95A1]">
          총 자산과 월별 추이, 현재 자산 목록을 확인해요
        </p>
      </header>

      {configured === false && (
        <div className="mb-4 rounded-2xl bg-[#FFF4E6] px-4 py-3 text-sm text-[#B65C00]">
          Google Sheets가 연결되지 않았습니다. MY 탭에서 연결 방법을 확인해
          주세요.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="mb-4 rounded-2xl border-0 bg-[#3182F6] py-5 text-white shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-white/90">
            총 자산
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="size-6 animate-spin opacity-80" />
          ) : (
            <p className="text-3xl font-bold tabular-nums tracking-tight">
              {formatKRW(displayTotal)}
            </p>
          )}
        </CardContent>
      </Card>

      {!loading && monthly.length > 0 && (
        <MonthlyAssetsChart rows={monthly} />
      )}

      <section className="mb-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#4E5968]">
            현재의 자산 목록
          </h2>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl border-[#E5E8EB] text-xs font-medium"
          >
            <Link href="/assets/monthly">월별 자산 목록 관리하기</Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-sm text-[#8B95A1]">불러오는 중…</p>
          ) : (
            <>
              {assets.map((a) => {
                const latest = latestRecordedAmount(a, monthly);
                const isEd =
                  editingId !== null && String(editingId) === String(a.id);

                return (
                  <div key={a.id}>
                    {!isEd ? (
                      <button
                        type="button"
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3 text-left transition hover:bg-[#FAFBFC]"
                        onClick={() => beginEdit(a)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#191F28]">{a.name}</p>
                          <p className="text-xs text-[#8B95A1]">
                            {categoryLabel(a.type)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-[#191F28]">
                          {formatKRW(latest)}
                        </p>
                      </button>
                    ) : (
                      <div
                        className="rounded-2xl border border-[#3182F6] bg-white p-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex flex-col gap-2">
                          <Input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            className="rounded-xl border-[#E5E8EB]"
                            placeholder="이름"
                          />
                          <Input
                            inputMode="numeric"
                            value={draftBaseline}
                            onChange={(e) => setDraftBaseline(e.target.value)}
                            className="rounded-xl border-[#E5E8EB]"
                            placeholder="기준 금액 (시트 Assets)"
                          />
                          <AssetCategoryCombobox
                            categories={assetCategories}
                            valueId={draftCategoryId}
                            onValueIdChange={setDraftCategoryId}
                            onEnsureNewCategory={ensureCategory}
                            disabled={configured === false}
                          />
                          <div className="flex gap-2 pt-1">
                            <Button
                              type="button"
                              className="flex-1 rounded-xl bg-[#3182F6] hover:bg-[#1B64DA]"
                              disabled={
                                pending === `save-${String(a.id)}` ||
                                configured === false ||
                                !draftName.trim()
                              }
                              onClick={() => void saveEdit(a)}
                            >
                              {pending === `save-${String(a.id)}` ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                "저장"
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="rounded-xl"
                              onClick={cancelEdit}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!showAdd ? (
                <button
                  type="button"
                  className="flex min-h-[56px] w-full items-center justify-center rounded-2xl border border-dashed border-[#E5E8EB] bg-[#F9FAFB] px-4 py-3 text-sm font-medium text-[#3182F6] transition hover:bg-[#F2F4F6]"
                  onClick={() => {
                    setEditingId(null);
                    setShowAdd(true);
                  }}
                >
                  자산 추가하기
                </button>
              ) : (
                <form
                  onSubmit={submitAdd}
                  className="flex flex-col gap-3 rounded-2xl border border-[#E5E8EB] bg-[#F9FAFB] p-4"
                >
                  <Input
                    placeholder="이름"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    className="rounded-xl border-[#E5E8EB] bg-white"
                  />
                  <Input
                    placeholder="금액"
                    inputMode="numeric"
                    value={addBaseline}
                    onChange={(e) => setAddBaseline(e.target.value)}
                    className="rounded-xl border-[#E5E8EB] bg-white"
                  />
                  <AssetCategoryCombobox
                    categories={assetCategories}
                    valueId={addCategoryId}
                    onValueIdChange={setAddCategoryId}
                    onEnsureNewCategory={ensureCategory}
                    disabled={configured === false}
                  />
                  <div className="flex gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-[10px] text-[#8B95A1]">연도</label>
                      <select
                        value={addYear}
                        onChange={(e) => setAddYear(Number(e.target.value))}
                        className="h-10 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm"
                      >
                        {yearOptions.map((y) => (
                          <option key={y} value={y}>
                            {y}년
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-[10px] text-[#8B95A1]">월</label>
                      <select
                        value={addMon}
                        onChange={(e) => setAddMon(Number(e.target.value))}
                        className="h-10 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (m) => (
                            <option key={m} value={m}>
                              {m}월
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-[#8B95A1]">
                    기록 연·월의 월별 스냅샷에도 같은 금액이 반영됩니다.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={
                        pending === "add" ||
                        configured === false ||
                        !addName.trim() ||
                        !addCategoryId
                      }
                      className="flex-1 rounded-xl bg-[#3182F6] hover:bg-[#1B64DA]"
                    >
                      {pending === "add" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> 저장 중
                        </>
                      ) : (
                        "저장"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => {
                        setShowAdd(false);
                        setAddName("");
                        setAddBaseline("");
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

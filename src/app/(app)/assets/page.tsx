"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

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
import type { Asset, AssetType, MonthlyAssetRow } from "@/types/sheets-model";

const TYPE_LABEL: Record<string, string> = {
  deposit: "예금",
  stock: "주식",
  savings: "적금",
  other: "기타",
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [monthly, setMonthly] = useState<MonthlyAssetRow[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<AssetType>("deposit");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, m] = await Promise.all([
        fetch("/api/sheets/assets").then((r) => r.json()),
        fetch("/api/sheets/monthly-assets").then((r) => r.json()),
      ]);
      setConfigured(a.configured ?? false);
      setAssets(a.assets ?? []);
      setMonthly(m.monthlyAssets ?? []);
    } catch {
      setError("불러오기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = assets.reduce((s, a) => s + a.amount, 0);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sheets/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: Number(amount.replace(/,/g, "")),
          type,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "저장 실패");
      }
      setName("");
      setAmount("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#191F28]">
          내 자산
        </h1>
        <p className="mt-1 text-sm text-[#8B95A1]">
          예금·투자 자산을 한곳에서 확인해요
        </p>
      </header>

      {configured === false && (
        <div className="mb-4 rounded-2xl bg-[#FFF4E6] px-4 py-3 text-sm text-[#B65C00]">
          Google Sheets가 연결되지 않았습니다. MY 탭에서 연결 방법을
          확인해 주세요.
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
              {formatKRW(total)}
            </p>
          )}
        </CardContent>
      </Card>

      {!loading && monthly.length > 0 && (
        <MonthlyAssetsChart rows={monthly} />
      )}

      {monthly.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-[#4E5968]">
            월별 총자산 (목록)
          </h2>
          <div className="flex flex-col gap-2">
            {[...monthly]
              .sort((x, y) => y.month.localeCompare(x.month))
              .slice(0, 12)
              .map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between rounded-2xl border border-[#E5E8EB] bg-white px-4 py-2.5"
                >
                  <span className="text-sm text-[#4E5968]">{row.month}</span>
                  <span className="text-sm font-semibold tabular-nums text-[#191F28]">
                    {formatKRW(row.totalAmount)}
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold text-[#4E5968]">자산 목록</h2>
        <div className="flex flex-col gap-2">
          {loading ? (
            <p className="text-sm text-[#8B95A1]">불러오는 중…</p>
          ) : assets.length === 0 ? (
            <p className="rounded-2xl bg-[#F2F4F6] px-4 py-8 text-center text-sm text-[#8B95A1]">
              등록된 자산이 없어요
            </p>
          ) : (
            assets.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-[#191F28]">{a.name}</p>
                  <p className="text-xs text-[#8B95A1]">
                    {TYPE_LABEL[a.type] ?? a.type}
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums text-[#191F28]">
                  {formatKRW(a.amount)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E5E8EB] bg-[#F9FAFB] p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#4E5968]">
          <Plus className="size-4" />
          자산 추가
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <Input
            placeholder="이름 (예: KB국민은행)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-[#E5E8EB] bg-white"
          />
          <Input
            placeholder="금액"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded-xl border-[#E5E8EB] bg-white"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as AssetType)}
            className="border-input h-10 w-full rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm"
          >
            <option value="deposit">예금</option>
            <option value="stock">주식</option>
            <option value="savings">적금</option>
            <option value="other">기타</option>
          </select>
          <Button
            type="submit"
            disabled={saving || configured === false}
            className="h-11 rounded-xl bg-[#3182F6] font-semibold hover:bg-[#1B64DA]"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> 저장 중
              </>
            ) : (
              "스프레드시트에 저장"
            )}
          </Button>
        </form>
      </section>
    </div>
  );
}

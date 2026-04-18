"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKRW } from "@/lib/format-krw";
import type { Category, Expense } from "@/types/sheets-model";

export default function LedgerPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ex, cat] = await Promise.all([
        fetch("/api/sheets/expenses").then((r) => r.json()),
        fetch("/api/sheets/categories").then((r) => r.json()),
      ]);
      setConfigured(ex.configured ?? false);
      setExpenses(ex.expenses ?? []);
      const cats = cat.categories ?? [];
      setCategories(cats);
      setCategory((prev) => (prev ? prev : cats[0]?.name ?? ""));
    } catch {
      setError("불러오기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !amount) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sheets/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          category,
          amount: Number(String(amount).replace(/,/g, "")),
          description: description.trim(),
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "저장 실패");
      }
      setAmount("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="px-4 pt-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#191F28]">
          가계부
        </h1>
        <p className="mt-1 text-sm text-[#8B95A1]">
          지출을 기록하고 카테고리별로 관리해요
        </p>
      </header>

      {configured === false && (
        <div className="mb-4 rounded-2xl bg-[#FFF4E6] px-4 py-3 text-sm text-[#B65C00]">
          Sheets 미연결 시 목록은 비어 있고, 저장은 할 수 없어요.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-6 space-y-3 rounded-2xl border border-[#E5E8EB] bg-[#F9FAFB] p-4"
      >
        <p className="text-sm font-semibold text-[#4E5968]">지출 입력</p>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border-[#E5E8EB] bg-white"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border-input h-10 w-full rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm"
        >
          {categories.length === 0 ? (
            <option value="">카테고리 없음 (Sheets Categories 탭)</option>
          ) : (
            categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))
          )}
        </select>
        <Input
          placeholder="금액"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-xl border-[#E5E8EB] bg-white"
        />
        <Input
          placeholder="메모 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl border-[#E5E8EB] bg-white"
        />
        <Button
          type="submit"
          disabled={saving || configured === false || !category}
          className="h-11 w-full rounded-xl bg-[#3182F6] font-semibold hover:bg-[#1B64DA]"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" /> 저장 중
            </>
          ) : (
            "지출 저장"
          )}
        </Button>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-[#4E5968]">
          최근 지출
        </h2>
        {loading ? (
          <p className="text-sm text-[#8B95A1]">불러오는 중…</p>
        ) : sorted.length === 0 ? (
          <p className="rounded-2xl bg-[#F2F4F6] py-8 text-center text-sm text-[#8B95A1]">
            기록된 지출이 없어요
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.slice(0, 30).map((x) => (
              <li
                key={x.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#191F28]">{x.category}</p>
                  <p className="text-xs text-[#8B95A1]">
                    {x.date}{" "}
                    {x.description ? `· ${x.description}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-[#191F28]">
                  {formatKRW(x.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

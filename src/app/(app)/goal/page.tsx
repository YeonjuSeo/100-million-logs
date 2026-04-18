"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKRW } from "@/lib/format-krw";
import type { GoalSettings } from "@/types/sheets-model";

const emptyGoal: GoalSettings = {
  startAmount: 0,
  startDate: "2025-01",
  targetAmount: 100_000_000,
  targetDate: "2026-12",
  monthlyIncome: 0,
  monthlyExpense: 0,
  monthlyBudget: 0,
};

export default function GoalPage() {
  const [goal, setGoal] = useState<GoalSettings>(emptyGoal);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sheets/goal");
      const data = await res.json();
      setConfigured(data.configured ?? false);
      if (data.goal) setGoal(data.goal);
    } catch {
      setError("불러오기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function patch<K extends keyof GoalSettings>(key: K, value: GoalSettings[K]) {
    setGoal((g) => ({ ...g, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/sheets/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goal),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "저장 실패");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  const surplus =
    goal.monthlyIncome - goal.monthlyExpense - goal.monthlyBudget;

  return (
    <div className="px-4 pt-6">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#191F28]">
          목표
        </h1>
        <p className="mt-1 text-sm text-[#8B95A1]">
          Goal 시트와 동일한 필드를 편집해요
        </p>
      </header>

      {configured === false && (
        <div className="mb-4 rounded-2xl bg-[#FFF4E6] px-4 py-3 text-sm text-[#B65C00]">
          Sheets 연결 후 저장할 수 있어요. MY 탭을 확인해 주세요.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <Loader2 className="mx-auto my-12 size-8 animate-spin text-[#3182F6]" />
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <Field
            label="시작 자산 (startAmount)"
            input={
              <Input
                inputMode="numeric"
                value={String(goal.startAmount)}
                onChange={(e) =>
                  patch("startAmount", Number(e.target.value.replace(/,/g, "")))
                }
                className="rounded-xl border-[#E5E8EB]"
              />
            }
          />
          <Field
            label="시작 시점 (startDate, YYYY-MM)"
            input={
              <Input
                value={goal.startDate}
                onChange={(e) => patch("startDate", e.target.value)}
                className="rounded-xl border-[#E5E8EB]"
              />
            }
          />
          <Field
            label="목표 금액 (targetAmount)"
            input={
              <Input
                inputMode="numeric"
                value={String(goal.targetAmount)}
                onChange={(e) =>
                  patch("targetAmount", Number(e.target.value.replace(/,/g, "")))
                }
                className="rounded-xl border-[#E5E8EB]"
              />
            }
          />
          <Field
            label="목표 시점 (targetDate, YYYY-MM)"
            input={
              <Input
                value={goal.targetDate}
                onChange={(e) => patch("targetDate", e.target.value)}
                className="rounded-xl border-[#E5E8EB]"
              />
            }
          />
          <Field
            label="월 소득 (monthlyIncome)"
            input={
              <Input
                inputMode="numeric"
                value={String(goal.monthlyIncome)}
                onChange={(e) =>
                  patch("monthlyIncome", Number(e.target.value.replace(/,/g, "")))
                }
                className="rounded-xl border-[#E5E8EB]"
              />
            }
          />
          <Field
            label="월 지출 (monthlyExpense)"
            input={
              <Input
                inputMode="numeric"
                value={String(goal.monthlyExpense)}
                onChange={(e) =>
                  patch(
                    "monthlyExpense",
                    Number(e.target.value.replace(/,/g, ""))
                  )
                }
                className="rounded-xl border-[#E5E8EB]"
              />
            }
          />
          <Field
            label="월 저축 예산 (monthlyBudget)"
            input={
              <Input
                inputMode="numeric"
                value={String(goal.monthlyBudget)}
                onChange={(e) =>
                  patch(
                    "monthlyBudget",
                    Number(e.target.value.replace(/,/g, ""))
                  )
                }
                className="rounded-xl border-[#E5E8EB]"
              />
            }
          />

          <div className="rounded-2xl bg-[#F2F4F6] px-4 py-3 text-sm text-[#4E5968]">
            <p className="font-medium text-[#191F28]">요약</p>
            <p className="mt-1">
              목표 금액:{" "}
              <span className="font-semibold tabular-nums">
                {formatKRW(goal.targetAmount)}
              </span>
            </p>
            <p className="mt-1">
              소득 − 지출 − 저축 예산 ={" "}
              <span
                className={
                  surplus >= 0 ? "font-semibold text-[#3182F6]" : "font-semibold text-red-600"
                }
              >
                {formatKRW(surplus)}
              </span>
            </p>
          </div>

          <Button
            type="submit"
            disabled={saving || configured === false}
            className="h-12 w-full rounded-xl bg-[#3182F6] font-semibold hover:bg-[#1B64DA]"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> 저장 중
              </>
            ) : (
              "Goal 시트에 반영"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  input,
}: {
  label: string;
  input: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-[#8B95A1]">
        {label}
      </label>
      {input}
    </div>
  );
}

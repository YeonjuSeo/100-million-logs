"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatKRW } from "@/lib/format-krw";
import type { MonthlyAssetRow } from "@/types/sheets-model";

type ChartPoint = {
  label: string;
  totalAmount: number;
  month: string;
};

function formatMonthLabel(month: string): string {
  const m = month.match(/^(\d{4})-(\d{2})/);
  if (!m) return month;
  return `${m[1].slice(2)}.${Number(m[2])}월`;
}

function formatYAxis(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  return `${n}`;
}

export function MonthlyAssetsChart({ rows }: { rows: MonthlyAssetRow[] }) {
  const data = useMemo<ChartPoint[]>(() => {
    return [...rows]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((r) => ({
        label: formatMonthLabel(r.month),
        totalAmount: r.totalAmount,
        month: r.month,
      }));
  }, [rows]);

  if (data.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-[#E5E8EB] bg-white p-4">
      <h2 className="mb-1 text-sm font-semibold text-[#4E5968]">
        월별 총자산 추이
      </h2>
      <p className="mb-4 text-xs text-[#8B95A1]">
        MonthlyAssets 시트의 총액 기준
      </p>
      <div className="h-[240px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -12, bottom: 8 }}
          >
            <CartesianGrid stroke="#EEF1F4" strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#8B95A1" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E8EB" }}
              interval="preserveStartEnd"
              angle={data.length > 5 ? -30 : 0}
              textAnchor={data.length > 5 ? "end" : "middle"}
              height={data.length > 5 ? 48 : 28}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#8B95A1" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatYAxis}
              width={44}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E5E8EB",
                fontSize: "12px",
              }}
              formatter={(value) => [
                formatKRW(Number(value)),
                "총 자산",
              ]}
              labelFormatter={(label) => String(label)}
            />
            <Line
              type="monotone"
              dataKey="totalAmount"
              stroke="#3182F6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#3182F6", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#1B64DA" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

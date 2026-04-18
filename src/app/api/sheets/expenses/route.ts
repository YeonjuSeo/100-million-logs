import { NextResponse } from "next/server";

import { isSheetsConfigured } from "@/lib/google-sheets/config";
import { appendExpense, fetchExpenses } from "@/lib/google-sheets/service";
import type { Expense } from "@/types/sheets-model";

export async function GET() {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { expenses: [], configured: false },
      { status: 200 }
    );
  }
  try {
    const expenses = await fetchExpenses();
    return NextResponse.json({ expenses, configured: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: "Sheets 미연결", configured: false },
      { status: 503 }
    );
  }
  try {
    const body = (await request.json()) as Omit<Expense, "id">;
    const id = await appendExpense(body);
    return NextResponse.json({ id, ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

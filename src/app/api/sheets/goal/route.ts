import { NextResponse } from "next/server";

import { isSheetsConfigured } from "@/lib/google-sheets/config";
import { fetchGoal, updateGoal } from "@/lib/google-sheets/service";
import type { GoalSettings } from "@/types/sheets-model";

export async function GET() {
  if (!isSheetsConfigured()) {
    return NextResponse.json({ goal: null, configured: false });
  }
  try {
    const goal = await fetchGoal();
    return NextResponse.json({ goal, configured: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: "Sheets 미연결", configured: false },
      { status: 503 }
    );
  }
  try {
    const body = (await request.json()) as GoalSettings;
    await updateGoal(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

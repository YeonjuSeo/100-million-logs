import { NextResponse } from "next/server";

import { isSheetsConfigured } from "@/lib/google-sheets/config";
import {
  appendMonthlyAssetSnapshot,
  fetchMonthlyAssets,
} from "@/lib/google-sheets/service";
import type { Asset } from "@/types/sheets-model";

export async function GET() {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { monthlyAssets: [], configured: false },
      { status: 200 }
    );
  }
  try {
    const monthlyAssets = await fetchMonthlyAssets();
    return NextResponse.json({ monthlyAssets, configured: true });
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
    const body = (await request.json()) as {
      month: string;
      assets: Asset[];
      totalAmount: number;
    };
    const id = await appendMonthlyAssetSnapshot(body);
    return NextResponse.json({ id, ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

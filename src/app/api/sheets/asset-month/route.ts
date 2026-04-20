import { NextResponse } from "next/server";

import { isSheetsConfigured } from "@/lib/google-sheets/config";
import { setAssetMonthAmount } from "@/lib/google-sheets/service";

export async function POST(request: Request) {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: "Sheets ???", configured: false },
      { status: 503 }
    );
  }
  try {
    const body = (await request.json()) as {
      assetId: string;
      month: string;
      amount: number;
    };
    await setAssetMonthAmount(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

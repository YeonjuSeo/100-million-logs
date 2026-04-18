import { NextResponse } from "next/server";

import { isSheetsConfigured } from "@/lib/google-sheets/config";
import { appendAsset, fetchAssets } from "@/lib/google-sheets/service";
import type { Asset } from "@/types/sheets-model";

export async function GET() {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { assets: [], configured: false },
      { status: 200 }
    );
  }
  try {
    const assets = await fetchAssets();
    return NextResponse.json({ assets, configured: true });
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
    const body = (await request.json()) as Omit<Asset, "id">;
    const id = await appendAsset(body);
    return NextResponse.json({ id, ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

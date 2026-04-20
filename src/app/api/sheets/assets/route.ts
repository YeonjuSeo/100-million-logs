import { NextResponse } from "next/server";

import { isSheetsConfigured } from "@/lib/google-sheets/config";
import {
  appendAsset,
  fetchAssets,
  updateAsset,
} from "@/lib/google-sheets/service";
import type { Asset } from "@/types/sheets-model";

const SHEETS_DISCONNECTED = "Sheets \uBBF8\uC5F0\uACB0";

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
      { error: SHEETS_DISCONNECTED, configured: false },
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

export async function PUT(request: Request) {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: SHEETS_DISCONNECTED, configured: false },
      { status: 503 }
    );
  }
  try {
    const body = (await request.json()) as Asset;
    await updateAsset(body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import { isSheetsConfigured } from "@/lib/google-sheets/config";
import {
  appendAssetCategory,
  fetchAssetCategories,
} from "@/lib/google-sheets/service";
import type { AssetCategory } from "@/types/sheets-model";

function hintForAppsScriptError(message: string): string | undefined {
  if (/Unauthorized/i.test(message)) {
    return "\u002E\u0065\u006E\u0076\uC758\u0020\u0041\u0050\u0050\u0053\u005F\u0053\u0043\u0052\u0049\u0050\u0054\u005F\u0053\u0045\u0043\u0052\u0045\u0054\uC774\u0020\u0041\u0070\u0070\u0073\u0020\u0053\u0063\u0072\u0069\u0070\u0074\u0020\uC18D\uC131\u0020\u0041\u0050\u0050\u0053\u005F\u0053\u0043\u0052\u0049\u0050\u0054\u005F\u0053\u0045\u0043\u0052\u0045\u0054\uACFC\u0020\uB3D9\uC77C\uD55C\uC9C0\u0020\uD655\uC778\uD558\uC138\uC694\u002E";
  }
  if (/Unknown action/i.test(message)) {
    return "\u0047\u006F\u006F\u0067\u006C\u0065\u0020\u0041\u0070\u0070\u0073\u0020\u0053\u0063\u0072\u0069\u0070\u0074\uC5D0\u0020\uCD5C\uC2E0\u0020\u0043\u006F\u0064\u0065\u002E\u0067\u0073\uB97C\u0020\uBD99\uC5EC\uB123\uACE0\u0020\uC6F9\uC571\uC744\u0020\uC0C8\u0020\uBC84\uC804\uC73C\uB85C\u0020\uB2E4\uC2DC\u0020\uBC30\uD3EC\uD588\uB294\uC9C0\u0020\uD655\uC778\uD558\uC138\uC694\u002E\u0020\u0028\u0067\u0065\u0074\u0041\u0073\u0073\u0065\u0074\u0043\u0061\u0074\u0065\u0067\u006F\u0072\u0069\u0065\u0073\u0020\uC561\uC158\u0020\uD544\uC694\u0029";
  }
  if (/AssetCategories sheet missing/i.test(message)) {
    return "\uC2A4\uD504\uB808\uB4DC\uC2DC\uD2B8\uC5D0\u0020\u0041\u0073\u0073\u0065\u0074\u0043\u0061\u0074\u0065\u0067\u006F\u0072\u0069\u0065\u0073\u0020\uC2DC\uD2B8\uAC00\u0020\uC5C6\uC2B5\uB2C8\uB2E4\u002E\u0020\u0041\u0070\u0070\u0073\u0020\u0053\u0063\u0072\u0069\u0070\u0074\uC5D0\uC11C\u0020\u0073\u0065\u0074\u0075\u0070\u0053\u0068\u0065\u0065\u0074\u0073\u0028\u0029\uB97C\u0020\uD55C\u0020\uBC88\u0020\uC2E4\uD589\uD558\uC138\uC694\u002E";
  }
  if (/Set APPS_SCRIPT_SECRET/i.test(message)) {
    return "\u0041\u0070\u0070\u0073\u0020\u0053\u0063\u0072\u0069\u0070\u0074\u0020\uD3B8\uC9D1\uAE30\uC5D0\uC11C\u0020\uC2A4\uD06C\uB9BD\uD2B8\u0020\uC18D\uC131\u0020\u0041\u0050\u0050\u0053\u005F\u0053\u0043\u0052\u0049\u0050\u0054\u005F\u0053\u0045\u0043\u0052\u0045\u0054\uC744\u0020\uC124\uC815\uD558\uAC70\uB098\u0020\u0043\u006F\u0064\u0065\u002E\u0067\u0073\uC758\u0020\u0041\u0050\u0050\u0053\u005F\u0053\u0043\u0052\u0049\u0050\u0054\u005F\u0053\u0045\u0043\u0052\u0045\u0054\u005F\u0056\u0041\u004C\u0055\u0045\uB97C\u0020\uCC44\uC6B0\uC138\uC694\u002E";
  }
  if (/script\.google\.com|macros|HTML/i.test(message)) {
    return "\u002E\u0065\u006E\u0076\uC758\u0020\u0047\u004F\u004F\u0047\u004C\u0045\u005F\u0041\u0050\u0050\u0053\u005F\u0053\u0043\u0052\u0049\u0050\u0054\u005F\u0057\u0045\u0042\u005F\u0041\u0050\u0050\u005F\u0055\u0052\u004C\uC774\u0020\u002E\u002E\u002E\u002F\u0065\u0078\u0065\u0063\u0020\uD615\uD0DC\uC758\u0020\uC6F9\uC571\u0020\u0055\u0052\u004C\uC778\uC9C0\u0020\uD655\uC778\uD558\uC138\uC694\u002E";
  }
  return undefined;
}

export async function GET() {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { assetCategories: [], configured: false },
      { status: 200 }
    );
  }
  try {
    const assetCategories = await fetchAssetCategories();
    return NextResponse.json({ assetCategories, configured: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[GET /api/sheets/asset-categories]", message);
    const hint = hintForAppsScriptError(message);
    return NextResponse.json(
      { error: message, ...(hint ? { hint } : {}) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      {
        error: "\u0053\u0068\u0065\u0065\u0074\u0073\u0020\uBBF8\uC5F0\uACB0",
        configured: false,
      },
      { status: 503 }
    );
  }
  try {
    const body = (await request.json()) as Omit<AssetCategory, "id">;
    const id = await appendAssetCategory(body);
    return NextResponse.json({ id, ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[POST /api/sheets/asset-categories]", message);
    const hint = hintForAppsScriptError(message);
    return NextResponse.json(
      { error: message, ...(hint ? { hint } : {}) },
      { status: 500 }
    );
  }
}

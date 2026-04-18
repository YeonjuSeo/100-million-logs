import { NextResponse } from "next/server";

import {
  getSpreadsheetIdForDisplay,
  isSheetsConfigured,
} from "@/lib/google-sheets/config";

export async function GET() {
  return NextResponse.json({
    configured: isSheetsConfigured(),
    spreadsheetId: getSpreadsheetIdForDisplay(),
    mode: "apps_script",
  });
}

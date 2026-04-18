import { NextResponse } from "next/server";

import { isSheetsConfigured } from "@/lib/google-sheets/config";
import { fetchCategories } from "@/lib/google-sheets/service";

export async function GET() {
  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { categories: [], configured: false },
      { status: 200 }
    );
  }
  try {
    const categories = await fetchCategories();
    return NextResponse.json({ categories, configured: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

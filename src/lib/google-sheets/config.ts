export const SHEET_TABS = {
  goal: "Goal",
  assets: "Assets",
  expenses: "Expenses",
  categories: "Categories",
  monthlyAssets: "MonthlyAssets",
} as const;

/** Apps Script 웹앱 + 공유 비밀번호 */
export function isSheetsConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL?.trim() &&
      process.env.APPS_SCRIPT_SECRET?.trim()
  );
}

/** MY 화면 표시용 (선택: 스프레드시트 URL 공유 시 ID만 넣어두면 됨) */
export function getSpreadsheetIdForDisplay(): string | null {
  const id = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim();
  return id || null;
}

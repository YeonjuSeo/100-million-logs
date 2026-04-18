"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

export default function ProfilePage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/sheets/status")
      .then((r) => r.json())
      .then((d) => {
        setConfigured(d.configured ?? false);
        setSpreadsheetId(d.spreadsheetId ?? null);
      })
      .catch(() => setConfigured(false));
  }, []);

  return (
    <div className="px-4 pt-6 pb-4">
      <header className="mb-6">
        <h1 className="text-[22px] font-bold tracking-tight text-[#191F28]">
          MY
        </h1>
        <p className="mt-1 text-sm text-[#8B95A1]">
          데이터 연결과 앱 정보
        </p>
      </header>

      <section className="mb-5 rounded-2xl border border-[#E5E8EB] bg-white p-4">
        <h2 className="text-sm font-semibold text-[#191F28]">
          Google Apps Script 연결
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#4E5968]">
          스프레드시트는 <strong>Apps Script</strong>가 직접 열고 수정합니다.
          저장소의 <code className="rounded bg-[#F2F4F6] px-1 text-xs">google-apps-script/Code.gs</code>{" "}
          를 시트에 붙여 넣은 뒤, <strong>웹 앱으로 배포</strong>하고 나온 URL을
          환경 변수에 넣어 주세요. 탭 이름은{" "}
          <code className="rounded bg-[#F2F4F6] px-1 text-xs">
            Goal, Assets, Expenses, Categories, MonthlyAssets
          </code>{" "}
          과 같아야 합니다.
        </p>
        <div className="mt-3 rounded-xl bg-[#F2F4F6] px-3 py-2 text-sm">
          <p className="text-[#8B95A1]">상태</p>
          <p className="font-semibold text-[#191F28]">
            {configured === null
              ? "확인 중…"
              : configured
                ? "연결됨 (웹앱)"
                : "미설정 (.env.local 필요)"}
          </p>
          {spreadsheetId && (
            <p className="mt-1 break-all text-xs text-[#4E5968]">
              표시용 시트 ID: {spreadsheetId}
            </p>
          )}
        </div>
      </section>

      <section className="mb-5 rounded-2xl border border-[#E5E8EB] bg-white p-4">
        <h2 className="text-sm font-semibold text-[#191F28]">
          환경 변수 (.env.local)
        </h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#4E5968]">
          <li>
            <code className="text-xs">GOOGLE_APPS_SCRIPT_WEB_APP_URL</code>{" "}
            — 배포된 웹 앱 URL (보통 <code className="text-xs">.../exec</code>)
          </li>
          <li>
            <code className="text-xs">APPS_SCRIPT_SECRET</code> — 스크립트에
            설정한 비밀값과 동일
          </li>
          <li>
            <code className="text-xs">GOOGLE_SHEETS_SPREADSHEET_ID</code>{" "}
            (선택) — MY 화면에만 표시
          </li>
        </ul>
        <a
          href="https://developers.google.com/apps-script/guides/web"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#3182F6]"
        >
          Apps Script 웹 앱 가이드
          <ExternalLink className="size-3.5" />
        </a>
      </section>

      <section className="rounded-2xl border border-[#E5E8EB] bg-[#F9FAFB] p-4 text-sm text-[#8B95A1]">
        <p className="font-medium text-[#4E5968]">100-million-logs</p>
        <p className="mt-1">
          Next.js 서버가 웹앱 URL로 POST 하여 시트와 동기화합니다.
        </p>
      </section>
    </div>
  );
}

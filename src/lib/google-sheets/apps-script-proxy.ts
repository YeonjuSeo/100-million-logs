function assertLooksLikeWebAppUrl(url: string): void {
  try {
    const u = new URL(url);
    if (u.hostname !== "script.google.com") {
      throw new Error(
        `GOOGLE_APPS_SCRIPT_WEB_APP_URL 의 호스트가 잘못되었습니다. ` +
          `스프레드시트/문서 주소(docs.google.com 등)가 아니라, ` +
          `Apps Script 편집기「배포 → 웹 앱」에서 복사한 ` +
          `https://script.google.com/macros/s/.../exec 주소를 넣어야 합니다.`
      );
    }
    if (!u.pathname.includes("/macros/")) {
      throw new Error(
        `웹앱 URL은 보통 /macros/s/.../exec 형태입니다. 배포 대화상자에서 복사한 주소인지 확인하세요.`
      );
    }
    if (!u.pathname.endsWith("/exec")) {
      throw new Error(
        `웹앱 URL은 끝이 /exec 이어야 합니다. (테스트용 /dev 가 아닌 배포 URL 사용)`
      );
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error("GOOGLE_APPS_SCRIPT_WEB_APP_URL 이 올바른 URL 형식이 아닙니다.");
    }
    throw e;
  }
}

function parseAppsScriptJsonBody(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (trimmed.startsWith("<")) {
    const hint = trimmed.slice(0, 200).replace(/\s+/g, " ");
    const looksLikeGoogleProductPage =
      hint.includes("docs.google.com") ||
      hint.includes("프레젠테이션") ||
      hint.includes("spreadsheet");
    throw new Error(
      looksLikeGoogleProductPage
        ? `잘못된 주소로 요청된 것 같습니다. 스프레드시트/문서 URL이 아니라 ` +
            `Apps Script「배포 → 웹 앱」의 https://script.google.com/macros/s/.../exec 주소를 .env에 넣어 주세요.`
        : `Apps Script가 JSON 대신 HTML을 반환했습니다. 웹앱 배포 URL(…/exec)인지 확인하고, ` +
            `코드 변경 후 새 버전으로 재배포했는지 확인하세요. 응답 앞부분: ${hint}`
    );
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed !== null && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    throw new Error("JSON이 객체가 아닙니다.");
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(
        `Apps Script 응답이 올바른 JSON이 아닙니다. 앞부분: ${trimmed.slice(0, 160)}`
      );
    }
    throw e;
  }
}

export async function callAppsScript<T extends Record<string, unknown>>(
  payload: Record<string, unknown>
): Promise<T> {
  const url = process.env.GOOGLE_APPS_SCRIPT_WEB_APP_URL?.trim();
  const secret = process.env.APPS_SCRIPT_SECRET?.trim();
  if (!url || !secret) {
    throw new Error("Apps Script URL 또는 APPS_SCRIPT_SECRET 이 없습니다.");
  }

  assertLooksLikeWebAppUrl(url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, secret }),
    cache: "no-store",
  });

  const text = await res.text();
  const data = parseAppsScriptJsonBody(text) as T;

  if (!res.ok) {
    throw new Error(
      "error" in data && data.error
        ? String(data.error)
        : `HTTP ${res.status}`
    );
  }
  if ("error" in data && data.error) {
    throw new Error(String(data.error));
  }
  return data;
}

// Google Sheets API 클라이언트 — 외부 의존성 없음. 인증 경로 2가지(둘 다 있으면 ① 우선):
//   ① OAuth 사용자 토큰: GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN
//      시트 소유자 계정 자격으로 읽으므로 공유가 필요 없다 (외부 공유 차단 정책과 무관).
//   ② 서비스 계정 JWT: GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY(개행 포함)
//      시트(또는 폴더)에 서비스 계정을 뷰어로 공유해야 한다.

import { createSign } from "crypto";

let cachedToken: { token: string; exp: number } | null = null;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function liveCredentials(): { email: string; key: string } | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) return null;
  key = key.replace(/\\n/g, "\n"); // Vercel 대시보드에 한 줄로 넣은 경우 대응
  return { email, key };
}

export function oauthCredentials(): {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
} | null {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

function serviceAccountAssertion(creds: { email: string; key: string }, now: number): string {
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: creds.email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  return `${header}.${claims}.${signer.sign(creds.key, "base64url")}`;
}

async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp > now + 60) return cachedToken.token;

  const oauth = oauthCredentials();
  const sa = liveCredentials();
  let body: URLSearchParams;
  if (oauth) {
    body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      refresh_token: oauth.refreshToken,
    });
  } else if (sa) {
    body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: serviceAccountAssertion(sa, now),
    });
  } else {
    throw new Error("google credentials env missing");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, exp: now + json.expires_in };
  return json.access_token;
}

/* 시트 제목·탭 목록 조회 (연동 진단용) */
export async function sheetMeta(
  spreadsheetId: string,
): Promise<{ title: string; tabs: { title: string; rows: number }[] }> {
  const token = await accessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(title,gridProperties(rowCount))`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`meta failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as {
    properties: { title: string };
    sheets?: { properties: { title: string; gridProperties?: { rowCount?: number } } }[];
  };
  return {
    title: json.properties.title,
    tabs: (json.sheets ?? []).map((s) => ({
      title: s.properties.title,
      rows: s.properties.gridProperties?.rowCount ?? 0,
    })),
  };
}

/* 한 스프레드시트에서 여러 범위를 한 번에 읽는다. 반환: ranges 순서대로 string[][] */
export async function sheetValues(spreadsheetId: string, ranges: string[]): Promise<string[][][]> {
  const token = await accessToken();
  const qs = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join("&");
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${qs}&majorDimension=ROWS`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!res.ok) throw new Error(`sheets read failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { valueRanges?: { values?: string[][] }[] };
  return (json.valueRanges ?? []).map((v) => v.values ?? []);
}

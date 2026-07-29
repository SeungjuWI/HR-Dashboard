// Google Sheets API 클라이언트 — 서비스 계정 JWT 인증, 외부 의존성 없음.
// 필요 환경변수: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_KEY(개행 포함 private key)

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

async function accessToken(): Promise<string> {
  const creds = liveCredentials();
  if (!creds) throw new Error("service account env missing");
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp > now + 60) return cachedToken.token;

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
  const assertion = `${header}.${claims}.${signer.sign(creds.key, "base64url")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, exp: now + json.expires_in };
  return json.access_token;
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

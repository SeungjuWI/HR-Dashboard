// 시트 소유자 1회 동의 시작점 — 구글 동의 화면으로 보낸다. 허용하면 /api/oauth/callback으로 복귀.
import { NextResponse } from "next/server";
import { OAUTH_REDIRECT_URI, OAUTH_SCOPE } from "@/lib/live/oauth";

export function GET() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  if (!clientId) {
    return new NextResponse(
      "아직 준비 중입니다 — OAuth 클라이언트 등록 후 다시 시도해 주세요.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: OAUTH_REDIRECT_URI,
    response_type: "code",
    scope: OAUTH_SCOPE,
    access_type: "offline",
    prompt: "consent",
    login_hint: "jw.jeong@likelion.net",
  });
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

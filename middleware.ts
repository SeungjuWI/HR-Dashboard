import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

export function middleware(req: NextRequest) {
  if (req.cookies.get(AUTH_COOKIE)?.value === authToken()) {
    return NextResponse.next();
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // 로그인 화면·인증 API·OAuth 동의(시트 소유자가 외부에서 접근)·정적 자산은 게이트 제외
  matcher: ["/((?!login|api/login|api/oauth|_next|brand|favicon.ico).*)"],
};

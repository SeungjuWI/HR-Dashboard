// 구글 동의 완료 후 복귀 지점 — 코드를 갱신 토큰으로 교환해 화면에 표시한다.
// 토큰은 서버에 저장하지 않는다: 동의한 본인만 보고, 담당자에게 전달해 Vercel 환경변수로 등록.
import { NextRequest, NextResponse } from "next/server";
import { OAUTH_REDIRECT_URI } from "@/lib/live/oauth";

function page(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="font-family:-apple-system,'Pretendard',sans-serif;max-width:560px;margin:80px auto;padding:0 20px;line-height:1.65;color:#1e1e1e">${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  if (error) {
    return page(
      "동의 취소됨",
      `<h2>동의가 완료되지 않았습니다</h2><p>사유: <code>${error}</code></p><p>다시 진행하려면 받으신 링크를 한 번 더 눌러주세요.</p>`,
      400,
    );
  }
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return page("잘못된 접근", "<h2>잘못된 접근입니다</h2><p>받으신 동의 링크로 다시 시작해 주세요.</p>", 400);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      redirect_uri: OAUTH_REDIRECT_URI,
    }),
  });
  const json = (await res.json()) as { refresh_token?: string; error_description?: string };
  if (!res.ok || !json.refresh_token) {
    return page(
      "발급 실패",
      `<h2>연동 코드 발급에 실패했습니다</h2><p>${json.error_description ?? "알 수 없는 오류"}</p><p>담당자에게 이 화면을 캡처해서 보내주세요.</p>`,
      500,
    );
  }
  return page(
    "동의 완료",
    `<h2>✅ 동의 완료</h2>
<p>마지막 한 가지 — 아래 <b>연동 코드</b>를 복사해서 승주님께 DM으로 보내주세요.</p>
<p style="background:#f6f6f6;border:1px solid #ddd;border-radius:8px;padding:14px 16px;word-break:break-all;font-family:ui-monospace,monospace;font-size:14px">${json.refresh_token}</p>
<p style="color:#666;font-size:14px">허용된 권한은 스프레드시트 <b>읽기 전용</b> 하나이며, 구글 계정 관리 &gt; 보안 &gt; 서드파티 액세스에서 언제든 회수할 수 있습니다. 이 창은 닫으셔도 됩니다.</p>`,
  );
}

// 연동 진단 — ?ids=ID1,ID2 로 넘긴 시트들의 제목·탭 구조를 서비스 계정으로 조회.
// 미들웨어 인증 게이트 뒤에 있고, 읽기 전용 스코프만 사용한다.

import { NextRequest, NextResponse } from "next/server";
import { liveCredentials, sheetMeta } from "@/lib/live/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!liveCredentials()) {
    return NextResponse.json({ error: "service account env missing" }, { status: 200 });
  }
  const ids = (req.nextUrl.searchParams.get("ids") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10);
  const out: Record<string, unknown> = {};
  for (const id of ids) {
    try {
      out[id] = await sheetMeta(id);
    } catch (e) {
      out[id] = { error: String(e).slice(0, 300) };
    }
  }
  return NextResponse.json(out);
}

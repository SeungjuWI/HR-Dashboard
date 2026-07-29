// 연동 상태 점검용 — 로그인한 사람만 접근 가능(미들웨어 게이트 적용됨).
// 캐시를 우회해 시트를 직접 읽어보고, 성공/실패와 행 수를 그대로 보여준다.

import { NextResponse } from "next/server";
import { liveEnabled, fetchPeopleFile } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!liveEnabled()) {
    return NextResponse.json({
      mode: "snapshot",
      envMissing: ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_KEY", "HR_SHEET_ID_PEOPLE"].filter(
        (k) => !process.env[k],
      ),
      snapshotBaseline: { roster: 119, leavers: 157, monthlyHeadcount: 36 },
    });
  }
  try {
    const live = await fetchPeopleFile();
    return NextResponse.json({
      mode: "live",
      counts: {
        roster: live.roster?.length ?? 0,
        leavers: live.leavers?.length ?? 0,
        monthlyHeadcount: live.monthlyHeadcount?.length ?? 0,
      },
      snapshotBaseline: { roster: 119, leavers: 157, monthlyHeadcount: 36 },
      note: "counts가 실제 시트 행 수와 맞는지 확인하세요. 페이지 반영은 최대 10분(캐시).",
    });
  } catch (e) {
    return NextResponse.json(
      { mode: "live-error", error: String(e), hint: "탭 이름/시트 ID/서비스 계정 공유 여부를 확인하세요. 사이트는 스냅샷으로 폴백 중." },
      { status: 200 },
    );
  }
}

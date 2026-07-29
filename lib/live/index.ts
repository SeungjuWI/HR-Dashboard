// 라이브 모드 스위치 — 환경변수가 갖춰지면 실제 시트를 읽어 스냅샷 위에 덮어쓴다.
// 1차 범위: 인원_퇴직 시트 (구성원 정보, 2024~2026 퇴사, 월별 인원) + 현원 파생 집계.
// 채용/리뷰 시트는 실제 시트 구조 확인 후 같은 패턴으로 확장한다.
//
// 필요 환경변수:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_SERVICE_ACCOUNT_KEY  (진우님이 받을 키)
//   HR_SHEET_ID_PEOPLE  ([HR] 인원_퇴직 시트의 스프레드시트 ID)

import { unstable_cache } from "next/cache";
import type { DashboardData } from "../data";
import { liveCredentials, sheetValues } from "./google";
import { parseRoster, parseLeavers, parseMonthlyHeadcount, rosterAggregates } from "./parse";

export function liveEnabled(): boolean {
  return Boolean(liveCredentials() && process.env.HR_SHEET_ID_PEOPLE);
}

export async function fetchPeopleFile(): Promise<Partial<DashboardData>> {
  const id = process.env.HR_SHEET_ID_PEOPLE!;
  const [rosterRows, l26, l25, l24, monthly] = await sheetValues(id, [
    "구성원 정보!A2:F",
    "2026 퇴사 데이터!A2:L",
    "2025 퇴사 데이터!A2:L",
    "2024 퇴사 데이터!A2:K",
    "월별 인원 데이터!A2:E",
  ]);
  const roster = parseRoster(rosterRows);
  const leavers = [...parseLeavers(l26), ...parseLeavers(l25), ...parseLeavers(l24)].sort(
    (a, b) => (a.left < b.left ? 1 : -1),
  );
  if (roster.length === 0) throw new Error("live roster empty — 시트 범위/권한 확인 필요");
  return {
    roster,
    leavers,
    monthlyHeadcount: parseMonthlyHeadcount(monthly),
    ...rosterAggregates(roster),
  };
}

/* 10분 캐시 — 시트 수정 후 최대 10분 안에 대시보드 반영 */
const cachedPeople = unstable_cache(fetchPeopleFile, ["live-people"], { revalidate: 600 });

export async function liveOverlay(base: DashboardData): Promise<DashboardData> {
  const live = await cachedPeople();
  return { ...base, ...live, snapshotDate: new Date().toISOString().slice(0, 10) };
}

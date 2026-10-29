// 라이브 모드 스위치 — 환경변수가 갖춰지면 실제 시트를 읽어 스냅샷 위에 덮어쓴다.
// 1차 범위: 인원_퇴직 시트 (구성원 정보, 2024~2026 퇴사, 월별 인원) + 현원 파생 집계.
// 채용/리뷰 시트는 실제 시트 구조 확인 후 같은 패턴으로 확장한다.
//
// 필요 환경변수:
//   인증(둘 중 하나): GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN (시트 소유자 동의 — 우선)
//                    또는 GOOGLE_SERVICE_ACCOUNT_EMAIL/KEY (시트에 공유 필요)
//   HR_SHEET_ID_PEOPLE  ([HR] 인원_퇴직 시트의 스프레드시트 ID)

import { unstable_cache } from "next/cache";
import type { DashboardData } from "../data";
import { liveCredentials, oauthCredentials, sheetValues } from "./google";
import { parseRoster, parseLeavers, parseMonthlyHeadcount, parseRateMap } from "./parse";
import { activeRoster, rosterAggregates } from "../derive";

export function liveEnabled(): boolean {
  return Boolean((oauthCredentials() ?? liveCredentials()) && process.env.HR_SHEET_ID_PEOPLE);
}

/* 라이브 모드에서 빠져 있는 환경변수 — 진단 API가 그대로 보여준다 */
export function missingEnv(): string[] {
  const sheet = process.env.HR_SHEET_ID_PEOPLE ? [] : ["HR_SHEET_ID_PEOPLE"];
  if (oauthCredentials() || liveCredentials()) return sheet;
  const oauth = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REFRESH_TOKEN"];
  const svc = ["GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_KEY"];
  // 인증은 OAuth(권장) 또는 서비스 계정 둘 중 하나만 갖추면 된다 — 덜 빠진 쪽을 안내한다.
  const missOauth = oauth.filter((k) => !process.env[k]);
  const missSvc = svc.filter((k) => !process.env[k]);
  return [...sheet, ...(missOauth.length <= missSvc.length ? missOauth : missSvc)];
}

export async function fetchPeopleFile(): Promise<Partial<DashboardData>> {
  const id = process.env.HR_SHEET_ID_PEOPLE!;
  const [rosterRows, l26, l25, l24, monthly, rateRows] = await sheetValues(id, [
    "구성원 정보!A2:F",
    "2026 퇴사 데이터!A2:L",
    "2025 퇴사 데이터!A2:L",
    "2024 퇴사 데이터!A2:K",
    "월별 인원 데이터!A2:E",
    "퇴직률 시트!A2:F",
  ]);
  const sheetRoster = parseRoster(rosterRows);
  const leavers = [...parseLeavers(l26), ...parseLeavers(l25), ...parseLeavers(l24)].sort(
    (a, b) => (a.left < b.left ? 1 : -1),
  );
  if (sheetRoster.length === 0) throw new Error("live roster empty — 시트 범위/권한 확인 필요");
  // 명부 시트에 남아 있는 기퇴사자를 오늘 기준으로 제외한다 (스냅샷과 동일한 규칙)
  const asOf = new Date().toISOString().slice(0, 10);
  const roster = activeRoster(sheetRoster, leavers, asOf);
  return {
    fetchedAt: new Date().toISOString(), // 캐시 안에서 기록 → 실제 읽은 시각이 유지된다
    roster,
    leavers,
    monthlyHeadcount: parseMonthlyHeadcount(monthly, parseRateMap(rateRows)),
    ...rosterAggregates(roster, asOf),
  };
}

/* 10분 캐시 — 시트 수정 후 최대 10분 안에 대시보드 반영 */
const cachedPeople = unstable_cache(fetchPeopleFile, ["live-people"], { revalidate: 600 });

export async function liveOverlay(base: DashboardData): Promise<DashboardData> {
  const live = await cachedPeople();
  return { ...base, ...live, snapshotDate: new Date().toISOString().slice(0, 10) };
}

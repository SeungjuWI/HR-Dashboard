// 시트 행 → 대시보드 스키마 파서 + 정규화.
// 컬럼 매핑은 2026.07 복제본 구조 기준 — 실제 시트 구조가 다르면 여기만 조정한다.

import type { Person, Leaver, MonthlyHeadcount } from "../data";

/* "2018-05-23" | "2018. 5. 23" | "2018.5.23" → "YYYY-MM-DD" (실패 시 null) */
export function normDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = String(raw).trim().match(/^(\d{4})[.\-/\s]+(\d{1,2})[.\-/\s]+(\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

/* "2025. 1" | "2025-01" → "YYYY-MM" */
export function normMonth(raw: string | undefined): string | null {
  if (!raw) return null;
  const m = String(raw).trim().match(/^(\d{4})[.\-/\s]+(\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

/* 연도별로 표기가 갈리는 조직명 통일 */
const ORG_NORMALIZE: Record<string, string> = {
  "글로벌 신사업 본부": "신사업 본부",
  "국내 신사업 본부": "신사업 본부",
  AI학습연구소: "AI 학습연구소",
  "New Buisness": "New Business",
};
export const normOrg = (org: string): string => ORG_NORMALIZE[org.trim()] ?? org.trim();

/* 구성원 정보: 이름 | 입사일 | 근속년수 | 조직 | 소속 | 고용형태 */
export function parseRoster(rows: string[][]): Person[] {
  return rows
    .filter((r) => r[0]?.trim() && normDate(r[1]))
    .map((r) => ({
      name: r[0].trim(),
      joined: normDate(r[1])!,
      tenure: (r[2] ?? "").trim(),
      org: (r[3] ?? "").trim(),
      type: (r[5] ?? "정규").trim(),
    }));
}

/* 퇴사 데이터: 퇴사자 | 입사일 | 퇴사일 | 근속(년) | 근속 | 부서 | 직책 | 퇴사 사유 | 퇴사 유형 | 계약 유형 | 카테고리 | (소속) */
export function parseLeavers(rows: string[][]): Leaver[] {
  return rows
    .filter((r) => r[0]?.trim() && normDate(r[2]))
    .map((r) => ({
      name: r[0].trim(),
      joined: normDate(r[1]) ?? "",
      left: normDate(r[2])!,
      dept: (r[5] ?? "").trim(),
      contract: (r[9] ?? "").trim() || "정규",
      kind: (r[8] ?? "").trim(),
      reason: (r[7] ?? "").trim(),
    }));
}

/* 월별 인원 데이터: 기준월 | 소속 | 인원 수 | 입사자 | 퇴사자 */
export function parseMonthlyHeadcount(rows: string[][]): MonthlyHeadcount[] {
  return rows
    .filter((r) => normMonth(r[0]) && r[1]?.trim())
    .map((r) => ({
      month: normMonth(r[0])!,
      corp: r[1].trim(),
      headcount: Number(String(r[2]).replace(/[^\d.-]/g, "")) || 0,
      joins: Number(String(r[3]).replace(/[^\d.-]/g, "")) || 0,
      leaves: Number(String(r[4]).replace(/[^\d.-]/g, "")) || 0,
      rate: null,
    }));
}

/* 현원 명부에서 집계 지표를 다시 계산 (라이브 모드에서 정적 집계를 대체) */
export function rosterAggregates(roster: Person[]) {
  const count = (key: (p: Person) => string): [string, number][] => {
    const m = new Map<string, number>();
    roster.forEach((p) => m.set(key(p), (m.get(key(p)) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const months = (joined: string) =>
    (Date.now() - new Date(joined).getTime()) / (1000 * 3600 * 24 * 30.44);
  const buckets: [string, (mo: number) => boolean][] = [
    ["<1년", (mo) => mo < 12],
    ["1~2년", (mo) => mo >= 12 && mo < 24],
    ["2~3년", (mo) => mo >= 24 && mo < 36],
    ["3~4년", (mo) => mo >= 36 && mo < 48],
    ["4년+", (mo) => mo >= 48],
  ];
  return {
    orgHeadcount: count((p) => normOrg(p.org)),
    empType: count((p) => p.type),
    tenureDist: buckets.map(([label, test]) => [
      label,
      roster.filter((p) => test(months(p.joined))).length,
    ]) as [string, number][],
  };
}

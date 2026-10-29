// 시트 행 → 대시보드 스키마 파서 + 정규화.
// 컬럼 매핑은 2026.07 복제본 구조 기준 — 실제 시트 구조가 다르면 여기만 조정한다.

import type { Person, Leaver, MonthlyHeadcount } from "../data";
import { normOrg } from "../derive";

export { normOrg };

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

/* 구성원 정보: 이름 | 입사일 | 근속년수 | 조직 | 소속 | 고용형태 */
export function parseRoster(rows: string[][]): Person[] {
  return rows
    .filter((r) => r[0]?.trim() && normDate(r[1]))
    .map((r) => ({
      name: r[0].trim(),
      joined: normDate(r[1])!,
      tenure: (r[2] ?? "").trim(),
      org: normOrg(r[3] ?? ""),
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

/* 퇴직률 시트: 기준월 | 소속 | 인원 수 | 입사자 | 퇴사자 | 퇴직률("4.27%") → "YYYY-MM|소속" → % */
export function parseRateMap(rows: string[][]): Map<string, number> {
  const map = new Map<string, number>();
  rows.forEach((r) => {
    const month = normMonth(r[0]);
    const rate = parseFloat(String(r[5] ?? "").replace("%", ""));
    if (month && r[1]?.trim() && Number.isFinite(rate)) map.set(`${month}|${r[1].trim()}`, rate);
  });
  return map;
}

/* 월별 인원 데이터: 기준월 | 소속 | 인원 수 | 입사자 | 퇴사자 (rate는 퇴직률 시트에서 병합) */
export function parseMonthlyHeadcount(rows: string[][], rates?: Map<string, number>): MonthlyHeadcount[] {
  return rows
    .filter((r) => normMonth(r[0]) && r[1]?.trim())
    .map((r) => ({
      month: normMonth(r[0])!,
      corp: r[1].trim(),
      headcount: Number(String(r[2]).replace(/[^\d.-]/g, "")) || 0,
      joins: Number(String(r[3]).replace(/[^\d.-]/g, "")) || 0,
      leaves: Number(String(r[4]).replace(/[^\d.-]/g, "")) || 0,
      rate: rates?.get(`${normMonth(r[0])!}|${r[1].trim()}`) ?? null,
    }));
}

/* 현원 집계는 derive.ts의 공통 구현을 그대로 쓴다 (스냅샷/라이브 동일 로직) */
export { rosterAggregates } from "../derive";

// 화면에 쓰이는 요약 수치를 DashboardData에서 파생시킨다.
// 화면 컴포넌트가 숫자를 직접 들고 있으면 라이브 연동 시 차트와 문구가 어긋나므로,
// "한 번 계산해서 여러 화면이 함께 쓰는" 지점을 여기로 모은다.

import type { DashboardData } from "./data";

const last = <T>(a: T[]): T => a[a.length - 1];

/** 값이 가장 큰 연도 — "2025년 63명 최다" 같은 문구를 만들 때 쓴다 */
export function peakYear(years: string[], data: number[]): { year: string; value: number } {
  let i = 0;
  data.forEach((v, k) => {
    if (v > data[i]) i = k;
  });
  return { year: years[i], value: data[i] };
}

/** 연도 라벨을 문장에 쓸 형태로 — "2025" → "2025년", "26 H1" → "26 H1" */
export const yearLabel = (y: string): string => (/^\d{4}$/.test(y) ? `${y}년` : y);

export function overviewKpis(data: DashboardData) {
  const period = last(data.years);
  const hires = last(data.hires);
  const leavers = last(data.leaversYearly);
  const net = last(data.netChange);
  const applicants = last(data.applicants);
  const blindLatest = [...data.blind].reverse().find((v): v is number => v !== null) ?? null;
  const topOrg = data.orgHeadcount[0];
  const under2y = data.tenureDist
    .filter(([label]) => label === "<1년" || label === "1~2년")
    .reduce((s, [, v]) => s + v, 0);

  // 다루는 데이터의 시작 연도 = 가장 오래된 입사/퇴사 기록
  const earliest = [
    ...data.roster.map((r) => r.joined),
    ...data.leavers.map((r) => r.joined),
  ].reduce((min, d) => (d && d < min ? d : min), "9999");

  return {
    period,
    dataFrom: earliest.slice(0, 4),
    dataTo: data.snapshotDate.slice(0, 4),
    headcount: data.roster.length,
    hires,
    hiresPeak: peakYear(data.years, data.hires),
    leavers,
    net,
    applicants,
    applicantsTotal: data.applicants.reduce((s, v) => s + v, 0),
    applicantsPeak: peakYear(data.years, data.applicants),
    jobplanet: last(data.jobplanet),
    blind: blindLatest,
    topOrg,
    under2yPct: data.roster.length ? Math.round((under2y / data.roster.length) * 100) : 0,
  };
}

/** "정규 107명, 인턴 9명, 계약 3명" — 도넛/스택 차트의 스크린리더 설명 */
export const composition = (rows: [string, number][], unit = "명"): string =>
  rows.map(([n, v]) => `${n} ${v}${unit}`).join(", ");

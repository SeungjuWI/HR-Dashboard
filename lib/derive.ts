// 명부 원본 행에서 파생 지표를 계산한다.
// 데이터 소스가 실시간 연동으로 바뀌어도 이 함수들은 그대로 쓰인다.

import type { Person, Leaver } from "./data";

export function countBy<T>(rows: T[], key: (r: T) => string): [string, number][] {
  const m = new Map<string, number>();
  rows.forEach((r) => {
    const k = key(r);
    m.set(k, (m.get(k) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

/* 상위 n개 + 나머지는 "기타"로 접기 */
export function topN(rows: [string, number][], n: number, other = "기타"): [string, number][] {
  if (rows.length <= n) return rows;
  const head = rows.slice(0, n);
  const rest = rows.slice(n).reduce((s, r) => s + r[1], 0);
  return [...head, [other, rest]];
}

/* 현원의 입사 연도 코호트 */
export function joinCohorts(roster: Person[]): [string, number][] {
  const m = new Map<string, number>();
  roster.forEach((p) => {
    const y = p.joined.slice(0, 4);
    m.set(y, (m.get(y) ?? 0) + 1);
  });
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

/* from~to(YYYY-MM, inclusive) 구간의 월별 건수. 라벨은 "25.01" 형식 */
export function monthlySeries(dates: string[], from: string, to: string): [string, number][] {
  const m = new Map<string, number>();
  let [y, mo] = from.split("-").map(Number);
  const [ey, emo] = to.split("-").map(Number);
  while (y < ey || (y === ey && mo <= emo)) {
    m.set(`${y}-${String(mo).padStart(2, "0")}`, 0);
    mo++;
    if (mo > 12) {
      mo = 1;
      y++;
    }
  }
  dates.forEach((d) => {
    const k = d.slice(0, 7);
    if (m.has(k)) m.set(k, (m.get(k) ?? 0) + 1);
  });
  return [...m.entries()].map(([k, v]) => [`${k.slice(2, 4)}.${k.slice(5)}`, v]);
}

const monthsBetween = (a: string, b: string) =>
  (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 3600 * 24 * 30.44);

/* 퇴사 시점 근속 분포 */
export function tenureAtExit(leavers: Leaver[]): [string, number][] {
  const buckets: [string, (mo: number) => boolean][] = [
    ["6개월 미만", (mo) => mo < 6],
    ["6개월~1년", (mo) => mo >= 6 && mo < 12],
    ["1~2년", (mo) => mo >= 12 && mo < 24],
    ["2~3년", (mo) => mo >= 24 && mo < 36],
    ["3년 이상", (mo) => mo >= 36],
  ];
  return buckets.map(([label, test]) => [
    label,
    leavers.filter((l) => test(monthsBetween(l.joined, l.left))).length,
  ]);
}

/* 연도별 자발/비자발 구성 */
export function kindByYear(leavers: Leaver[]): { name: string; rows: [string, number][] }[] {
  const years = [...new Set(leavers.map((l) => l.left.slice(0, 4)))].sort();
  return years.map((y) => {
    const ys = leavers.filter((l) => l.left.startsWith(y));
    return {
      name: y,
      rows: [
        ["자발적", ys.filter((l) => l.kind === "자발적").length],
        ["비자발적", ys.filter((l) => l.kind === "비자발적").length],
      ],
    };
  });
}

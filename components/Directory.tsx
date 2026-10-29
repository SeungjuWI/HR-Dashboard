"use client";

import { useMemo, useState } from "react";
import type { DashboardData, Person, Leaver } from "@/lib/data";

const BADGE: Record<string, string> = {
  정규: "b-reg",
  계약: "b-con",
  인턴: "b-int",
  자발적: "b-vol",
  비자발적: "b-invol",
};

function Badge({ text }: { text: string }) {
  return <span className={`badge ${BADGE[text] ?? ""}`.trim()}>{text}</span>;
}

type Tab = "active" | "left";

/* 탭별 컬럼 정의 — 표 렌더·정렬·CSV가 모두 이 한 곳을 본다 */
const ACTIVE_COLS: { key: string; label: string; get: (r: Person) => string }[] = [
  { key: "name", label: "이름", get: (r) => r.name },
  { key: "org", label: "조직", get: (r) => r.org },
  { key: "type", label: "고용형태", get: (r) => r.type },
  { key: "joined", label: "입사일", get: (r) => r.joined },
  { key: "tenure", label: "근속", get: (r) => r.tenure },
];
const LEFT_COLS: { key: string; label: string; get: (r: Leaver) => string }[] = [
  { key: "name", label: "이름", get: (r) => r.name },
  { key: "dept", label: "부서", get: (r) => r.dept },
  { key: "contract", label: "계약", get: (r) => r.contract },
  { key: "joined", label: "입사일", get: (r) => r.joined },
  { key: "left", label: "퇴사일", get: (r) => r.left },
  { key: "kind", label: "유형", get: (r) => r.kind },
  { key: "reason", label: "사유", get: (r) => r.reason },
];

/* 근속("2년 3개월")은 문자열 비교가 무의미하므로 입사일로 대신 정렬한다 */
const sortValue = (tab: Tab, key: string, row: Person | Leaver): string =>
  tab === "active" && key === "tenure"
    ? (row as Person).joined
    : (tab === "active" ? ACTIVE_COLS : LEFT_COLS).find((c) => c.key === key)!
        .get(row as never);

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const body = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 붙인다
  const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Directory({
  data,
  tall,
  asOf,
}: {
  data: DashboardData;
  tall?: boolean;
  /** 퇴사 "예정" 판정 기준일(YYYY-MM-DD). 서버에서 넘겨받아 hydration 불일치를 피한다 */
  asOf: string;
}) {
  const [tab, setTab] = useState<Tab>("active");
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("전체");
  const [sort, setSort] = useState<{ key: string; asc: boolean }>({ key: "joined", asc: false });
  const query = q.trim().toLowerCase();

  const cols = tab === "active" ? ACTIVE_COLS : LEFT_COLS;
  /* 재직 탭은 고용형태, 퇴사 탭은 자발/비자발로 거른다 */
  const kindOptions = useMemo(() => {
    const src =
      tab === "active"
        ? data.roster.map((r) => r.type)
        : data.leavers.map((r) => r.kind).filter(Boolean);
    return ["전체", ...[...new Set(src)].sort()];
  }, [tab, data.roster, data.leavers]);

  const rows = useMemo(() => {
    const base: (Person | Leaver)[] =
      tab === "active"
        ? data.roster.filter(
            (r) =>
              (kind === "전체" || r.type === kind) &&
              (!query || `${r.name}${r.org}${r.type}`.toLowerCase().includes(query)),
          )
        : data.leavers.filter(
            (r) =>
              (kind === "전체" || r.kind === kind) &&
              (!query || `${r.name}${r.dept}${r.reason}`.toLowerCase().includes(query)),
          );
    return [...base].sort((a, b) => {
      const va = sortValue(tab, sort.key, a);
      const vb = sortValue(tab, sort.key, b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * (sort.asc ? 1 : -1);
    });
  }, [tab, kind, query, sort, data.roster, data.leavers]);

  const switchTab = (next: Tab) => {
    setTab(next);
    setKind("전체");
    setSort({ key: next === "active" ? "joined" : "left", asc: false });
  };

  const toggleSort = (key: string) =>
    setSort((s) => (s.key === key ? { key, asc: !s.asc } : { key, asc: true }));

  const exportCsv = () =>
    downloadCsv(
      `likelion-hr-${tab === "active" ? "roster" : "leavers"}-${data.snapshotDate}.csv`,
      cols.map((c) => c.label),
      rows.map((r) => cols.map((c) => c.get(r as never))),
    );

  const searched = query || kind !== "전체" ? ` · 조건 일치 ${rows.length}명` : "";

  return (
    <div className={`card${tall ? " tall" : ""}`}>
      <div className="dir-bar">
        <div className="tabs" role="tablist" aria-label="재직 상태">
          <button className={`tab${tab === "active" ? " on" : ""}`} role="tab" aria-selected={tab === "active"} onClick={() => switchTab("active")}>
            재직중 <b>{data.roster.length}</b>
          </button>
          <button className={`tab${tab === "left" ? " on" : ""}`} role="tab" aria-selected={tab === "left"} onClick={() => switchTab("left")}>
            퇴사자 <b>{data.leavers.length}</b>
          </button>
        </div>
        <select
          className="dir-sel"
          aria-label={tab === "active" ? "고용형태 필터" : "퇴사 유형 필터"}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          {kindOptions.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
        <input
          className="dir-q"
          type="search"
          placeholder={tab === "active" ? "이름 · 조직 검색" : "이름 · 부서 · 사유 검색"}
          aria-label="구성원 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="dir-csv" type="button" onClick={exportCsv}>
          CSV 내보내기
        </button>
      </div>
      <div className="tbl-wrap">
        <table className="dir-tbl" aria-label={tab === "active" ? "재직중 구성원 명부" : "퇴사자 명부"}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th
                  key={c.key}
                  aria-sort={sort.key === c.key ? (sort.asc ? "ascending" : "descending") : "none"}
                >
                  <button type="button" className="th-sort" onClick={() => toggleSort(c.key)}>
                    {c.label}
                    <span className="th-arrow" aria-hidden="true">
                      {sort.key === c.key ? (sort.asc ? "▲" : "▼") : "↕"}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab === "active"
              ? (rows as Person[]).map((r, i) => (
                  <tr key={r.name + r.joined + i}>
                    <td className="nm">{r.name}</td>
                    <td>{r.org}</td>
                    <td><Badge text={r.type} /></td>
                    <td className="mn">{r.joined}</td>
                    <td className="mn">{r.tenure}</td>
                  </tr>
                ))
              : (rows as Leaver[]).map((r, i) => (
                  <tr key={r.name + r.left + i}>
                    <td className="nm">
                      {r.name}
                      {r.left > asOf && <> <span className="badge b-plan">예정</span></>}
                    </td>
                    <td>{r.dept}</td>
                    <td><Badge text={r.contract} /></td>
                    <td className="mn">{r.joined}</td>
                    <td className="mn">{r.left}</td>
                    <td><Badge text={r.kind} /></td>
                    <td className="rs">{r.reason || "—"}</td>
                  </tr>
                ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="dir-empty">조건에 맞는 인원이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="dir-note">
        {tab === "active"
          ? `구성원 정보 시트 · ${data.snapshotDate.replace(/-/g, ".")} 기준${searched}`
          : `퇴사 데이터 시트 · 퇴사 예정 포함${searched}`}
      </p>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/data";

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

export default function Directory({ data, tall }: { data: DashboardData; tall?: boolean }) {
  const [tab, setTab] = useState<"active" | "left">("active");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const activeRows = useMemo(
    () => data.roster.filter((r) => !query || `${r.name}${r.org}`.toLowerCase().includes(query)),
    [data.roster, query],
  );
  const leftRows = useMemo(
    () => data.leavers.filter((r) => !query || `${r.name}${r.dept}${r.reason}`.toLowerCase().includes(query)),
    [data.leavers, query],
  );

  const searched = query
    ? ` · 검색 결과 ${(tab === "active" ? activeRows : leftRows).length}명`
    : "";

  return (
    <div className={`card${tall ? " tall" : ""}`}>
      <div className="dir-bar">
        <div className="tabs" role="tablist" aria-label="재직 상태">
          <button className={`tab${tab === "active" ? " on" : ""}`} role="tab" aria-selected={tab === "active"} onClick={() => setTab("active")}>
            재직중 <b>{data.roster.length}</b>
          </button>
          <button className={`tab${tab === "left" ? " on" : ""}`} role="tab" aria-selected={tab === "left"} onClick={() => setTab("left")}>
            퇴사자 <b>{data.leavers.length}</b>
          </button>
        </div>
        <input
          className="dir-q"
          type="search"
          placeholder="이름 · 조직 검색"
          aria-label="구성원 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="tbl-wrap">
        {tab === "active" ? (
          <table className="dir-tbl" aria-label="재직중 구성원 명부">
            <thead>
              <tr><th>이름</th><th>조직</th><th>고용형태</th><th>입사일</th><th>근속</th></tr>
            </thead>
            <tbody>
              {activeRows.map((r, i) => (
                <tr key={r.name + i}>
                  <td className="nm">{r.name}</td>
                  <td>{r.org}</td>
                  <td><Badge text={r.type} /></td>
                  <td className="mn">{r.joined}</td>
                  <td className="mn">{r.tenure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="dir-tbl" aria-label="퇴사자 명부">
            <thead>
              <tr><th>이름</th><th>부서</th><th>계약</th><th>입사일</th><th>퇴사일</th><th>유형</th><th>사유</th></tr>
            </thead>
            <tbody>
              {leftRows.map((r, i) => (
                <tr key={r.name + r.left + i}>
                  <td className="nm">
                    {r.name}
                    {r.left > data.snapshotDate && <> <span className="badge b-plan">예정</span></>}
                  </td>
                  <td>{r.dept}</td>
                  <td><Badge text={r.contract} /></td>
                  <td className="mn">{r.joined}</td>
                  <td className="mn">{r.left}</td>
                  <td><Badge text={r.kind} /></td>
                  <td className="rs">{r.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="dir-note">
        {tab === "active"
          ? `구성원 정보 시트 · 2026.07.29 스냅샷${searched}`
          : `2024~2026 퇴사 시트 · 퇴사 예정 포함${searched}`}
      </p>
    </div>
  );
}

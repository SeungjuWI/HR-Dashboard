"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Reveal } from "./motion";

const TABS: [string, string][] = [
  ["/", "홈"],
  ["/people", "인원"],
  ["/directory", "구성원"],
  ["/recruiting", "채용"],
  ["/attrition", "퇴직"],
  ["/reputation", "평판"],
  ["/reviews", "리뷰"],
];

/* ISO 시각 → KST "2026.07.29 20:14" — 서버/클라이언트 동일 출력이라 hydration 안전 */
function fmtKST(iso: string): string {
  return new Date(iso)
    .toLocaleString("sv-SE", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(/-/g, ".");
}

export function CommandBar({ fetchedAt, snapshotDate }: { fetchedAt?: string; snapshotDate: string }) {
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <header className="bar">
      <Link href="/" className="lockup">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="멋쟁이사자처럼" />
        <span className="hr-tag">HR</span>
      </Link>
      <nav aria-label="페이지 이동">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? "on" : ""}>
            {label}
          </Link>
        ))}
      </nav>
      <div
        className="status"
        title={
          fetchedAt
            ? "시트에서 마지막으로 읽은 시각 (KST) — 10분마다 자동 갱신"
            : "정적 스냅샷 데이터 기준일"
        }
      >
        <span className="dot" />
        {fetchedAt ? <>LIVE&nbsp;{fmtKST(fetchedAt)}</> : <>SNAPSHOT&nbsp;{snapshotDate.replace(/-/g, ".")}</>}
      </div>
    </header>
  );
}

export function PageHead({ eyebrow, title, desc }: { eyebrow: string; title: string; desc?: string }) {
  return (
    <div className="page-head">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {desc && <p className="page-desc">{desc}</p>}
    </div>
  );
}

export function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <Reveal className="sec-head">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <div className="rule" />
    </Reveal>
  );
}

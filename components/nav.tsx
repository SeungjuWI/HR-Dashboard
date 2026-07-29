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

export function CommandBar() {
  const path = usePathname();
  if (path === "/login") return null;
  return (
    <header className="bar">
      <Link href="/" className="lockup">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.png" alt="LIKELION" />
        <span className="hr-tag">HR</span>
      </Link>
      <nav aria-label="페이지 이동">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} className={path === href ? "on" : ""}>
            {label}
          </Link>
        ))}
      </nav>
      <div className="status">
        <span className="dot" />
        SNAPSHOT&nbsp;2026.07.29
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

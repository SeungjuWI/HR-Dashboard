"use client";

import type { DashboardData } from "@/lib/data";
import { countBy, topN, monthlySeries, tenureAtExit, kindByYear } from "@/lib/derive";
import { Reveal } from "@/components/motion";
import { PageHead } from "@/components/nav";
import { VBars, HBars, NetBars, MonthlyBars, StackedHBars } from "@/components/charts";

const KIND_COLOR: Record<string, string> = { 자발적: "var(--c2)", 비자발적: "var(--c5)" };

const MONTHLY_FROM = "2024-01";
const MONTHLY_TO = "2026-09";
const ymLabel = (ym: string) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5))}월`;

export default function AttritionPage({ data }: { data: DashboardData }) {
  const monthly = monthlySeries(data.leavers.map((l) => l.left), MONTHLY_FROM, MONTHLY_TO);
  const lastYear = data.years[data.years.length - 1];
  const lastNet = data.netChange[data.netChange.length - 1];
  const prevNet = data.netChange[data.netChange.length - 2];
  const fmtNet = (v: number) => (v > 0 ? `+${v}` : `${v}`.replace("-", "−"));
  const reasons = topN(countBy(data.leavers, (l) => l.reason || "미기재"), 9);
  const depts = topN(countBy(data.leavers, (l) => l.dept), 8);
  const exitTenure = tenureAtExit(data.leavers);
  const kinds = kindByYear(data.leavers);
  return (
    <>
      <PageHead eyebrow="Attrition" title="퇴직 · 리텐션"
        desc={`2024~2026 퇴사 데이터 ${data.leavers.length}건 상세 — 사유, 부서, 근속 시점, 자발/비자발. 퇴사 예정 인원 포함.`} />
      <section className="block" style={{ marginTop: 24 }}>
        <div className="grid g-attrition">
          <Reveal className="card" grow>
            <h3>월별 퇴사 추이 <span className="h-tag">{MONTHLY_FROM.replace("-", ".")} – {MONTHLY_TO.replace("-", ".")}</span></h3>
            <p className="note">퇴사일 기준 · 기준일 이후는 확정된 퇴사 예정</p>
            <figure>
              <MonthlyBars rows={monthly} w={480} h={200} color="var(--c2)"
                label={`${ymLabel(MONTHLY_FROM)}부터 ${ymLabel(MONTHLY_TO)}까지 월별 퇴사 인원`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>퇴사 사유</h3>
            <p className="note">2024~2026 퇴사 {data.leavers.length}건 · 시트 기재 기준</p>
            <figure>
              <HBars rows={reasons} w={480} h={266} labW={130} unit="건" color="var(--c2)"
                label={`퇴사 사유별 인원. ${reasons.slice(0, 3).map(([n, v]) => `${n} ${v}건`).join(", ")} 순`} />
            </figure>
          </Reveal>
        </div>
        <div className="grid g-recruit" style={{ marginTop: 14 }}>
          <Reveal className="card" grow>
            <h3>자발 vs 비자발</h3>
            <p className="note">퇴사 유형 연도별 구성</p>
            <div className="legend">
              {Object.entries(KIND_COLOR).map(([name, color]) => (
                <span key={name}><i style={{ background: color }} />{name}</span>
              ))}
            </div>
            <figure>
              <StackedHBars groups={kinds} colorMap={KIND_COLOR} w={340} h={120}
                label="연도별 자발적 비자발적 퇴사 구성" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>부서별 퇴사</h3>
            <p className="note">퇴사 시트의 구 조직명 체계 기준</p>
            <figure>
              <HBars rows={depts} w={280} h={240} labW={110} unit="명" color="var(--c2)"
                label="부서별 퇴사 인원" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.16} grow>
            <h3>퇴사 시점 근속</h3>
            <p className="note">입사일~퇴사일 계산</p>
            <figure>
              <VBars labels={exitTenure.map((r) => r[0])} data={exitTenure.map((r) => r[1])}
                w={280} h={240} unit="명" color="var(--c2)"
                label="퇴사자의 퇴사 시점 근속 분포" />
            </figure>
          </Reveal>
        </div>
        <div className="grid g-attrition" style={{ marginTop: 14 }}>
          <Reveal className="card" grow>
            <h3>연도별 퇴사자</h3>
            <p className="note">퇴사자명단 시트 · 2026은 상반기</p>
            <figure>
              <VBars labels={data.years} data={data.leaversYearly} w={480} h={200} unit="명" color="var(--c2)"
                label={`연도별 퇴사자 막대 차트. ${data.years.map((y, i) => `${y} ${data.leaversYearly[i]}명`).join(", ")}`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>인원 순증감 <span className="h-tag">입사 − 퇴사</span></h3>
            <p className="note">{lastNet < 0 ? `${lastYear}은 처음으로 순감소 전환` : `${lastYear} 순증감 ${fmtNet(lastNet)}명`}</p>
            <figure>
              <NetBars labels={data.years} data={data.netChange} w={480} h={200}
                label={`연도별 인원 순증감 차트. ${data.years[data.years.length - 2]} ${fmtNet(prevNet)}명에서 ${lastYear} ${fmtNet(lastNet)}명`} />
            </figure>
          </Reveal>
        </div>
      </section>
    </>
  );
}

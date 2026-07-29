"use client";

import type { DashboardData } from "@/lib/data";
import { joinCohorts, monthlySeries } from "@/lib/derive";
import { Reveal } from "@/components/motion";
import { PageHead } from "@/components/nav";
import { VBars, HBars, Donut, MonthlyBars, TrendLine } from "@/components/charts";

export default function PeoplePage({ data }: { data: DashboardData }) {
  const cohorts = joinCohorts(data.roster);
  const recentJoins = monthlySeries(
    data.roster.map((r) => r.joined),
    "2025-08",
    "2026-07",
  );
  const mssHeadcount = data.monthlyHeadcount.filter((r) => r.corp === "멋쟁이사자처럼");
  const mssRate = mssHeadcount.filter((r) => r.rate !== null);
  return (
    <>
      <PageHead eyebrow="People" title="인원 현황"
        desc="구성원 정보 시트 기준 현원 구성 — 조직, 고용형태, 근속, 입사 코호트." />
      <section className="block" style={{ marginTop: 24 }}>
        <div className="grid g-people">
          <Reveal className="card" grow>
            <h3>조직별 현원</h3>
            <p className="note">조직명 정규화 적용 · 12개 조직</p>
            <figure>
              <HBars rows={data.orgHeadcount} w={520} h={336} labW={150} unit="명"
                label="조직별 현원 가로 막대 차트. IT Lab 28명부터 LIKELION 2명까지 12개 조직" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>고용형태</h3>
            <p className="note">정규 · 인턴 · 계약</p>
            <div className="legend">
              {data.empType.map(([name, v], i) => (
                <span key={name}><i style={{ background: `var(--c${i + 1})` }} />{name} <b>{v}</b></span>
              ))}
            </div>
            <figure>
              <Donut rows={data.empType.map(([n, v], i) => [n, v, `var(--c${i + 1})`])}
                label="고용형태 도넛 차트. 정규 107명, 인턴 9명, 계약 3명" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.16} grow>
            <h3>근속 분포</h3>
            <p className="note">현원 119명 중 <b>60%가 근속 2년 미만</b></p>
            <figure>
              <VBars labels={data.tenureDist.map((r) => r[0])} data={data.tenureDist.map((r) => r[1])}
                w={220} h={190} unit="명" label="근속 분포 막대 차트. 1년 미만 45명이 최다" />
            </figure>
          </Reveal>
        </div>
        <div className="grid g-attrition" style={{ marginTop: 14 }}>
          <Reveal className="card" grow>
            <h3>입사 연도 코호트</h3>
            <p className="note">현원 기준 — 각 연도 입사자 중 아직 재직 중인 인원</p>
            <figure>
              <VBars labels={cohorts.map((r) => r[0].slice(2))} data={cohorts.map((r) => r[1])}
                w={480} h={200} unit="명" label="현원의 입사 연도 분포" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>월별 입사 <span className="h-tag">최근 12개월</span></h3>
            <p className="note">현원 기준 (해당 기간 입사 후 퇴사자는 제외)</p>
            <figure>
              <MonthlyBars rows={recentJoins} w={480} h={200} label="최근 12개월 월별 입사 인원" />
            </figure>
          </Reveal>
        </div>
        <div className="grid g-attrition" style={{ marginTop: 14 }}>
          <Reveal className="card" grow>
            <h3>월별 현원 추이 <span className="h-tag">멋쟁이사자처럼 법인</span></h3>
            <p className="note">월별 인원 데이터 시트 · 2025.01 ~ 2026.06</p>
            <figure>
              <TrendLine points={mssHeadcount.map((r) => [r.month.slice(2).replace("-", "."), r.headcount])}
                w={480} h={200} unit="명" label="월별 현원 추이. 2025년 1월 103명에서 증감" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>월별 퇴직률 <span className="h-tag">%</span></h3>
            <p className="note">퇴직률 시트 · 월별 인원 시트와 모수 차이 있음(시트 정합성 이슈)</p>
            <figure>
              <TrendLine points={mssRate.map((r) => [r.month.slice(2).replace("-", "."), r.rate as number])}
                w={480} h={200} unit="%" dec={1} color="var(--c2)" label="월별 퇴직률 추이" />
            </figure>
          </Reveal>
        </div>
      </section>
    </>
  );
}

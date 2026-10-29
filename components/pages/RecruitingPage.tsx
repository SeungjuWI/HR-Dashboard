"use client";

import Link from "next/link";
import type { DashboardData } from "@/lib/data";
import { surveyRows, surveyAverages } from "@/lib/reviews";
import { peakYear, yearLabel } from "@/lib/kpi";
import { Reveal } from "@/components/motion";
import { PageHead } from "@/components/nav";
import { VBars, StackedHBars, FunnelList } from "@/components/charts";

const CHANNEL_COLOR: Record<string, string> = {
  원티드: "var(--c1)",
  채용사이트: "var(--c2)",
  서치펌: "var(--c4)",
  "KDT 수료생": "var(--c3)",
  기타: "var(--muted-bar)",
};

export default function RecruitingPage({ data }: { data: DashboardData }) {
  const conversion = data.applicants.map((a, i) =>
    Math.round((data.hires[i] / a) * 1000) / 10,
  );
  const applicantPeak = peakYear(data.years, data.applicants);
  const hirePeak = peakYear(data.years, data.hires);
  const convPeak = peakYear(data.years, conversion);
  const hires2025 = data.hires[data.years.indexOf("2025")] ?? 0;
  const totalApplicants = data.applicants.reduce((s, v) => s + v, 0);
  return (
    <>
      <PageHead eyebrow="Recruiting" title="채용"
        desc={`${data.years[0]}~2026 지원자 ${totalApplicants.toLocaleString("ko-KR")}건과 입사자명단 기준 실적 — 채용 실적의 신뢰 소스는 입사자명단 시트.`} />
      <section className="block" style={{ marginTop: 24 }}>
        <div className="grid g-recruit">
          <Reveal className="card" grow>
            <h3>연도별 지원자</h3>
            <p className="note">지원자 시트 4개년 · 2026은 상반기</p>
            <figure>
              <VBars labels={data.years} data={data.applicants} w={340} h={200} unit="명"
                label={`연도별 지원자 막대 차트. ${yearLabel(applicantPeak.year)} ${applicantPeak.value.toLocaleString("ko-KR")}명 최다`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>연도별 입사자</h3>
            <p className="note">입사자명단 기준 (신뢰 소스)</p>
            <figure>
              <VBars labels={data.years} data={data.hires} w={280} h={200} unit="명"
                label={`연도별 입사자 막대 차트. ${yearLabel(hirePeak.year)} ${hirePeak.value}명 최다`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.16} grow>
            <h3>지원 → 입사 전환율</h3>
            <p className="note">입사자 ÷ 지원자 · %</p>
            <figure>
              <VBars labels={data.years} data={conversion} w={280} h={200} unit="%" color="var(--c3)"
                label={`연도별 지원 대비 입사 전환율. ${yearLabel(convPeak.year)} ${convPeak.value}% 최고`} />
            </figure>
          </Reveal>
        </div>
        <div className="grid g-attrition" style={{ marginTop: 14 }}>
          <Reveal className="card" grow>
            <h3>지원 경로</h3>
            <p className="note">연도별 유입 채널 구성 · 2026 채용홈페이지는 채용사이트로 통합 표기</p>
            <div className="legend">
              {Object.entries(CHANNEL_COLOR).map(([name, color]) => (
                <span key={name}><i style={{ background: color }} />{name}</span>
              ))}
            </div>
            <figure>
              <StackedHBars groups={data.channelsByYear} colorMap={CHANNEL_COLOR} w={480} h={190}
                label="연도별 지원 경로 누적 막대. 매년 원티드가 80% 안팎" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>채용수수료</h3>
            <p className="note">백만원 · 환급 반영 전 · 2025는 원티드 정액제 ₩44M 포함, 2026 상반기는 정액제 효과로 ₩0 다수</p>
            <figure>
              <VBars labels={data.years} data={data.feesMillions} w={480} h={186} unit="백만원" color="var(--c4)"
                label="연도별 채용수수료 막대 차트. 2023년 1억 5,600만원 최다" />
            </figure>
          </Reveal>
        </div>
        <Reveal className="card" style={{ marginTop: 14 }}>
          <div className="h-row">
            <h3>면접 경험 설문 <span className="h-tag">채용 프로세스 피드백 · 5점 만점</span></h3>
            <Link className="more" href="/reviews">응답 원문 보기 →</Link>
          </div>
          <p className="note">
            2023.12 ~ 2026.06 응답 {surveyRows.length}건 · 코멘트 {surveyRows.filter((r) => r.comment).length}건
          </p>
          <div className="legend" style={{ gap: 8, marginBottom: 0 }}>
            {surveyAverages(["만족도", "포지션 평균", "안내 평균", "진행 평균", "질문 적절성", "입사 의향"]).map(([k, v]) => (
              <span className="score-chip" key={k}>{k} <b>{v.toFixed(2)}</b></span>
            ))}
          </div>
        </Reveal>
        <Reveal className="card" style={{ marginTop: 14 }}>
          <h3>2025 기록 퍼널 <span className="h-tag">참고용</span></h3>
          <p className="note">
            지원자 시트에 <b>기록된</b> 단계만 집계한 값입니다 — 대부분의 지원 건은 단계가 비어 있어,
            실제 2025년 입사는 <b>{hires2025}명</b>입니다. 실시간 연동 전 시트의 퍼널 기록 보완을 권장합니다.
          </p>
          <FunnelList rows={data.funnel2025} />
        </Reveal>
      </section>
    </>
  );
}

"use client";

import Link from "next/link";
import type { DashboardData } from "@/lib/data";
import {
  quarterlyRating, jobplanetReviews, blindReviews, interviewReviews, surveyRows, monthlyRating,
} from "@/lib/reviews";
import { Reveal } from "@/components/motion";
import { PageHead } from "@/components/nav";
import { VBars, HBars, Donut, RatingLine, Radar, TrendLine } from "@/components/charts";

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
/* 1~5점 분포에서 건수·가중평균·최빈 점수를 뽑는다 */
function distStats(dist: number[]) {
  const count = sum(dist);
  const avg = count ? sum(dist.map((v, i) => v * (i + 1))) / count : 0;
  const topIdx = dist.reduce((best, v, i) => (v > dist[best] ? i : best), 0);
  return { count, avg, topScore: topIdx + 1, topCount: dist[topIdx] };
}
/* [["긍정적", 43], ...] → 최상위 항목 + 비중 */
const share = (rows: [string, number][], name: string) => {
  const total = sum(rows.map((r) => r[1]));
  const hit = rows.find((r) => r[0] === name);
  return total && hit ? Math.round((hit[1] / total) * 100) : 0;
};
const listLabel = (rows: [string, number][], n = 2, unit = "건") =>
  rows.slice(0, n).map(([k, v]) => `${k} ${v}${unit}`).join(", ");

export default function ReputationPage({ data }: { data: DashboardData }) {
  const stars = ["1점", "2점", "3점", "4점", "5점"];
  const quarterly = quarterlyRating();
  // "24Q3" → "2024년 3분기"
  const qText = (label: string) => `20${label.slice(0, 2)}년 ${label.slice(3)}분기`;
  const qFrom = qText(quarterly[0][0]);
  const qTo = qText(quarterly[quarterly.length - 1][0]);
  const jp = distStats(data.ratingDist.jobplanet);
  const bl = distStats(data.ratingDist.blind);
  const radarTop = [...data.radar].sort((a, b) => b[1] - a[1]);
  const jobsTotal = sum(data.jpJobs.map((r) => r[1]));
  return (
    <>
      <PageHead eyebrow="Reputation" title="평판"
        desc={`잡플래닛 리뷰 ${jobplanetReviews.length}건 · 블라인드 ${blindReviews.length}건 · 면접 리뷰 ${interviewReviews.length}건 — 평점, 항목, 분포, 업계 비교, 면접 경험.`} />
      <section className="block" style={{ marginTop: 24 }}>
        <div className="grid g-attrition" style={{ marginBottom: 14 }}>
          <Reveal className="card" grow>
            <h3>분기별 평점 추이 <span className="h-tag">잡플래닛 평점 데이터 {monthlyRating.length}건</span></h3>
            <p className="note">{qFrom} ~ {qTo} · 분기 내 리뷰 평균 (리뷰 수 적은 분기는 변동 큼)</p>
            <figure>
              <TrendLine points={quarterly} w={480} h={200} dec={1}
                label={`분기별 잡플래닛 평점 추이 ${qFrom}부터 ${qTo}까지`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08}>
            <div className="h-row">
              <h3>리뷰 원문 보기</h3>
              <Link className="more" href="/reviews">리뷰 페이지 →</Link>
            </div>
            <p className="note" style={{ marginBottom: 8 }}>
              집계 뒤에 있는 실제 목소리 — 전체 원문을 평점·키워드로 필터링해서 읽을 수 있습니다.
            </p>
            <div className="legend" style={{ gap: 8 }}>
              <span className="score-chip">잡플래닛 리뷰 <b>{jobplanetReviews.length}</b></span>
              <span className="score-chip">블라인드 <b>{blindReviews.length}</b></span>
              <span className="score-chip">면접 리뷰 <b>{interviewReviews.length}</b></span>
              <span className="score-chip">면접 설문 <b>{surveyRows.length}</b></span>
            </div>
          </Reveal>
        </div>
        <div className="grid g-rep">
          <Reveal className="card" grow>
            <h3>평점 추이</h3>
            <p className="note">연평균 · 블라인드 2026은 리뷰 2건 기준</p>
            <div className="legend">
              <span><i style={{ background: "var(--c1)" }} />잡플래닛</span>
              <span><i style={{ background: "var(--c2)" }} />블라인드</span>
            </div>
            <figure>
              <RatingLine years={data.ratingYears}
                series={[
                  { name: "잡플래닛", data: data.jobplanet, color: "var(--c1)" },
                  { name: "블라인드", data: data.blind, color: "var(--c2)" },
                ]}
                label="잡플래닛과 블라인드 연도별 평점 추이 선 차트" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>항목별 평점</h3>
            <p className="note">잡플래닛 5개 항목 · 5점 만점</p>
            <figure>
              <Radar rows={data.radar}
                label={`항목별 평점 레이더 차트. ${radarTop[0][0]} ${radarTop[0][1].toFixed(2)} 최고, ${radarTop[radarTop.length - 1][0]} ${radarTop[radarTop.length - 1][1].toFixed(2)} 최저`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.16} grow>
            <h3>업계 비교 <span className="h-tag">잡플래닛</span></h3>
            <p className="note">부트캠프 5개사 총점</p>
            <figure>
              <HBars rows={data.competitors} w={240} h={210} labW={104} focus="멋쟁이사자처럼"
                fmt={(v) => v.toFixed(1)} label="잡플래닛 기준 경쟁사 평점 비교. 코드잇 4.3 최고" />
            </figure>
          </Reveal>
        </div>
        <div className="grid g-recruit" style={{ marginTop: 14 }}>
          <Reveal className="card" grow>
            <h3>평점 분포 <span className="h-tag">잡플래닛</span></h3>
            <p className="note">리뷰 {jp.count}건 · 평균 {jp.avg.toFixed(2)}</p>
            <figure>
              <VBars labels={stars} data={data.ratingDist.jobplanet} w={340} h={190} unit="건"
                label={`잡플래닛 총점 분포. ${jp.topScore}점 ${jp.topCount}건 최다`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>평점 분포 <span className="h-tag">블라인드</span></h3>
            <p className="note">리뷰 {bl.count}건 · 평균 {bl.avg.toFixed(2)}</p>
            <figure>
              <VBars labels={stars} data={data.ratingDist.blind} w={280} h={190} unit="건" color="var(--c2)"
                label={`블라인드 총점 분포. ${bl.topScore}점 ${bl.topCount}건 최다`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.16} grow>
            <h3>업계 비교 <span className="h-tag">블라인드</span></h3>
            <p className="note">블라인드 총점 기준</p>
            <figure>
              <HBars rows={data.blindCompetitors} w={280} h={190} labW={104} focus="멋쟁이사자처럼"
                fmt={(v) => v.toFixed(1)} label="블라인드 기준 경쟁사 평점 비교. 코드잇 4.5 최고" />
            </figure>
          </Reveal>
        </div>
        <div className="grid g-recruit" style={{ marginTop: 14 }}>
          <Reveal className="card" grow>
            <h3>면접 결과 <span className="h-tag">잡플래닛 면접 리뷰</span></h3>
            <p className="note">리뷰 {sum(data.interview.result.map((r) => r[1]))}건 응답 기준</p>
            <figure>
              <HBars rows={data.interview.result} w={340} h={172} labW={110} unit="건"
                label={`면접 리뷰 결과 분포. ${listLabel(data.interview.result)}`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>면접 난이도</h3>
            <p className="note">리뷰별 응답 필드 상이</p>
            <figure>
              <HBars rows={data.interview.difficulty} w={280} h={172} labW={70} unit="건"
                label={`면접 난이도 분포. ${listLabel(data.interview.difficulty, 1)} 최다`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.16} grow>
            <h3>면접 경험</h3>
            <p className="note">
              긍정 {share(data.interview.experience, "긍정적")}% · 부정 {share(data.interview.experience, "부정적")}%
            </p>
            <figure>
              <HBars rows={data.interview.experience} w={280} h={172} labW={70} unit="건"
                label={`면접 경험 분포. ${listLabel(data.interview.experience, 1)} 최다`} />
            </figure>
          </Reveal>
        </div>
        <div className="grid g-attrition" style={{ marginTop: 14 }}>
          <Reveal className="card" grow>
            <h3>직무별 리뷰 <span className="h-tag">잡플래닛</span></h3>
            <p className="note">
              {data.jpJobs[0][0]} 직군 리뷰가 {Math.round((data.jpJobs[0][1] / jobsTotal) * 100)}% — 평판 관리의 중심 직군
            </p>
            <figure>
              <HBars rows={data.jpJobs} w={480} h={220} labW={130} unit="건"
                label={`직무별 리뷰 수. ${listLabel(data.jpJobs, 1)} 최다`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.08} grow>
            <h3>리뷰 작성자 재직 상태 <span className="h-tag">잡플래닛</span></h3>
            <p className="note">현직원과 전직원 리뷰가 반반 — 양쪽 시선이 고르게 반영</p>
            <div className="legend">
              {data.jpStatus.map(([name, v], i) => (
                <span key={name}><i style={{ background: `var(--c${i + 1})` }} />{name} <b>{v}</b></span>
              ))}
            </div>
            <figure>
              <Donut rows={data.jpStatus.map(([n, v], i) => [n, v, `var(--c${i + 1})`])}
                label={`리뷰 작성자 재직 상태. ${data.jpStatus.map(([n, v]) => `${n} ${v}건`).join(", ")}`} />
            </figure>
          </Reveal>
        </div>
      </section>
    </>
  );
}

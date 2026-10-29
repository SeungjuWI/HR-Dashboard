"use client";

import Link from "next/link";
import type { DashboardData } from "@/lib/data";
import { overviewKpis, composition, yearLabel } from "@/lib/kpi";
import { Reveal, CountUp } from "@/components/motion";
import { Spark, VBars, Donut, NetBars, RatingLine } from "@/components/charts";

function CardHead({ title, href, note }: { title: string; href: string; note?: string }) {
  return (
    <>
      <div className="h-row">
        <h3>{title}</h3>
        <Link className="more" href={href}>자세히 →</Link>
      </div>
      {note && <p className="note">{note}</p>}
    </>
  );
}

export default function OverviewPage({ data }: { data: DashboardData }) {
  const k = overviewKpis(data);
  const empComposition = composition(data.empType);
  return (
    <>
      <section className="hero">
        <p className="eyebrow">People Analytics</p>
        <h1>
          멋사 피플 데이터,
          <br />한 화면에서 전부.
        </h1>
        <div className="meta">
          <span className="chip">연결 시트 <b>7</b></span>
          <span className="chip">데이터 기간 <b>{k.dataFrom} – {k.dataTo}</b></span>
          <span className="chip">실시간 연동 {data.fetchedAt ? <b>가동 중</b> : <b>준비 중</b>}</span>
        </div>

        <div className="kpis">
          <Reveal className="kpi" delay={0.05}>
            <div className="k-label">총 현원</div>
            <div className="k-num"><CountUp value={data.roster.length} /><small>명</small></div>
            <div className="k-sub">{data.empType.map(([n, v]) => `${n} ${v}`).join(" · ")}</div>
            <div className="k-stack" role="img" aria-label="고용형태 구성비 막대">
              {data.empType.map(([n, v], i) => (
                <i key={n} style={{ flexGrow: v, background: `var(--c${i + 1})` }} />
              ))}
            </div>
          </Reveal>
          <Reveal className="kpi" delay={0.12} grow>
            <div className="k-label">입사 <span className="k-tag">{k.period}</span></div>
            <div className="k-num"><CountUp value={k.hires} /><small>명</small></div>
            <div className="k-sub">
              최다 {yearLabel(k.hiresPeak.year)} <b>{k.hiresPeak.value}명</b>
            </div>
            <Spark data={data.hires} />
          </Reveal>
          <Reveal className="kpi" delay={0.19} grow>
            <div className="k-label">퇴사 <span className="k-tag">{k.period}</span></div>
            <div className="k-num"><CountUp value={k.leavers} /><small>명</small></div>
            <div className="k-sub">
              순증감 <b>{k.net > 0 ? `+${k.net}` : `${k.net}`.replace("-", "−")}명</b>
            </div>
            <Spark data={data.leaversYearly} color="var(--c2)" />
          </Reveal>
          <Reveal className="kpi" delay={0.26} grow>
            <div className="k-label">잡플래닛 평점</div>
            <div className="k-num"><CountUp value={k.jobplanet} dec={2} /></div>
            <div className="k-sub">블라인드 <b>{k.blind !== null ? k.blind.toFixed(2) : "—"}</b></div>
            <Spark data={data.jobplanet} />
          </Reveal>
          <Reveal className="kpi" delay={0.33} grow>
            <div className="k-label">지원자 <span className="k-tag">{k.period}</span></div>
            <div className="k-num"><CountUp value={k.applicants} /><small>명</small></div>
            <div className="k-sub">
              {yearLabel(data.years[0])} 이후 누적 <b>{k.applicantsTotal.toLocaleString("ko-KR")}명</b>
            </div>
            <Spark data={data.applicants} />
          </Reveal>
        </div>
      </section>

      <section className="block">
        <div className="grid g-attrition">
          <Reveal className="card" grow>
            <CardHead title="인원" href="/people"
              note={`현원 ${k.headcount}명 · ${k.topOrg[0]} ${k.topOrg[1]}명 최다 · 근속 2년 미만 ${k.under2yPct}%`} />
            <div className="legend">
              {data.empType.map(([name, v], i) => (
                <span key={name}><i style={{ background: `var(--c${i + 1})` }} />{name} <b>{v}</b></span>
              ))}
            </div>
            <figure>
              <Donut rows={data.empType.map(([n, v], i) => [n, v, `var(--c${i + 1})`])}
                label={`고용형태 도넛 차트. ${empComposition}`} />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.06} grow>
            <CardHead title="채용" href="/recruiting"
              note={`입사자명단 기준 · ${yearLabel(k.hiresPeak.year)} ${k.hiresPeak.value}명 최다`} />
            <figure>
              <VBars labels={data.years} data={data.hires} w={480} h={214} unit="명"
                label="연도별 입사자 막대 차트" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.12} grow>
            <CardHead title="퇴직 · 리텐션" href="/attrition"
              note={k.net < 0 ? `${k.period}은 처음으로 순감소 전환` : `${k.period} 순증감 +${k.net}명`} />
            <figure>
              <NetBars labels={data.years} data={data.netChange} w={480} h={214}
                label="연도별 인원 순증감 차트" />
            </figure>
          </Reveal>
          <Reveal className="card" delay={0.18} grow>
            <CardHead title="평판" href="/reputation" note="연평균 · 블라인드 2026은 리뷰 2건 기준" />
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
        </div>
        <Reveal className="card" delay={0.24} style={{ marginTop: 14 }}>
          <div className="h-row">
            <h3>구성원 명부</h3>
            <Link className="more" href="/directory">명부 열기 →</Link>
          </div>
          <p className="note" style={{ margin: 0 }}>
            재직중 <b style={{ color: "var(--accent-deep)" }}>{data.roster.length}명</b> · 퇴사자{" "}
            <b style={{ color: "var(--accent-deep)" }}>{data.leavers.length}명</b> — 이름·조직·사유 검색 가능
          </p>
        </Reveal>
      </section>
    </>
  );
}

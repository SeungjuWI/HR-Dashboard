"use client";

import { useMemo, useState } from "react";
import { PageHead } from "@/components/nav";
import {
  jobplanetReviews, blindReviews, interviewReviews, surveyRows, surveyAverages,
  type JPReview, type BlindReview, type InterviewReview, type SurveyRow,
} from "@/lib/reviews";

type Tab = "jp" | "bl" | "iv" | "sv";
const PAGE = 20;

function Stars({ n }: { n: number }) {
  return (
    <span className="stars" aria-label={`${n}점`}>
      <span className="on">{"★".repeat(n)}</span>
      <span className="off">{"★".repeat(5 - n)}</span>
    </span>
  );
}

const RESULT_BADGE: Record<string, string> = {
  "합격 후 입사": "b-con", 합격: "b-con", 불합격: "b-invol",
  대기중: "b-plan", "합격 후 미입사": "b-int", "합격 후 입사포기": "b-int",
};
const EXP_BADGE: Record<string, string> = { 긍정적: "b-con", 보통: "b-vol", 부정적: "b-invol" };

function Badge({ text, cls }: { text: string; cls?: string }) {
  return <span className={`badge ${cls ?? "b-vol"}`}>{text}</span>;
}

function TextBlock({ tag, tagCls, text }: { tag: string; tagCls: string; text: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > 180;
  return (
    <div>
      <p className={`rev-block${long && !open ? " clamp" : ""}`}>
        <span className={`tag ${tagCls}`}>{tag}</span>
        {text}
      </p>
      {long && (
        <button className="rev-more" onClick={() => setOpen(!open)}>
          {open ? "접기" : "더보기"}
        </button>
      )}
    </div>
  );
}

function JPCard({ r }: { r: JPReview }) {
  return (
    <article className="rev-card">
      <div className="rev-meta">
        <Stars n={r.rating} />
        <span className="rev-date">{r.date}</span>
        <Badge text={r.job} cls="b-int" />
        <Badge text={r.status} cls={r.status === "현직원" ? "b-reg" : "b-vol"} />
      </div>
      <h4 className="rev-hl">{r.headline}</h4>
      <div className="rev-body">
        <TextBlock tag="장점" tagCls="tag-pro" text={r.pros} />
        <TextBlock tag="단점" tagCls="tag-con" text={r.cons} />
        <TextBlock tag="경영진에게" tagCls="tag-etc" text={r.toMgmt} />
      </div>
    </article>
  );
}

function BLCard({ r }: { r: BlindReview }) {
  return (
    <article className="rev-card">
      <div className="rev-meta">
        <Stars n={r.rating} />
        <span className="rev-date">{r.date}</span>
        <Badge text={r.job} cls="b-int" />
        <Badge text={r.status} cls={r.status === "현직원" ? "b-reg" : "b-vol"} />
      </div>
      <h4 className="rev-hl">{r.headline}</h4>
      <div className="rev-body">
        <TextBlock tag="장점" tagCls="tag-pro" text={r.pros} />
        <TextBlock tag="단점" tagCls="tag-con" text={r.cons} />
        <TextBlock tag="이직 사유" tagCls="tag-etc" text={r.reason} />
      </div>
    </article>
  );
}

function IVCard({ r }: { r: InterviewReview }) {
  return (
    <article className="rev-card">
      <div className="rev-meta">
        <span className="rev-date">{r.date}</span>
        <Badge text={r.job} cls="b-int" />
        {r.result && <Badge text={r.result} cls={RESULT_BADGE[r.result]} />}
        {r.difficulty && r.difficulty !== "-" && <Badge text={`난이도 ${r.difficulty}`} />}
        {r.experience && <Badge text={r.experience} cls={EXP_BADGE[r.experience]} />}
      </div>
      <h4 className="rev-hl">{r.headline}</h4>
      <div className="rev-body">
        <TextBlock tag="면접 질문" tagCls="tag-etc" text={r.questions} />
        <TextBlock tag="후기" tagCls="tag-pro" text={r.feel} />
        {r.resultTime && (
          <p className="rev-block"><span className="tag tag-con">결과 통보</span>{r.resultTime}</p>
        )}
      </div>
    </article>
  );
}

function SVCard({ r }: { r: SurveyRow }) {
  const main = ["만족도", "포지션 평균", "안내 평균", "진행 평균"];
  return (
    <article className="rev-card">
      <div className="rev-meta">
        <span className="rev-date">{r.date}</span>
        {main.map((k) =>
          typeof r.scores[k] === "number" ? (
            <span className="score-chip" key={k}>{k} <b>{(r.scores[k] as number).toFixed(1)}</b></span>
          ) : null,
        )}
      </div>
      {r.comment && (
        <div className="rev-body">
          <TextBlock tag="코멘트" tagCls="tag-etc" text={r.comment} />
        </div>
      )}
    </article>
  );
}

export default function ReviewsPage() {
  const [tab, setTab] = useState<Tab>("jp");
  const [q, setQ] = useState("");
  const [minRating, setMinRating] = useState(0); // 0 = 전체, n = n점만
  const [onlyComment, setOnlyComment] = useState(true);
  const [count, setCount] = useState(PAGE);

  const query = q.trim().toLowerCase();
  const match = (...fields: string[]) =>
    !query || fields.some((f) => f.toLowerCase().includes(query));

  const jp = useMemo(
    () => jobplanetReviews.filter((r) =>
      (minRating === 0 || r.rating === minRating) &&
      match(r.headline, r.pros, r.cons, r.toMgmt, r.job)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, minRating],
  );
  const bl = useMemo(
    () => blindReviews.filter((r) =>
      (minRating === 0 || r.rating === minRating) &&
      match(r.headline, r.pros, r.cons, r.reason, r.job)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, minRating],
  );
  const iv = useMemo(
    () => interviewReviews.filter((r) => match(r.headline, r.questions, r.feel, r.job, r.result)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  );
  const sv = useMemo(
    () => surveyRows.filter((r) => (!onlyComment || r.comment) && match(r.comment)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, onlyComment],
  );

  const avgs = useMemo(() => surveyAverages(["만족도", "포지션 평균", "안내 평균", "진행 평균"]), []);

  const list = tab === "jp" ? jp : tab === "bl" ? bl : tab === "iv" ? iv : sv;
  const visible = list.slice(0, count);
  const switchTab = (t: Tab) => { setTab(t); setCount(PAGE); };

  return (
    <>
      <PageHead eyebrow="Reviews" title="리뷰 · 피드백 원문"
        desc="잡플래닛·블라인드 기업 리뷰, 면접 리뷰, 면접 경험 설문의 원문 전체 — 평점·키워드로 필터링할 수 있습니다." />
      <section className="block" style={{ marginTop: 20 }}>
        <div className="fbar">
          <div className="tabs" role="tablist" aria-label="리뷰 소스">
            <button className={`tab${tab === "jp" ? " on" : ""}`} role="tab" aria-selected={tab === "jp"} onClick={() => switchTab("jp")}>잡플래닛 <b>{jobplanetReviews.length}</b></button>
            <button className={`tab${tab === "bl" ? " on" : ""}`} role="tab" aria-selected={tab === "bl"} onClick={() => switchTab("bl")}>블라인드 <b>{blindReviews.length}</b></button>
            <button className={`tab${tab === "iv" ? " on" : ""}`} role="tab" aria-selected={tab === "iv"} onClick={() => switchTab("iv")}>면접 리뷰 <b>{interviewReviews.length}</b></button>
            <button className={`tab${tab === "sv" ? " on" : ""}`} role="tab" aria-selected={tab === "sv"} onClick={() => switchTab("sv")}>면접 설문 <b>{surveyRows.length}</b></button>
          </div>
          <input className="dir-q" type="search" placeholder="키워드 검색 (본문 포함)" aria-label="리뷰 검색"
            value={q} onChange={(e) => { setQ(e.target.value); setCount(PAGE); }} />
        </div>

        {(tab === "jp" || tab === "bl") && (
          <div className="fbar" style={{ marginTop: 0 }}>
            {[0, 5, 4, 3, 2, 1].map((n) => (
              <button key={n} className={`tab${minRating === n ? " on" : ""}`}
                onClick={() => { setMinRating(n); setCount(PAGE); }}>
                {n === 0 ? "전체 평점" : `${n}점`}
              </button>
            ))}
          </div>
        )}

        {tab === "sv" && (
          <div className="fbar" style={{ marginTop: 0 }}>
            {avgs.map(([k, v]) => (
              <span className="score-chip" key={k}>{k} 평균 <b>{v.toFixed(2)}</b></span>
            ))}
            <button className={`tab${onlyComment ? " on" : ""}`}
              onClick={() => { setOnlyComment(!onlyComment); setCount(PAGE); }}>
              코멘트 있는 응답만
            </button>
          </div>
        )}

        <p className="dir-note" style={{ margin: "0 0 12px" }}>
          {list.length.toLocaleString("ko-KR")}건 표시
          {tab === "sv" && " · 5점 만점 · 2023.12~2026.06 응답"}
        </p>

        <div className="rev-list">
          {tab === "jp" && (visible as JPReview[]).map((r, i) => <JPCard key={r.date + i} r={r} />)}
          {tab === "bl" && (visible as BlindReview[]).map((r, i) => <BLCard key={r.date + i} r={r} />)}
          {tab === "iv" && (visible as InterviewReview[]).map((r, i) => <IVCard key={r.date + i} r={r} />)}
          {tab === "sv" && (visible as SurveyRow[]).map((r, i) => <SVCard key={r.date + i} r={r} />)}
        </div>

        {list.length > count && (
          <button className="load-more" onClick={() => setCount(count + PAGE)}>
            더 보기 ({list.length - count}건 남음)
          </button>
        )}
      </section>
    </>
  );
}

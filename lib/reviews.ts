// 리뷰·설문 원문 데이터 — lib/extracted/*.json은 시트에서 행 단위로 추출한 스냅샷.
// 실시간 연동 시 이 모듈의 export만 실제 소스로 교체하면 된다.

import jobplanetJson from "./extracted/jobplanet-reviews.json";
import blindJson from "./extracted/blind-reviews.json";
import interviewJson from "./extracted/interview-reviews.json";
import surveyJson from "./extracted/interview-survey.json";
import monthlyRatingJson from "./extracted/monthly-rating.json";

export interface JPReview {
  date: string;
  job: string;
  status: string;
  headline: string;
  pros: string;
  cons: string;
  toMgmt: string;
  rating: number;
  sub: { promo: number | null; comp: number | null; wlb: number | null; culture: number | null; mgmt: number | null };
}

export interface BlindReview {
  date: string;
  job: string;
  status: string;
  headline: string;
  pros: string;
  cons: string;
  reason: string;
  rating: number;
}

export interface InterviewReview {
  date: string;
  job: string;
  headline: string;
  questions: string;
  feel: string;
  resultTime: string;
  difficulty: string;
  experience: string;
  result: string;
}

export interface SurveyRow {
  date: string;
  scores: Record<string, number | null>;
  comment: string;
}

const byDateDesc = <T extends { date: string }>(rows: T[]) =>
  [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));

export const jobplanetReviews = byDateDesc(jobplanetJson as JPReview[]);
export const blindReviews = byDateDesc(blindJson as BlindReview[]);
export const interviewReviews = byDateDesc(interviewJson as InterviewReview[]);
export const surveyRows = byDateDesc(surveyJson as unknown as SurveyRow[]);
export const monthlyRating = monthlyRatingJson as { month: string; rating: number }[];

/* 잡플래닛 평점 데이터(리뷰 단위)를 분기 평균으로 집계 */
export function quarterlyRating(): [string, number][] {
  const m = new Map<number, { label: string; sum: number; n: number }>();
  monthlyRating.forEach(({ month, rating }) => {
    const y = Number(month.slice(0, 4));
    const q = Math.ceil(Number(month.slice(5)) / 3);
    const key = y * 4 + q;
    const cur = m.get(key) ?? { label: `${String(y).slice(2)}Q${q}`, sum: 0, n: 0 };
    cur.sum += rating;
    cur.n += 1;
    m.set(key, cur);
  });
  return [...m.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => [v.label, Math.round((v.sum / v.n) * 100) / 100]);
}

/* 면접 경험 설문 주요 지표 평균 (null 응답 제외, 5점 만점) */
export function surveyAverages(keys: string[]): [string, number][] {
  return keys.map((k) => {
    const vals = surveyRows.map((r) => r.scores[k]).filter((v): v is number => typeof v === "number");
    const avg = vals.reduce((s, v) => s + v, 0) / Math.max(vals.length, 1);
    return [k, Math.round(avg * 100) / 100];
  });
}

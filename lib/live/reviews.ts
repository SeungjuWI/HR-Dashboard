// 리뷰 원문 라이브 연동 — 잡플래닛/블라인드/면접 설문(채용 2025·2026) 시트를 읽어
// lib/reviews.ts 스키마로 변환한다. 자격 없음·실패 시 null을 반환하고 호출부가 스냅샷으로 폴백.

import { unstable_cache } from "next/cache";
import type { JPReview, BlindReview, InterviewReview, SurveyRow } from "../reviews";
import { liveCredentials, oauthCredentials, sheetValues } from "./google";
import { normMonth } from "./parse";

// 시트 ID는 비밀이 아니다(접근은 OAuth 자격으로 통제됨) — 파일이 교체되면 여기만 수정
const SHEET_JOBPLANET = "1hgLOXv54HhVFhl-YFOJeFFWsFyEbiTiEB3PNNMpKgY4";
const SHEET_BLIND = "1JIKjVRtXeuoxtnqtjDt95e_sOoVVojnBhV2ziDQq2UY";
const SHEET_RECRUIT_2025 = "1o_cmOQ9uSHIYgPoI6wsl6jgkaL68eu3RlQJe4Bw2-No";
const SHEET_RECRUIT_2026 = "1JeHy2UFOuj8-bmcrX01_ZRpi1UgVh3OZlYltUrTxoTU";

export interface ReviewsData {
  jobplanet: JPReview[];
  blind: BlindReview[];
  interview: InterviewReview[];
  survey: SurveyRow[];
  fetchedAt: string;
}

const num = (v: string | undefined): number | null => {
  const n = parseFloat(String(v ?? "").trim());
  return Number.isFinite(n) ? n : null;
};
const text = (v: string | undefined): string => {
  const t = (v ?? "").trim();
  return t === "-" ? "" : t;
};
const byDateDesc = <T extends { date: string }>(rows: T[]) =>
  [...rows].sort((a, b) => (a.date < b.date ? 1 : -1));

/* 기업 리뷰(전체): 작성일 | 직무 | 재직여부 | 헤드라인 | 장점 | 단점 | 경영진에 바라는 점 | 총점 | 승진 | 복지급여 | 워라밸 | 사내문화 | 경영진 */
function parseJobplanet(rows: string[][]): JPReview[] {
  return rows
    .filter((r) => normMonth(r[0]))
    .map((r) => ({
      date: normMonth(r[0])!,
      job: text(r[1]),
      status: text(r[2]),
      headline: text(r[3]),
      pros: text(r[4]),
      cons: text(r[5]),
      toMgmt: text(r[6]),
      rating: num(r[7]) ?? 0,
      sub: { promo: num(r[8]), comp: num(r[9]), wlb: num(r[10]), culture: num(r[11]), mgmt: num(r[12]) },
    }));
}

/* 리뷰(전체): 작성일 | 직무 | 재직여부 | 헤드라인 | 장점 | 단점 | 이직 사유 | 총점 */
function parseBlind(rows: string[][]): BlindReview[] {
  return rows
    .filter((r) => normMonth(r[0]))
    .map((r) => ({
      date: normMonth(r[0])!,
      job: text(r[1]),
      status: text(r[2]),
      headline: text(r[3]),
      pros: text(r[4]),
      cons: text(r[5]),
      reason: text(r[6]),
      rating: num(r[7]) ?? 0,
    }));
}

/* 면접 리뷰(전체): 작성일 | 직무 | 면접일자 | 헤드라인 | 질문 | 느낌 | 결과 통보 | 난이도 | 경험 | 결과 */
function parseInterview(rows: string[][]): InterviewReview[] {
  return rows
    .filter((r) => normMonth(r[0]))
    .map((r) => ({
      date: normMonth(r[0])!,
      job: text(r[1]),
      headline: text(r[3]),
      questions: text(r[4]),
      feel: text(r[5]),
      resultTime: text(r[6]),
      difficulty: text(r[7]),
      experience: text(r[8]),
      result: text(r[9]),
    }));
}

/* 면접 경험 설문: 지원자 | 공고명 | 조직 | 응답일 | 점수 12개(E~P) | 프로세스 보완점 */
const SV_KEYS = [
  "만족도", "포지션 평균", "안내 평균", "진행 평균",
  "JD 이해도", "정보 접근성", "절차 설명", "담당자 안내",
  "대기 공간", "면접 전반", "질문 적절성", "입사 의향",
];
function parseSurvey(rows: string[][]): (SurveyRow & { key: string })[] {
  return rows
    .filter((r) => normMonth(r[3]))
    .map((r) => ({
      key: `${text(r[0])}|${text(r[3])}|${text(r[1])}`,
      date: normMonth(r[3])!,
      scores: Object.fromEntries(SV_KEYS.map((k, i) => [k, num(r[4 + i])])),
      comment: text(r[16]),
    }));
}

export async function fetchReviewsFile(): Promise<ReviewsData> {
  const [[jpRows, ivRows], [blRows], [sv25], [sv26]] = await Promise.all([
    sheetValues(SHEET_JOBPLANET, ["기업 리뷰(전체)!A2:M", "면접 리뷰(전체)!A2:J"]),
    sheetValues(SHEET_BLIND, ["리뷰(전체)!A2:H"]),
    sheetValues(SHEET_RECRUIT_2025, ["면접 경험 설문!A2:Q"]),
    sheetValues(SHEET_RECRUIT_2026, ["면접 경험 설문!A2:Q"]),
  ]);

  // 2025·2026 파일의 설문 탭은 과거 응답을 중복 포함 → 지원자|응답일|공고명으로 중복 제거
  const seen = new Set<string>();
  const survey: SurveyRow[] = [];
  for (const { key, ...row } of [...parseSurvey(sv25), ...parseSurvey(sv26)]) {
    if (seen.has(key)) continue;
    seen.add(key);
    survey.push(row);
  }

  const jobplanet = byDateDesc(parseJobplanet(jpRows));
  if (jobplanet.length === 0) throw new Error("live jobplanet empty — 시트 범위/권한 확인 필요");
  return {
    jobplanet,
    blind: byDateDesc(parseBlind(blRows)),
    interview: byDateDesc(parseInterview(ivRows)),
    survey: byDateDesc(survey),
    fetchedAt: new Date().toISOString(),
  };
}

/* 10분 캐시 — 시트 수정 후 최대 10분 안에 반영 */
const cachedReviews = unstable_cache(fetchReviewsFile, ["live-reviews"], { revalidate: 600 });

export async function liveReviews(): Promise<ReviewsData | null> {
  if (!(oauthCredentials() ?? liveCredentials())) return null;
  try {
    return await cachedReviews();
  } catch (e) {
    console.error("[live] reviews fallback to snapshot:", e);
    return null;
  }
}

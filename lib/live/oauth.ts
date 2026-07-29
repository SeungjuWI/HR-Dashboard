// OAuth 동의 플로우 공통 상수 — 리디렉션 URI는 GCP 콘솔의 "승인된 리디렉션 URI"와
// 문자 단위로 일치해야 하므로 프로덕션 도메인으로 고정한다.
export const OAUTH_REDIRECT_URI = "https://likelion-hr-dashboard.vercel.app/api/oauth/callback";
export const OAUTH_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

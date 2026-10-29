// 접속 비밀번호 게이트 설정.
// 비밀번호 변경 방법: node -e "console.log(require('crypto').createHash('sha256').update('새비밀번호'+'llhr-salt-2026').digest('hex'))"
// 로 해시를 구해 AUTH_TOKEN을 교체하거나, Vercel 환경변수 DASHBOARD_TOKEN으로 덮어쓴다.

export const AUTH_COOKIE = "llhr_auth";
export const AUTH_SALT = "llhr-salt-2026";

export function authToken(): string {
  return process.env.DASHBOARD_TOKEN ?? "0271ecfb42eaf7684b3c6c8463eddebbbb368bd88e1ae8548abcb11ed02792d4";
}

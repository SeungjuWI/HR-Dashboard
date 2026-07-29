# LIKELION HR Dashboard

멋쟁이사자처럼 HR팀의 통합 대시보드. 인원 현황 · 구성원 명부 · 채용 · 퇴직 · 평판(잡플래닛/블라인드)을 한 화면에서 보여준다.

## 실행

```bash
npm install
npm run dev   # http://localhost:3000
```

## 스택

- **Next.js (App Router) + TypeScript** — Vercel 배포 대상
- 차트는 외부 라이브러리 없이 SVG 직접 렌더 (`components/charts.tsx`)
- 스타일은 `app/globals.css`의 CSS 토큰 기반 (멋사 오렌지 `#FF7710` 키컬러)

## 구조

```
app/            페이지 셸 (page.tsx는 서버 컴포넌트, 데이터 주입만 담당)
components/     Dashboard(조립) · charts(SVG) · Directory(명부) · motion(애니메이션)
lib/data.ts     데이터 레이어 — 현재는 2026.07.29 시트 스냅샷 정적 제공
```

## 데이터 연동 로드맵

지금은 `lib/data.ts`의 `getSnapshot()`이 정적 스냅샷을 반환한다. 원본 엑셀들이
네이티브 Google Sheets로 전환되면 이 함수만 실제 소스로 교체한다:

1. **Google Sheets API (서비스 계정)** — Vercel 서버 라우트에서 시트를 읽어 집계 후 반환.
   서비스 계정 이메일을 각 시트에 뷰어로 공유해야 한다.
2. **Supabase (선택)** — 집계 결과 캐시/이력 저장이 필요해지면 도입.

필요 환경변수(연동 단계에서): `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY`,
Supabase 사용 시 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
`.env.local`에 넣는다 (git 무시됨).

## 주의

구성원 명부에 실명이 포함된다. **배포 URL은 HR팀 내부에서만 공유**하고,
Vercel 배포 시 검색엔진 색인은 이미 메타데이터로 차단되어 있다 (`robots: noindex`).

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CommandBar } from "@/components/nav";
import { Tooltip } from "@/components/motion";
import { getSnapshot } from "@/lib/data";

// 라이브 모드에서 페이지가 최신 캐시를 다시 그리도록 전 라우트 10분 재검증
export const revalidate = 600;

const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});
const suit = localFont({
  src: "./fonts/SUIT-Variable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-suit",
});

export const metadata: Metadata = {
  title: "LIKELION HR Dashboard",
  description: "멋쟁이사자처럼 HR 통합 대시보드",
  robots: { index: false, follow: false },
  // /brand 는 미들웨어 인증 게이트에서 제외된 경로라 로그인 전에도 아이콘이 뜬다
  icons: { icon: "/brand/mark.png", apple: "/brand/mark.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const data = await getSnapshot();
  const snapshot = data.snapshotDate.replace(/-/g, ".");
  return (
    <html lang="ko" className={`${pretendard.variable} ${suit.variable}`}>
      <body>
        <div className="watermark" aria-hidden="true" />
        <div className="wrap">
          <CommandBar fetchedAt={data.fetchedAt} snapshotDate={data.snapshotDate} />
          {children}
          <footer className="foot">
            <span>
              {data.fetchedAt
                ? `인원 데이터는 Google Sheets 라이브 연동 — 시트 수정 후 최대 20분 내 반영. 채용·평판은 ${snapshot} 스냅샷.`
                : `수치는 ${snapshot} 시트 스냅샷 집계 — 인원_퇴직 시트가 구글 시트로 변환되면 실시간 연동이 켜집니다.`}
            </span>
            <span className="m">LIKELION HR · INTERNAL</span>
          </footer>
        </div>
        <Tooltip />
      </body>
    </html>
  );
}

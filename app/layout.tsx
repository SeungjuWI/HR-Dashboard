import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CommandBar } from "@/components/nav";
import { Tooltip } from "@/components/motion";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${suit.variable}`}>
      <body>
        <div className="watermark" aria-hidden="true" />
        <div className="wrap">
          <CommandBar />
          {children}
          <footer className="foot">
            <span>수치는 2026.07.29 시트 스냅샷 집계 — 실시간 Google Sheets 연동은 시트 전환 후 활성화됩니다.</span>
            <span className="m">LIKELION HR · INTERNAL</span>
          </footer>
        </div>
        <Tooltip />
      </body>
    </html>
  );
}

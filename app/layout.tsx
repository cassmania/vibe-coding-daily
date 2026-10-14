import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "바이브코딩 유틸 일간 | GitHub 윈도우·컴퓨터 유틸 모음",
  description:
    "GitHub에 매일 올라오는 바이브코딩 앱 중 유틸리티·윈도우·컴퓨터 관련 앱만 골라 스타 순으로 정리합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}

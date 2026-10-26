import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "바이브코딩 데일리 | 새 스킬·인기 스킬 실시간",
  description:
    "GitHub에 새로 올라온 Claude 스킬과 스타 많은 스킬을 실시간으로 보여주고, 바이브코딩 유틸 앱을 매일 정리합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

# 바이브코딩 유틸 일간

GitHub에 매일 올라오는 바이브코딩 앱 중 **유틸리티 · 윈도우 · AI · 데스크톱 꾸미기**만 골라 보여주는 큐레이션 사이트입니다.

## 실행

```bash
npm install
npm run fetch   # GitHub 수집 → data/apps.json 갱신 (GITHUB_TOKEN 권장)
npm run dev     # http://localhost:3000
```

## 매일 자동 갱신

- `.github/workflows/daily.yml`가 매일 09:00(KST) `scripts/fetch-github.mjs` 실행 → `data/apps.json` 커밋
- Vercel에 연결하면 커밋마다 자동 재배포되어 항상 최신 목록 유지

## 수집 기준

`scripts/fetch-github.mjs`의 쿼리 참고:
windows utility, launcher/tray/hotkey/clipboard, file-manager, system-monitor/cleaner,
screenshot/ocr, automation/macro, ai desktop app, llm chat client, whisper/dictation,
ai agent desktop, desktop customization/wallpaper widget, rainmeter/wallpaper-engine,
hyprland/tiling, taskbar/start-menu, 최근 생성 utility 등. 카테고리는 `lib/categories.ts` 휴리스틱으로 자동 분류.
섹션: 오늘의 신규 / 스타 많은 순 / 윈도우 특화 / AI 관련 / 데스크톱 꾸미기.

## 한글 요약

현재 `description_ko`는 원문 그대로 저장됩니다. 원하는 앱만 골라 `data/apps.json`에서
한글 한 줄 설명으로 직접 고치면 사이트에 바로 반영됩니다. (하이브리드 큐레이션)

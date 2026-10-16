// GitHub 일간 수집 스크립트: 유틸/윈도우/컴퓨터 관련 바이브코딩 앱 중심
// 사용법: GITHUB_TOKEN=xxx node scripts/fetch-github.mjs  (토큰 없어도 동작, 제한 60회/h)
// 결과: data/apps.json 갱신
import fs from "node:fs";

const TOKEN = process.env.GITHUB_TOKEN || "";
const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "vibe-coding-daily",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

// 컴퓨터 유틸 중심 쿼리 (stars 조건을 낮게 잡아 신생 바이브코딩 앱도 포함)
const QUERIES = [
  // 윈도우 유틸 특화
  "windows utility tool stars:>100",
  "windows launcher OR tray OR hotkey OR clipboard stars:>100",
  // 파일/시스템 유틸
  "file manager utility stars:>100",
  "system monitor OR cleaner OR optimizer OR backup utility stars:>100",
  // 캡처/자동화/생산성
  "screenshot OR clipboard OR snip OR ocr tool stars:>50",
  "automation macro scheduler utility stars:>50",
  // AI 관련 데스크톱 유틸 (사이트 취지에 맞게 앱형 위주)
  "ai desktop app electron OR tauri stars:>50",
  "llm chat client desktop stars:>50",
  "whisper OR dictation OR voice-input desktop stars:>20",
  "ai agent automation desktop created:>2025-06-01 stars:>20",
  // 데스크톱 꾸미기 (월페이퍼/위젯/테마/타일링)
  "desktop customization wallpaper widget stars:>50",
  "rainmeter OR wallpaper-engine OR live-wallpaper stars:>20",
  "hyprland OR tiling window-manager stars:>50",
  "windows taskbar OR start-menu customizer stars:>20",
  // 최근 생성된 신생 앱 (바이브코딩 느낌)
  "utility tool created:>2025-06-01 stars:>20",
  "windows app created:>2025-06-01 stars:>20",
];

function categorize(name, desc, topics, lang) {
  const lowerTopics = (topics || []).map((t) => String(t).toLowerCase());
  if (lowerTopics.some((t) => ["ai", "llm", "rag", "agent", "agents"].includes(t))) return "AI·LLM";
  if (
    lowerTopics.some((t) =>
      ["wallpaper", "wallpapers", "rainmeter", "ricing", "hyprland", "conky", "dock", "taskbar", "screensaver", "widgets", "widget", "theming", "desktop-customization", "tiling"].includes(t)
    )
  )
    return "데스크톱 꾸미기";
  const hay = `${name} ${desc ?? ""} ${(topics || []).join(" ")} ${lang ?? ""}`.toLowerCase();
  const rules = [
    ["AI·LLM", ["ai-", "gpt", "llm", "claude", "gemini", "chatbot", "copilot", "whisper", "ollama", "openai", "anthropic", "agent", "stable-diffusion", "text-to-speech", "speech-to-text", "dictation"]],
    ["데스크톱 꾸미기", ["wallpaper", "live-wallpaper", "animated-wallpaper", "wallpaper-engine", "rainmeter", "conky", "desktop-widget", "desktop-custom", "ricing", "hyprland", "tiling", "cursor-theme", "taskbar", "startmenu", "start-menu", "lock-screen", "screensaver"]],
    ["윈도우 유틸", ["windows", "win32", "winui", "powershell", "winget", "tray", "context-menu", "explorer"]],
    ["파일 관리", ["file-manager", "file", "explorer", "duplicate", "rename", "backup", "sync", "search"]],
    ["런처·생산성", ["launcher", "productivity", "todo", "note", "pomodoro", "spotlight", "raycast", "alfred", "shortcut", "hotkey"]],
    ["시스템·모니터링", ["system", "monitor", "cpu", "memory", "process", "task-manager", "cleaner", "optimizer", "battery", "driver"]],
    ["캡처·클립보드", ["screenshot", "capture", "clipboard", "snip", "recorder", "ocr", "picker", "color"]],
    ["자동화", ["automation", "macro", "autohotkey", "script", "scheduler", "workflow", "bot"]],
    ["개발 도구", ["cli", "terminal", "git", "devtool", "api", "json", "regex", "ssh", "docker"]],
  ];
  for (const [cat, kws] of rules) if (kws.some((k) => hay.includes(k))) return cat;
  return "기타";
}

async function search(q) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=20`;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error(`쿼리 실패: ${q} -> ${res.status}`);
    return [];
  }
  const json = await res.json();
  return json.items ?? [];
}

const seen = new Map();
for (const q of QUERIES) {
  console.log("검색:", q);
  const items = await search(q);
  for (const r of items) {
    if (seen.has(r.id)) continue;
    seen.set(r.id, {
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description,
      description_ko: r.description, // 한글 요약은 추후 수동/LLM 큐레이션으로 교체
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      topics: r.topics ?? [],
      category: categorize(r.name, r.description, r.topics ?? [], r.language),
      pushed_at: r.pushed_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      owner_avatar: r.owner?.avatar_url ?? "",
      owner_login: r.owner?.login ?? "",
      license: r.license?.spdx_id ?? null,
    });
  }
  // API rate limit 배려
  await new Promise((r) => setTimeout(r, 1500));
}

const all = [...seen.values()].sort((a, b) => b.stars - a.stars);
// 상한선 없음: 수집된 전량 저장

// 섹션 구성
const thirtyDaysAgo = Date.now() - 30 * 86400000;
const daily_new = [...all]
  .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  .slice(0, 12)
  .map((a) => ({ ...a, isNew: +new Date(a.created_at) > thirtyDaysAgo }));
const top_starred = [...all].sort((a, b) => b.stars - a.stars).slice(0, 12);
const windows_focus = all
  .filter((a) => a.category === "윈도우 유틸" || /windows|tray|winget|powershell|hotkey/i.test(`${a.full_name} ${a.description ?? ""} ${a.topics.join(" ")}`))
  .slice(0, 12);
const ai_focus = all
  .filter(
    (a) =>
      a.category === "AI·LLM" ||
      /ai-|gpt|llm|claude|gemini|chatbot|copilot|whisper|ollama|openai|anthropic|\brag\b|agent|stable-diffusion|dictation/i.test(
        `${a.full_name} ${a.description ?? ""} ${a.topics.join(" ")}`
      )
  )
  .slice(0, 12);
const desktop_focus = all
  .filter(
    (a) =>
      a.category === "데스크톱 꾸미기" ||
      /wallpaper|rainmeter|ricing|hyprland|conky|taskbar|start-menu|startmenu|screensaver|wallpaper-engine|live-wallpaper|desktop-widget|desktop-custom|cursor-theme|\btiling\b|\bdock\b/i.test(
        `${a.full_name} ${a.description ?? ""} ${a.topics.join(" ")}`
      )
  )
  .slice(0, 12);

const out = {
  fetched_at: new Date().toISOString(),
  total: all.length,
  sections: { daily_new, top_starred, windows_focus, ai_focus, desktop_focus },
  all,
};

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/apps.json", JSON.stringify(out, null, 2), "utf-8");
console.log(`저장 완료: data/apps.json (${all.length}개)`);

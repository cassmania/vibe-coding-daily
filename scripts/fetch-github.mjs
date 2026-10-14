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
  // 최근 생성된 신생 앱 (바이브코딩 느낌)
  "utility tool created:>2025-06-01 stars:>20",
  "windows app created:>2025-06-01 stars:>20",
];

function categorize(name, desc, topics, lang) {
  const hay = `${name} ${desc ?? ""} ${(topics || []).join(" ")} ${lang ?? ""}`.toLowerCase();
  const rules = [
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

let all = [...seen.values()].sort((a, b) => b.stars - a.stars);
// 유틸ッション 외 잡다한 초대형 awesome-list 등은 제외하고 싶으면 stars 상한 없이 유지,
// 대신 윈도우/유틸 키워드 하나라도 포함된 것만 우선 (이미 쿼리가 그렇게 되어 있음)
all = all.slice(0, 60);

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

const out = {
  fetched_at: new Date().toISOString(),
  total: all.length,
  sections: { daily_new, top_starred, windows_focus },
  all,
};

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync("data/apps.json", JSON.stringify(out, null, 2), "utf-8");
console.log(`저장 완료: data/apps.json (${all.length}개)`);

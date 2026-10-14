// 유틸 / 윈도우 / 컴퓨터 관련 카테고리 휴리스틱
export const CATEGORIES = [
  "전체",
  "윈도우 유틸",
  "파일 관리",
  "런처·생산성",
  "시스템·모니터링",
  "캡처·클립보드",
  "자동화",
  "개발 도구",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

const RULES: { category: Exclude<Category, "전체">; keywords: string[] }[] = [
  {
    category: "윈도우 유틸",
    keywords: ["windows", "win32", "winui", "powershell", "winget", "tray", "context-menu", "explorer"],
  },
  {
    category: "파일 관리",
    keywords: ["file-manager", "file", "explorer", "duplicate", "rename", "backup", "sync", "search", "everything"],
  },
  {
    category: "런처·생산성",
    keywords: ["launcher", "productivity", "todo", "note", "pomodoro", "spotlight", "raycast", "alfred", "shortcut", "hotkey"],
  },
  {
    category: "시스템·모니터링",
    keywords: ["system", "monitor", "cpu", "memory", "process", "task-manager", "cleaner", "optimizer", "battery", "driver"],
  },
  {
    category: "캡처·클립보드",
    keywords: ["screenshot", "capture", "clipboard", "snip", "recorder", "ocr", "picker", "color"],
  },
  {
    category: "자동화",
    keywords: ["automation", "macro", "autohotkey", "script", "scheduler", "workflow", "bot"],
  },
  {
    category: "개발 도구",
    keywords: ["cli", "terminal", "git", "devtool", "api", "json", "regex", "ssh", "docker"],
  },
];

export function categorizeRepo(
  name: string,
  description: string | null,
  topics: string[],
  language: string | null
): Exclude<Category, "전체"> {
  const hay = `${name} ${description ?? ""} ${topics.join(" ")} ${language ?? ""}`.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => hay.includes(k))) return rule.category;
  }
  return "기타";
}

// 간단 한글 요약 생성 (수동 큐레이션 없을 때 대체 텍스트)
export function koSummary(description: string | null, language: string | null): string {
  if (!description) return "설명 없음 — 저장소를 직접 확인하세요.";
  // 영어 설명 뒤에 용도 한 줄 추가
  const lang = language ? ` · ${language} 기반` : "";
  return `${description}${lang}`;
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const day = 86400000;
  if (diff < day) return "오늘";
  const days = Math.floor(diff / day);
  if (days === 1) return "어제";
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

export function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

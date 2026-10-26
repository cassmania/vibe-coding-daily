// 스킬 저장소 검색: 빌드 시 스냅샷(data/skills.json) + 브라우저에서 GitHub API 실시간 갱신
import type { SkillItem } from "./types";

// GitHub 검색은 토픽 OR를 못 쓰므로 텍스트 매칭으로 스킬 저장소를 잡는다
export const SKILL_BASE = "claude skill in:name,description,topics";

export function skillQueries(now = Date.now()) {
  const weekAgo = new Date(now - 7 * 86400000).toISOString().slice(0, 19) + "Z";
  return {
    // 0스타 테스트 저장소가 대부분이라 최소 2스타로 거른다
    fresh: `${SKILL_BASE} created:>${weekAgo} stars:>=2`,
    top: `${SKILL_BASE} stars:>500`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toSkill(r: any): SkillItem {
  return {
    id: r.id,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    forks: r.forks_count,
    topics: r.topics ?? [],
    created_at: r.created_at,
    pushed_at: r.pushed_at,
    owner_avatar: r.owner?.avatar_url ?? "",
  };
}

export async function searchSkills(q: string, signal?: AbortSignal): Promise<SkillItem[]> {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=60`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" }, signal });
  if (res.status === 403 || res.status === 429) throw new Error("rate");
  if (!res.ok) throw new Error(String(res.status));
  const json = await res.json();
  return (json.items ?? []).map(toSkill);
}

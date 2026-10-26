"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORIES, formatStars, timeAgo } from "@/lib/categories";
import { searchSkills, skillQueries } from "@/lib/skills";
import type { AppItem, AppsData, SkillItem, SkillsData } from "@/lib/types";
import apps from "@/data/apps.json";
import skillsSnapshot from "@/data/skills.json";
import { ArrowUpRight, RefreshCw, Search, Star } from "lucide-react";

const appsData = apps as AppsData;
const snapshot = skillsSnapshot as SkillsData;
const REFRESH_MS = 3 * 60 * 1000;

type Tab = "fresh" | "top" | "apps";
type Status = "loading" | "live" | "snapshot";

// 스냅샷 대비 스타 증가분 표시용
const snapshotStars = new Map([...snapshot.fresh, ...snapshot.top].map((s) => [s.id, s.stars]));

function relTime(iso: string, now: number) {
  const m = Math.max(0, Math.floor((now - +new Date(iso)) / 60000));
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function Spark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        {[0, 30, 60, 90, 120, 150].map((d) => (
          <line key={d} x1="12" y1="2.5" x2="12" y2="21.5" transform={`rotate(${d} 12 12)`} />
        ))}
      </g>
    </svg>
  );
}

function Pill({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "clay" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
        tone === "clay" ? "bg-clay-soft text-clay" : "bg-sunken text-muted"
      }`}
    >
      {children}
    </span>
  );
}

function SkillCard({ s, rank, now }: { s: SkillItem; rank?: number; now: number }) {
  const prev = snapshotStars.get(s.id);
  const gain = prev !== undefined ? s.stars - prev : 0;
  const fresh = now - +new Date(s.created_at) < 86400000;
  const [owner, repo] = s.full_name.split("/");
  return (
    <a
      href={s.html_url}
      target="_blank"
      rel="noreferrer"
      className="group flex min-w-0 flex-col rounded-2xl border border-line bg-card p-5 transition hover:border-clay/50 hover:shadow-[0_6px_24px_-12px_rgb(var(--clay)/0.45)]"
    >
      <div className="flex items-start gap-3">
        {rank !== undefined && (
          <span className="w-6 shrink-0 pt-1 font-serif text-lg font-semibold text-clay">{rank}</span>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.owner_avatar} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-sunken" loading="lazy" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{owner}</p>
          <p className="truncate font-semibold leading-snug group-hover:text-clay">{repo}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="inline-flex items-center gap-1 text-sm font-semibold">
            <Star size={13} className="fill-clay text-clay" /> {formatStars(s.stars)}
          </p>
          {gain > 0 && <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">▲ {gain}</p>}
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{s.description || "설명이 없습니다."}</p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        {fresh && <Pill tone="clay">오늘 공개</Pill>}
        <Pill>{relTime(s.created_at, now)} 공개</Pill>
        {s.language && <Pill>{s.language}</Pill>}
        {s.topics.slice(0, 2).map((t) => (
          <Pill key={t}>#{t}</Pill>
        ))}
      </div>
    </a>
  );
}

function AppCard({ app }: { app: AppItem }) {
  return (
    <a
      href={app.html_url}
      target="_blank"
      rel="noreferrer"
      className="group flex min-w-0 flex-col rounded-2xl border border-line bg-card p-5 transition hover:border-clay/50"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={app.owner_avatar} alt="" className="h-9 w-9 shrink-0 rounded-lg bg-sunken" loading="lazy" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{app.owner_login}</p>
          <p className="truncate font-semibold group-hover:text-clay">{app.name}</p>
        </div>
        <p className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
          <Star size={13} className="fill-clay text-clay" /> {formatStars(app.stars)}
        </p>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">
        {app.description_ko || app.description || "설명이 없습니다."}
      </p>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        <Pill tone="clay">{app.category}</Pill>
        <Pill>{timeAgo(app.pushed_at)} 업데이트</Pill>
        {app.language && <Pill>{app.language}</Pill>}
      </div>
    </a>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("fresh");
  const [query, setQuery] = useState("");
  const [freshSort, setFreshSort] = useState<"new" | "stars">("new");
  const [category, setCategory] = useState("전체");
  const [skills, setSkills] = useState<SkillsData>(snapshot);
  const [status, setStatus] = useState<Status>("loading");
  const [now, setNow] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    setStatus("loading");
    const q = skillQueries();
    try {
      const [fresh, top] = await Promise.all([searchSkills(q.fresh), searchSkills(q.top)]);
      setSkills({ fetched_at: new Date().toISOString(), fresh, top });
      setStatus("live");
    } catch {
      // 비로그인 GitHub API는 분당 10회 제한: 실패하면 마지막 스냅샷 유지
      setStatus("snapshot");
    }
    setNow(Date.now());
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => document.visibilityState === "visible" && refresh(), REFRESH_MS);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      clearInterval(timer);
      clearInterval(tick);
    };
  }, [refresh]);

  const q = query.trim().toLowerCase();
  const match = (text: string) => !q || text.toLowerCase().includes(q);

  const freshList = useMemo(() => {
    const list = skills.fresh.filter((s) => match(`${s.full_name} ${s.description ?? ""} ${s.topics.join(" ")}`));
    return freshSort === "new"
      ? list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      : list.sort((a, b) => b.stars - a.stars);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills, q, freshSort]);

  const topList = useMemo(
    () => skills.top.filter((s) => match(`${s.full_name} ${s.description ?? ""} ${s.topics.join(" ")}`)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [skills, q]
  );

  const appList = useMemo(
    () =>
      appsData.all.filter(
        (a) =>
          (category === "전체" || a.category === category) &&
          match(`${a.full_name} ${a.description ?? ""} ${a.topics.join(" ")}`)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, q]
  );

  const tabs: [Tab, string, number][] = [
    ["fresh", "새로 나온 스킬", skills.fresh.length],
    ["top", "스타 많은 스킬", skills.top.length],
    ["apps", "유틸 앱", appsData.total],
  ];
  const shown = tab === "fresh" ? freshList.length : tab === "top" ? topList.length : appList.length;

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="flex items-center gap-2 font-serif text-lg font-semibold">
            <Spark className="h-5 w-5 text-clay" /> 바이브코딩 데일리
          </span>
          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-xs text-muted transition hover:text-ink"
            title="지금 다시 불러오기"
          >
            <span
              className={`live-dot relative h-2 w-2 rounded-full ${
                status === "live" ? "bg-emerald-500" : status === "loading" ? "bg-clay" : "bg-muted"
              }`}
            />
            {status === "live" && `실시간 · ${relTime(skills.fetched_at, now)} 갱신`}
            {status === "loading" && "불러오는 중…"}
            {status === "snapshot" && `저장본 · ${relTime(skills.fetched_at, now)}`}
            <RefreshCw size={12} className={status === "loading" ? "animate-spin" : ""} />
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <header className="py-12 sm:py-16">
          <p className="text-sm font-medium text-clay">GitHub 스킬 레이더</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[2rem] font-semibold leading-tight sm:text-5xl">
            오늘 올라온 스킬,
            <br />
            지금 뜨는 스킬.
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            GitHub에 새로 공개된 Claude 스킬과 스타를 많이 받은 스킬을 페이지를 여는 순간 바로 불러옵니다.
            열어 두면 3분마다 저절로 새로고침되고, ▲는 마지막 수집 뒤 늘어난 스타 수입니다.
          </p>

          <div className="mt-8 grid max-w-xl grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-card">
            {tabs.map(([key, label, n]) => (
              <div key={key} className="px-4 py-4">
                <p className="font-serif text-2xl font-semibold sm:text-3xl">{n}</p>
                <p className="mt-1 text-xs text-muted">{label}</p>
              </div>
            ))}
          </div>
        </header>

        <div className="sticky top-[57px] z-[5] -mx-4 border-b border-line bg-bg/90 px-4 pb-3 pt-2 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  tab === key ? "bg-ink text-bg" : "text-muted hover:bg-sunken hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-card px-3 py-2.5 focus-within:border-clay">
              <Search size={16} className="shrink-0 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름, 설명, 토픽으로 찾기 (예: design, obsidian, pdf)"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
            </label>
            {tab === "fresh" && (
              <div className="flex rounded-xl border border-line bg-card p-1 text-sm">
                {(
                  [
                    ["new", "최신순"],
                    ["stars", "스타순"],
                  ] as const
                ).map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setFreshSort(k)}
                    className={`rounded-lg px-3 py-1.5 ${freshSort === k ? "bg-clay-soft font-medium text-clay" : "text-muted"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
            {tab === "apps" && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border border-line bg-card px-3 py-2.5 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted">
          {tab === "fresh" && "최근 7일 안에 공개된 스킬 저장소 (스타 2개 이상)"}
          {tab === "top" && "스타 500개 넘는 스킬 저장소, 스타 많은 순"}
          {tab === "apps" && `유틸·윈도우·AI·꾸미기 앱 · ${new Date(appsData.fetched_at).toLocaleDateString("ko-KR")} 수집`}
          {` · ${shown}개`}
        </p>

        {shown === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-line p-12 text-center text-sm text-muted">
            조건에 맞는 항목이 없습니다. 검색어를 바꿔 보세요.
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tab === "fresh" && freshList.map((s) => <SkillCard key={s.id} s={s} now={now} />)}
            {tab === "top" && topList.map((s, i) => <SkillCard key={s.id} s={s} rank={i + 1} now={now} />)}
            {tab === "apps" && appList.map((a) => <AppCard key={a.id} app={a} />)}
          </div>
        )}

        <footer className="mt-16 border-t border-line pt-6 text-xs leading-relaxed text-muted">
          <p>
            스킬 목록은 브라우저에서 GitHub 검색 API를 직접 불러옵니다. 요청 한도(분당 10회)에 걸리면 매시간 저장되는
            저장본을 대신 보여줍니다. 유틸 앱 목록은 GitHub Actions가 매시간 수집합니다.
          </p>
          <a
            href="https://github.com/cassmania/vibe-coding-daily"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-ink hover:text-clay"
          >
            소스 보기 <ArrowUpRight size={12} />
          </a>
        </footer>
      </main>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CATEGORIES, formatStars, timeAgo } from "@/lib/categories";
import type { AppItem, AppsData } from "@/lib/types";
import data from "@/data/apps.json";
import { CalendarDays, Filter, Github, RefreshCw, Search, Star, TrendingUp, MonitorSmartphone } from "lucide-react";

const typed = data as AppsData;

type SortKey = "stars" | "recent" | "new";

function AppCard({ app }: { app: AppItem }) {
  return (
    <a
      href={app.html_url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={app.owner_avatar} alt={app.owner_login} className="h-9 w-9 rounded-full" loading="lazy" />
          <div>
            <p className="text-sm font-semibold leading-tight group-hover:text-blue-600">{app.full_name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {app.language ?? "언어 미상"} · {timeAgo(app.pushed_at)} 업데이트
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          <Star size={12} /> {formatStars(app.stars)}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
        {app.description_ko || app.description || "설명이 없습니다."}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {app.category}
        </span>
        {app.isNew && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            NEW
          </span>
        )}
        {app.topics.slice(0, 3).map((t) => (
          <span key={t} className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            #{t}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
        <span>🍴 {app.forks.toLocaleString()} 포크</span>
        <span className="inline-flex items-center gap-1 font-semibold text-zinc-700 group-hover:text-blue-600 dark:text-zinc-200">
          <Github size={14} /> 저장소 열기
        </span>
      </div>
    </a>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("전체");
  const [sort, setSort] = useState<SortKey>("stars");
  const [section, setSection] = useState<"all" | "daily_new" | "top_starred" | "windows_focus" | "ai_focus" | "desktop_focus">("all");

  const aiList = typed.sections.ai_focus ?? [];
  const desktopList = typed.sections.desktop_focus ?? [];

  const source: AppItem[] = useMemo(() => {
    if (section === "all") return typed.all;
    if (section === "ai_focus") return aiList;
    if (section === "desktop_focus") return desktopList;
    return typed.sections[section];
  }, [section, aiList, desktopList]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = source.filter((a) => {
      const okCat = category === "전체" || a.category === category;
      const okQ =
        !q ||
        a.full_name.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q) ||
        a.topics.join(" ").toLowerCase().includes(q);
      return okCat && okQ;
    });
    list = [...list].sort((a, b) => {
      if (sort === "stars") return b.stars - a.stars;
      if (sort === "recent") return +new Date(b.pushed_at) - +new Date(a.pushed_at);
      return +new Date(b.created_at) - +new Date(a.created_at);
    });
    return list;
  }, [source, query, category, sort]);

  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-10">
      {/* 헤더 */}
      <header className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-blue-900 p-8 text-white md:flex-row md:items-center md:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
            <MonitorSmartphone size={13} /> 유틸 · 윈도우 · AI · 데스크톱 꾸미기 선별
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
            바이브코딩 유틸 일간
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-300">
            GitHub에 매일 올라오는 바이브코딩 앱 중 실용적인 데스크톱 유틸리티 + AI 앱 + 데스크톱 꾸미기 앱만 모았습니다.
            스타 많은 순 · 오늘 올라온 신규 · AI · 꾸미기 순으로 확인하세요. 매일 자동 갱신됩니다.
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <RefreshCw size={12} /> 마지막 수집: {new Date(typed.fetched_at).toLocaleString("ko-KR")} · 총 {typed.total}개
          </p>
        </div>
        <div className="grid grid-cols-5 gap-3 md:w-[30rem]">
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-2xl font-extrabold">{typed.sections.daily_new.length}</p>
            <p className="mt-1 text-[11px] text-zinc-300">오늘의 신규</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-2xl font-extrabold">{typed.sections.top_starred.length}</p>
            <p className="mt-1 text-[11px] text-zinc-300">주간 인기</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-2xl font-extrabold">{typed.sections.windows_focus.length}</p>
            <p className="mt-1 text-[11px] text-zinc-300">윈도우 특화</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-2xl font-extrabold">{aiList.length}</p>
            <p className="mt-1 text-[11px] text-zinc-300">AI 관련</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-center">
            <p className="text-2xl font-extrabold">{desktopList.length}</p>
            <p className="mt-1 text-[11px] text-zinc-300">꾸미기</p>
          </div>
        </div>
      </header>

      {/* 섹션 탭 */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "전체 보기"],
            ["daily_new", "🆕 오늘의 신규"],
            ["top_starred", "⭐ 스타 많은 순"],
            ["windows_focus", "🪟 윈도우 특화"],
            ["ai_focus", "🤖 AI 관련"],
            ["desktop_focus", "🎨 데스크톱 꾸미기"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              section === key
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 검색 + 필터 */}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2.5 dark:bg-zinc-800">
          <Search size={16} className="text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="앱 이름, 설명, 토픽 검색 (예: clipboard, wallpaper, rainmeter, ai)"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </label>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-zinc-500" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="stars">⭐ 스타 순</option>
            <option value="recent">🕒 최근 업데이트 순</option>
            <option value="new">🆕 생성일 순</option>
          </select>
        </div>
      </div>

      {/* 리스트 */}
      <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500">
        {section === "daily_new" ? <CalendarDays size={15} /> : <TrendingUp size={15} />}
        <span>
          {filtered.length}개 표시 중
          {category !== "전체" && ` · ${category}`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed p-12 text-center text-sm text-zinc-500">
          조건에 맞는 앱이 없습니다. 검색어를 바꾸거나 카테고리를 초기화하세요.
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      )}

      <footer className="mt-14 rounded-2xl bg-zinc-100 p-6 text-xs leading-relaxed text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
        <p className="font-bold text-zinc-700 dark:text-zinc-200">매일 자동 갱신되는 방식</p>
        <p className="mt-1">
          ① <code>npm run fetch</code>가 GitHub Search API로 유틸·윈도우·AI·꾸미기 키워드 저장소를 수집 →
          ② <code>data/apps.json</code>으로 저장 → ③ GitHub Actions(<code>.github/workflows/daily.yml</code>)가
          매일 아침 자동 실행·커밋 → ④ Vercel 재배포. 토큰 없이도 동작하지만 시간당 60회 제한이 있어
          <code> GITHUB_TOKEN</code> 설정을 권장합니다.
        </p>
        <p className="mt-2">선별 키워드: windows, file-manager, launcher, clipboard, screenshot, automation, system-monitor, cli, tray, hotkey, backup + ai desktop app, llm chat client, whisper/dictation, ai agent + desktop customization, wallpaper widget, rainmeter, hyprland/tiling, taskbar/start-menu 등 꾸미기 중심.</p>
      </footer>
    </main>
  );
}

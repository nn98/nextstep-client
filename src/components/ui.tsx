import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { Disclaimer as DisclaimerT } from "../types";
import { useSelection } from "../selection";

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-line bg-white shadow-sm ${className}`}>{children}</div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-xs font-semibold tracking-wide text-slate-400">{children}</div>;
}

// 상태 뱃지 — 색+텍스트 병기
function tone(label: string) {
  if (/영업/.test(label)) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (/폐업|철수|종료/.test(label)) return "text-orange-700 bg-orange-50 border-orange-200";
  if (/임대/.test(label)) return "text-orange-700 bg-orange-50 border-orange-200";
  if (/휴업/.test(label)) return "text-amber-700 bg-amber-50 border-amber-200";
  if (/추정/.test(label)) return "text-slate-500 bg-white border-slate-300";
  return "text-slate-600 bg-slate-100 border-slate-200"; // 공실 등
}

export function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone(
        label
      )}`}
    >
      {label}
    </span>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
      {children}
    </span>
  );
}

export function AddressText({
  jibun,
  road,
  emphasis = "jibun",
}: {
  jibun: string;
  road: string;
  emphasis?: "jibun" | "road";
}) {
  const j = emphasis === "jibun";
  return (
    <div className="leading-snug">
      <div className={j ? "font-bold text-slate-900" : "text-sm text-slate-500"}>
        {j ? jibun : road}
      </div>
      <div className={j ? "text-sm text-slate-500" : "font-bold text-slate-900"}>
        {j ? road : jibun}
      </div>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: number | string | null }) {
  return (
    <div className="rounded-xl border border-line bg-slate-50 px-3 py-2.5 text-center">
      <div className="text-lg font-bold text-slate-900">{value ?? "-"}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{label}</div>
    </div>
  );
}

export function Disclaimer({ disclaimer }: { disclaimer: DisclaimerT }) {
  return (
    <p className="mt-6 text-xs text-slate-400">
      기준일 {disclaimer.dataAsOf} · {disclaimer.note}
    </p>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-16 text-center text-slate-500">
      <p className="text-lg font-medium">{title}</p>
      {hint && <p className="mt-2 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-slate-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />;
}

export function SearchBar({
  initial = "",
  onSearch,
}: {
  initial?: string;
  onSearch: (q: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className="flex gap-2"
    >
      <div className="relative flex-1">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="예: 금토동 405"
          aria-label="지번/도로명 검색"
          className="w-full rounded-lg border border-line bg-slate-50 py-3 pl-10 pr-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-lg bg-ink px-5 py-3 font-semibold text-white hover:brightness-110"
      >
        조회
      </button>
    </form>
  );
}

const TABS = [
  { to: "/", label: "조회", end: true },
  { to: "/map", label: "지도", end: false },
];

export function TabNav() {
  const { unitId } = useSelection();
  const base =
    "rounded-full px-5 py-2 text-sm font-semibold transition select-none";
  return (
    <div className="fixed bottom-6 left-1/2 z-[1000] -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-line bg-white/90 p-1 shadow-lg backdrop-blur">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `${base} ${isActive ? "bg-ink text-white" : "text-slate-500 hover:text-slate-800"}`
            }
          >
            {t.label}
          </NavLink>
        ))}
        {unitId ? (
          <NavLink
            to={`/units/${unitId}`}
            className={({ isActive }) =>
              `${base} ${isActive ? "bg-ink text-white" : "text-slate-500 hover:text-slate-800"}`
            }
          >
            상세
          </NavLink>
        ) : (
          <span className={`${base} cursor-not-allowed text-slate-300`}>상세</span>
        )}
      </div>
    </div>
  );
}

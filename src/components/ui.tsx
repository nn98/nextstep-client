import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Disclaimer as DisclaimerT } from "../types";

export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal text-sm font-black text-white shadow">
        N
      </span>
      <span
        className={`text-lg font-extrabold tracking-tight ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        넥스트스텝
      </span>
    </Link>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-line bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// 상태 뱃지 — 색+텍스트 병기(색만으로 구분 금지)
function tone(label: string) {
  if (/영업/.test(label)) return "text-teal-600 bg-emerald-50 border-emerald-200";
  if (/폐업|철수|종료/.test(label)) return "text-flame bg-orange-50 border-orange-200";
  if (/휴업/.test(label)) return "text-amber-700 bg-amber-50 border-amber-200";
  if (/추정/.test(label)) return "text-slate-500 bg-white border-slate-300";
  return "text-slate-600 bg-slate-100 border-slate-200"; // 공실 등
}

export function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone(label)}`}
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

export function AddressText({ jibun, road }: { jibun: string; road: string }) {
  return (
    <div className="min-w-0 leading-snug">
      <div className="truncate font-bold text-ink">{jibun}</div>
      <div className="truncate text-sm text-slate-500">{road}</div>
    </div>
  );
}

export function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number | string | null;
  suffix?: string;
  accent?: "teal" | "flame";
}) {
  const color =
    accent === "flame" ? "text-flame" : accent === "teal" ? "text-teal" : "text-ink";
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tabular-nums ${color}`}>
        {value ?? "–"}
        {value != null && suffix && (
          <span className="ml-0.5 text-sm font-semibold text-slate-400">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export function Disclaimer({ disclaimer }: { disclaimer: DisclaimerT }) {
  return (
    <p className="text-xs leading-relaxed text-slate-400">
      기준일 {disclaimer.dataAsOf} · {disclaimer.note}
    </p>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-12 text-center text-slate-500">
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1.5 text-sm text-slate-400">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-12 text-center">
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
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

export function SearchBar({
  initial = "",
  onSearch,
  size = "lg",
}: {
  initial?: string;
  onSearch: (q: string) => void;
  size?: "lg" | "md";
}) {
  const [value, setValue] = useState(initial);
  const lg = size === "lg";
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(value.trim());
      }}
      className={`flex items-center gap-2 rounded-2xl border border-line bg-white shadow-lg ${
        lg ? "p-2" : "p-1.5"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`ml-2 shrink-0 text-slate-400 ${lg ? "h-5 w-5" : "h-4 w-4"}`}
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
        className={`w-full min-w-0 bg-transparent text-ink placeholder:text-slate-400 focus:outline-none ${
          lg ? "py-2 text-lg" : "py-1 text-sm"
        }`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-xl bg-teal font-bold text-white transition hover:bg-teal-600 ${
          lg ? "px-5 py-2.5" : "px-3.5 py-1.5 text-sm"
        }`}
      >
        조회
      </button>
    </form>
  );
}

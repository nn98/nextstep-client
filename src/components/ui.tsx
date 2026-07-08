import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Disclaimer as DisclaimerT } from "../types";

export function Brand({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
          dark ? "bg-white text-navy" : "bg-accent text-white"
        }`}
      >
        터
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={`text-[15px] font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"}`}
        >
          터봄
        </span>
        {!compact && (
          <span className={`text-sm font-medium ${dark ? "text-white/50" : "text-slate-400"}`}>
            Turbohm
          </span>
        )}
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

// 상태 색 — 뱃지의 점, 그리고 카드 왼쪽 아웃라인에 동일하게 사용(단일 출처)
export function statusColor(label: string): string {
  if (/영업/.test(label)) return "#059669"; // emerald-600
  if (/폐업|철수|종료/.test(label)) return "#b3401e"; // flame
  if (/휴업/.test(label)) return "#b45309"; // amber-700
  if (/추정/.test(label)) return "#94a3b8"; // slate-400
  return "#cbd5e1"; // 공실 등 — slate-300
}

// 상태 표기 — 둥근 뱃지 대신 컬러 점 + 텍스트(색만으로 구분 금지)
export function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/70">
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: statusColor(label) }}
      />
      {label}
    </span>
  );
}

// StatusBadge와 같은 색을 카드 왼쪽 테두리에 입히기 위한 스타일
export function statusAccentStyle(label: string) {
  return { borderLeftColor: statusColor(label) };
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
  accent?: "blue" | "flame";
}) {
  const color =
    accent === "flame" ? "text-flame" : accent === "blue" ? "text-accent" : "text-ink";
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
        className={`shrink-0 rounded-xl bg-ink font-bold text-white transition hover:bg-navy-600 ${
          lg ? "px-5 py-2.5" : "px-3.5 py-1.5 text-sm"
        }`}
      >
        검색
      </button>
    </form>
  );
}

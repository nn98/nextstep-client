import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Disclaimer as DisclaimerT } from "../types";

export function Brand({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black ${
          dark ? "bg-white text-navy" : "bg-navy text-white"
        }`}
      >
        N
      </span>
      <span className="leading-tight">
        <span className={`block text-[15px] font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"}`}>
          넥스트스텝
        </span>
        {!compact && (
          <span className={`block text-[10px] font-semibold tracking-[0.14em] ${dark ? "text-white/45" : "text-ink/35"}`}>
            상가 분석 리포트
          </span>
        )}
      </span>
    </Link>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border border-line bg-panel shadow-sm ${className}`}>{children}</div>
  );
}

// 남색 헤더 바 — 레퍼런스 대시보드의 "분석리포트" 타이틀 바
export function HeaderBar({
  eyebrow,
  title,
  live,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  live?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-navy px-5 py-4 text-white sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-white/50">{eyebrow}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
            {live && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-teal">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-teal" />
                실시간
              </span>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// 상태 표기 — 색+텍스트 병기(색만으로 구분 금지)
function tone(label: string) {
  if (/영업/.test(label)) return "text-teal-600 bg-teal/10 border-teal/20";
  if (/폐업|철수|종료/.test(label)) return "text-rise border-rise/25 bg-rise/10";
  if (/휴업/.test(label)) return "text-amber-700 bg-amber-50 border-amber-200";
  if (/추정/.test(label)) return "text-ink/45 bg-transparent border-ink/20";
  return "text-ink/50 bg-ink/[0.04] border-ink/15"; // 공실 등
}

export function StatusBadge({ label }: { label: string }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-bold ${tone(label)}`}>
      {label}
    </span>
  );
}

export function Pill({ children, tone: t = "neutral" }: { children: ReactNode; tone?: "neutral" | "rise" | "fall" | "teal" }) {
  const cls =
    t === "rise"
      ? "bg-rise/10 text-rise"
      : t === "fall"
      ? "bg-fall/10 text-fall"
      : t === "teal"
      ? "bg-teal/10 text-teal-600"
      : "bg-ink/[0.05] text-ink/60";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{children}</span>
  );
}

export function AddressText({ jibun, road }: { jibun: string; road: string }) {
  return (
    <div className="min-w-0 leading-snug">
      <div className="truncate font-bold text-ink">{jibun}</div>
      <div className="truncate text-sm text-ink/45">{road}</div>
    </div>
  );
}

// KPI 타일 — 레퍼런스 대시보드의 "큰 숫자 + 작은 라벨" 관례
export function Stat({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number | string | null;
  suffix?: string;
  accent?: "rise" | "fall" | "teal";
}) {
  const color = accent === "rise" ? "text-rise" : accent === "fall" ? "text-fall" : accent === "teal" ? "text-teal-600" : "text-ink";
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="text-xs font-bold text-ink/40">{label}</div>
      <div className={`mt-1.5 text-[26px] font-black leading-none tabular-nums ${color}`}>
        {value ?? "–"}
        {value != null && suffix && <span className="ml-1 text-sm font-bold text-ink/35">{suffix}</span>}
      </div>
    </div>
  );
}

// 반원 게이지 — 레퍼런스의 원형 진행바를 우리 데이터(평균 생존)에 맞게 재해석
export function Gauge({
  label,
  value,
  max,
  suffix,
  minLabel,
  maxLabel,
}: {
  label: string;
  value: number | null;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  suffix?: string;
}) {
  const pct = value != null ? Math.min(1, Math.max(0, value / max)) : 0;
  const r = 40;
  const c = Math.PI * r; // 반원 둘레
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className="text-xs font-bold text-ink/40">{label}</div>
      <div className="relative mt-1 flex justify-center">
        <svg viewBox="0 0 100 56" width="120" height="68">
          <path d="M 10 52 A 40 40 0 0 1 90 52" fill="none" stroke="#e4e7ec" strokeWidth="9" strokeLinecap="round" />
          <path
            d="M 10 52 A 40 40 0 0 1 90 52"
            fill="none"
            stroke="var(--color-teal)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c * (1 - pct)}
          />
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <div className="text-xl font-black tabular-nums text-ink">
            {value ?? "–"}
            {value != null && suffix && <span className="ml-0.5 text-xs font-bold text-ink/35">{suffix}</span>}
          </div>
        </div>
      </div>
      {(minLabel || maxLabel) && (
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-ink/30">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}

export function Disclaimer({ disclaimer }: { disclaimer: DisclaimerT }) {
  return (
    <p className="text-xs leading-relaxed text-ink/40">
      기준일 {disclaimer.dataAsOf} · {disclaimer.note}
    </p>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-12 text-center text-ink/55">
      <p className="font-bold">{title}</p>
      {hint && <p className="mt-1.5 text-sm text-ink/35">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-12 text-center">
      <p className="text-ink/65">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-navy px-4 py-2 text-sm font-bold text-white hover:brightness-110"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-ink/[0.06] ${className}`} />;
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
      className={`flex items-center gap-2 rounded-full border border-line bg-panel shadow-sm ${lg ? "p-2" : "p-1.5"}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`ml-2 shrink-0 text-ink/30 ${lg ? "h-5 w-5" : "h-4 w-4"}`}
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
        className={`w-full min-w-0 bg-transparent text-ink placeholder:text-ink/30 focus:outline-none ${
          lg ? "py-2 text-lg" : "py-1 text-sm"
        }`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-full bg-navy font-bold text-white transition hover:bg-navy-600 ${
          lg ? "px-5 py-2.5" : "px-3.5 py-1.5 text-sm"
        }`}
      >
        검색
      </button>
    </form>
  );
}

import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Disclaimer as DisclaimerT } from "../types";

// 관인(官印) — 이 서비스의 시그니처. "지금 유효한 기록"에만 찍는다(영업 중인 가게에만).
export function Seal({
  center = "영업",
  ring = "성남시 수정구",
  size = 84,
  className = "",
}: {
  center?: string;
  ring?: string;
  size?: number;
  className?: string;
}) {
  const uid = useId();
  const pathId = `seal-ring-${uid}`;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={`seal-mark shrink-0 ${className}`}
    >
      <g style={{ transform: "rotate(-8deg)", transformOrigin: "50px 50px" }}>
        <path id={pathId} d="M 50 8 A 42 42 0 1 1 49.9 8" fill="none" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" strokeWidth="1.1" />
        <text fontSize="8" fontWeight={700} letterSpacing="2.5" fill="currentColor">
          <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
            {ring}
          </textPath>
        </text>
        <text
          x="50"
          y="58"
          fontSize="21"
          fontWeight={800}
          fill="currentColor"
          textAnchor="middle"
          fontFamily="var(--font-display)"
        >
          {center}
        </text>
      </g>
    </svg>
  );
}

export function Brand({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <Link to="/" className="flex shrink-0 items-center gap-2.5">
      <span
        className={`flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] font-display text-sm font-bold ${
          dark ? "border-white/70 text-white" : "border-ink text-ink"
        }`}
      >
        넥
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display text-[15px] font-bold tracking-tight ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          넥스트스텝{" "}
          {!compact && (
            <span className={`font-body text-sm font-medium ${dark ? "text-white/60" : "text-ink/50"}`}>
              상가이력 조회
            </span>
          )}
        </span>
        {!compact && (
          <span
            className={`block font-mono text-[9px] font-medium tracking-[0.18em] ${
              dark ? "text-white/40" : "text-ink/35"
            }`}
          >
            NEXT STEP · STOREFRONT REGISTRY
          </span>
        )}
      </span>
    </Link>
  );
}

// 문서 상단 발급 정보 줄 — "발급받은 기록"이라는 느낌의 고정 헤더
export function DocHeader({
  no,
  date,
  dark = false,
}: {
  no: string;
  date: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-b pb-2 font-mono text-[11px] tracking-wide ${
        dark ? "border-white/15 text-white/45" : "border-ledger text-ink/40"
      }`}
    >
      <span>발급번호 {no}</span>
      <span>발급일 {date}</span>
    </div>
  );
}

// 갑구/을구/병구 — 실제 등기부등본 구획 명칭을 그대로 빌린 섹션 헤더
export function LedgerSection({
  mark,
  title,
  aside,
  children,
}: {
  mark: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t-2 border-ink pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="flex items-baseline gap-2">
          <span className="font-display text-sm font-bold text-seal">{mark}</span>
          <span className="font-display text-lg font-bold text-ink">{title}</span>
        </h2>
        {aside && <span className="font-mono text-xs text-ink/40">{aside}</span>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`border border-ledger bg-white/60 ${className}`}>{children}</div>
  );
}

// 상태 표기 — 색+텍스트 병기, 대괄호 라벨(서류 도장/스탬프 어휘)
function tone(label: string) {
  if (/영업/.test(label)) return "text-stamp-navy border-stamp-navy/40 bg-stamp-navy/5";
  if (/폐업|철수|종료/.test(label)) return "text-closed border-closed/40 bg-closed/5";
  if (/휴업/.test(label)) return "text-amber-800 border-amber-700/40 bg-amber-700/5";
  if (/추정/.test(label)) return "text-ink/45 border-ink/25 bg-transparent";
  return "text-ink/45 border-ink/25 bg-ink/[0.03]"; // 공실 등
}

export function StatusBadge({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap border px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wide ${tone(
        label
      )}`}
    >
      〔{label}〕
    </span>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-ledger bg-white/70 px-3 py-1 font-mono text-xs text-ink/60">
      {children}
    </span>
  );
}

export function AddressText({ jibun, road }: { jibun: string; road: string }) {
  return (
    <div className="min-w-0 leading-snug">
      <div className="truncate font-display font-bold text-ink">{jibun}</div>
      <div className="truncate font-mono text-xs text-ink/45">{road}</div>
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
    accent === "flame" ? "text-seal" : accent === "blue" ? "text-stamp-navy" : "text-ink";
  return (
    <div className="border border-ledger px-4 py-3">
      <div className="text-[11px] font-medium tracking-wide text-ink/45">{label}</div>
      <div className={`mt-1 font-mono text-2xl font-bold tabular-nums ${color}`}>
        {value ?? "–"}
        {value != null && suffix && (
          <span className="ml-1 text-xs font-medium text-ink/40">{suffix}</span>
        )}
      </div>
    </div>
  );
}

export function Disclaimer({ disclaimer }: { disclaimer: DisclaimerT }) {
  return (
    <p className="font-mono text-[11px] leading-relaxed text-ink/40">
      기준일 {disclaimer.dataAsOf} · {disclaimer.note}
    </p>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-12 text-center text-ink/60">
      <p className="font-display font-semibold">{title}</p>
      {hint && <p className="mt-1.5 text-sm text-ink/40">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-12 text-center">
      <p className="text-ink/70">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-paper"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-ink/10 ${className}`} />;
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
      className="flex items-end gap-3"
    >
      <label className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] tracking-wide text-ink/40">주소 입력</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="예: 금토동 405"
          aria-label="지번/도로명 검색"
          className={`w-full border-b-2 border-ink bg-transparent font-body text-ink placeholder:text-ink/30 focus:outline-none ${
            lg ? "py-2 text-lg" : "py-1 text-sm"
          }`}
        />
      </label>
      <button
        type="submit"
        className={`shrink-0 border border-ink bg-ink font-medium text-paper transition hover:bg-stamp-navy hover:border-stamp-navy ${
          lg ? "px-5 py-2.5" : "px-3.5 py-1.5 text-sm"
        }`}
      >
        검색
      </button>
    </form>
  );
}

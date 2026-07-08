import { useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUnit } from "../api/client";
import type { ApiError, Tenancy } from "../types";
import { buildSegments, categoryColors, yearTicks } from "../lib/timeline";
import {
  checklist as buildChecklist,
  diagnosis as buildDiagnosis,
  repeatCategoryFailure,
  riskLevel,
  signals as buildSignals,
  yearsSpan,
  type Signal,
} from "../lib/insights";
import {
  Brand,
  Card,
  Disclaimer,
  EmptyState,
  ErrorState,
  FloatingBackButton,
  FloatingTopButton,
  Skeleton,
  Stat,
  StatusBadge,
} from "../components/ui";

const TODAY = new Date().toISOString().slice(0, 10);
const ym = (d: string) => d.slice(0, 7).replace("-", ".");
const period = (t: Tenancy) =>
  t.closedAt ? `${ym(t.licensedAt)} – ${ym(t.closedAt)}` : `${ym(t.licensedAt)} – 현재`;

// ponytail: 계약·주변상권 정보는 neighborhood 데이터셋 미제공 항목만 예시값(가게 인덱스 기반 고정)
function mockExtras(i: number) {
  const pick = <T,>(arr: T[]) => arr[i % arr.length];
  return {
    area: pick(["42.6㎡", "56.2㎡", "33.1㎡", "48.9㎡", "38.5㎡"]),
    deposit: pick(["5,000만", "3,000만", "4,000만", "6,000만", "4,500만"]),
    rent: pick(["280만", "190만", "230만", "310만", "250만"]),
    premium: pick(["무", "3,000만 원", "무", "1,500만 원", "2,000만 원"]),
    foot: pick(["21,400명", "18,700명", "24,100명", "16,900명", "22,800명"]),
    vacancy: pick(["6.2%", "8.1%", "4.7%", "7.4%", "5.5%"]),
  };
}

function InfoRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <dt className="shrink-0 text-slate-400">{k}</dt>
      <dd className="text-right font-semibold text-ink">{v}</dd>
    </div>
  );
}

// 섹션 번호·라벨 — 리포트 전체가 같은 순서 규약을 쓰고 있음을 보여주는 장치
function SectionHeading({
  no,
  label,
  title,
  aside,
}: {
  no: string;
  label: string;
  title: string;
  aside?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <p className="text-xs font-bold tracking-wide text-accent">
          {no} · {label}
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-ink sm:text-2xl">{title}</h2>
      </div>
      {aside && <span className="text-xs text-slate-400">{aside}</span>}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
  tone?: "flame" | "emerald";
}) {
  const box =
    tone === "flame"
      ? "border-flame/25 bg-orange-50"
      : tone === "emerald"
      ? "border-emerald-200 bg-emerald-50"
      : "border-line bg-white";
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${box}`}>
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-1 truncate text-xl font-extrabold text-ink">{value}</div>
      {caption && <div className="mt-1 text-xs text-slate-400">{caption}</div>}
    </div>
  );
}

function Stars({ stars, color }: { stars: number; color: string }) {
  return (
    <span className="text-lg leading-none">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= stars ? color : "#e2e8f0" }}>
          ★
        </span>
      ))}
    </span>
  );
}

function RiskGauge({ stars, label }: { stars: number; label: string }) {
  const color = stars <= 2 ? "#059669" : stars === 3 ? "#d97706" : "#b3401e";
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Stars stars={stars} color={color} />
        <span className="text-sm font-bold" style={{ color }}>
          {label}
        </span>
        <span className="ml-auto text-xs text-slate-400">
          5단계 척도 · 폐업 빈도와 반복 실패 여부 기반
        </span>
      </div>
      <div className="mt-3 grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-2 rounded-full"
            style={{ backgroundColor: i <= stars ? color : "#e2e8f0" }}
          />
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-5 text-center text-[10px] text-slate-400">
        <span>매우 안정</span>
        <span>안정</span>
        <span>보통</span>
        <span>위험</span>
        <span>매우 위험</span>
      </div>
    </div>
  );
}

const SIGNAL_ICON_PATH: Record<Signal["icon"], string> = {
  down: "M12 5v14M5 12l7 7 7-7",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 3",
  warn: "M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  up: "M12 19V5M5 12l7-7 7 7",
};

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 text-accent"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={SIGNAL_ICON_PATH[signal.icon]} />
        </svg>
        <span className="text-xl font-extrabold text-ink">{signal.value}</span>
      </div>
      <div className="mt-2 font-bold text-ink">{signal.title}</div>
      <div className="mt-1 text-sm leading-relaxed text-slate-500">{signal.desc}</div>
    </div>
  );
}

function ChecklistRow({ item }: { item: { title: string; desc: string; status: "ok" | "warn" } }) {
  const ok = item.status === "ok";
  return (
    <li className="flex items-start gap-3 border-b border-line py-3 last:border-0">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}
        aria-hidden
      >
        {ok ? "✓" : "!"}
      </span>
      <div className="min-w-0">
        <div className="font-bold text-ink">{item.title}</div>
        <div className="mt-0.5 text-sm text-slate-500">{item.desc}</div>
      </div>
    </li>
  );
}

// 운영 타임라인: 업종 명암 세그먼트 + 파스텔 하단선 + 포인터 추적 툴팁 + 연도 축
function TimelineBar({
  timeline,
  colors,
  selected,
  onSelect,
}: {
  timeline: Tenancy[];
  colors: Record<string, string>;
  selected: number;
  onSelect: (i: number) => void;
}) {
  const { segments } = buildSegments(timeline, TODAY);
  const ticks = yearTicks(timeline, TODAY);
  const thin = ticks.length > 10;
  const [hover, setHover] = useState<{ x: number; idx: number } | null>(null);

  const handleMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    let acc = 0;
    let idx = -1;
    for (const s of segments) {
      acc += s.widthPct;
      if (pct <= acc) {
        idx = s.kind === "tenancy" ? s.idx : -1;
        break;
      }
    }
    setHover({ x: e.clientX - rect.left, idx });
  };

  const hoverT = hover && hover.idx >= 0 ? timeline[hover.idx] : null;

  return (
    <div>
      <div className="relative" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
        {hover && (
          <div
            className="pointer-events-none absolute -top-9 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-[left] duration-100 ease-out"
            style={{ left: hover.x }}
          >
            {hoverT
              ? `${hoverT.businessName} · ${hoverT.category} · ${hoverT.survivalMonths ?? "-"}개월`
              : "공실"}
          </div>
        )}

        <div className="relative flex h-20 w-full overflow-hidden rounded-xl border border-line shadow-[0_2px_12px_rgba(13,27,42,0.08)]">
          {hover && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-[15] w-full"
              style={{
                background: `radial-gradient(150px 90px at ${hover.x}px 50%, rgba(255,255,255,0.14), rgba(13,27,42,0.07) 62%, transparent 78%)`,
              }}
            />
          )}
          {segments.map((s, i) =>
            s.kind === "vacancy" ? (
              <div
                key={i}
                style={{ width: `${s.widthPct}%` }}
                className="hatch flex items-center justify-center border-l border-white text-[11px] font-semibold text-slate-400"
              >
                {s.widthPct > 6 && "공실"}
              </div>
            ) : (
              <button
                key={i}
                onClick={() => onSelect(s.idx)}
                title={`${timeline[s.idx].businessName} · ${timeline[s.idx].category}`}
                style={{
                  width: `${s.widthPct}%`,
                  backgroundColor: colors[timeline[s.idx].category],
                }}
                className={`relative flex flex-col items-center justify-center overflow-hidden border-l border-white/70 px-1 text-white transition-[opacity] duration-200 ${
                  s.idx === selected ? "z-10 opacity-100" : "opacity-55 hover:opacity-70"
                }`}
              >
                {s.widthPct > 8 && (
                  <>
                    <span className="w-full truncate text-center text-xs font-bold">
                      {timeline[s.idx].businessName}
                    </span>
                    <span className="text-[10px] text-white/80">
                      {timeline[s.idx].survivalMonths ?? "-"}개월
                    </span>
                  </>
                )}
                {s.ongoing && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white" />
                )}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0"
                  style={{
                    height: s.idx === selected ? 6 : 4,
                    background: `linear-gradient(90deg, rgba(255,255,255,0.95), color-mix(in srgb, ${colors[timeline[s.idx].category]} 62%, white))`,
                  }}
                />
              </button>
            )
          )}
        </div>
      </div>

      <div className="relative mt-2 h-6">
        <div className="absolute inset-x-0 top-1 h-px bg-line" />
        {ticks.map((t, i) => (
          <div
            key={t.year}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${t.leftPct}%` }}
          >
            <span className="h-2 w-2 rounded-full bg-slate-300" />
            {(!thin || i % 2 === 0) && (
              <span className="mt-1 text-[10px] tabular-nums text-slate-400">{t.year}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 운영 이력 한 줄: 기간·가게·생존 막대(과거→현재 순, 가장 최근이 아래)
function RecordRow({
  t,
  color,
  maxMonths,
  isLast,
  selected,
  onSelect,
}: {
  t: Tenancy;
  color: string;
  maxMonths: number;
  isLast: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const pct = Math.max(4, ((t.survivalMonths ?? 0) / maxMonths) * 100);
  return (
    <li className="relative pl-7">
      {!isLast && <span className="absolute left-[7px] top-6 h-full w-px bg-line" />}
      <span
        className="absolute left-0 top-4 h-4 w-4 rounded-full border-4 border-white shadow"
        style={{ backgroundColor: color }}
      />
      <button
        onClick={onSelect}
        className={`mb-2 w-full rounded-xl border px-4 py-3 text-left transition ${
          selected ? "border-navy/30 bg-slate-50 shadow-sm" : "border-line bg-white hover:bg-slate-50"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-bold text-ink">{t.businessName}</span>
            <span className="shrink-0 text-sm text-slate-400">{t.category}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {t.closedAtEstimated && <StatusBadge label="폐업일 추정" />}
            <StatusBadge label={t.status} />
          </span>
        </div>
        <div className="mt-1 text-sm font-semibold tabular-nums text-slate-500">{period(t)}</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-slate-500">
            {t.survivalMonths ?? "-"}개월
          </span>
        </div>
      </button>
    </li>
  );
}

export default function Unit() {
  const { unitId } = useParams();
  const [selected, setSelected] = useState(0);

  const q = useQuery({
    queryKey: ["unit", unitId],
    queryFn: () => getUnit(unitId!),
    enabled: !!unitId,
  });

  const sitePnu = unitId?.split("-U")[0];
  const mapLink = sitePnu ? `/map?pnu=${sitePnu}` : "/map";

  if (q.isLoading) {
    return (
      <div className="min-h-dvh bg-paper">
        <FloatingBackButton to={mapLink} />
        <div className="h-52 bg-navy" />
        <div className="mx-auto -mt-16 max-w-4xl space-y-4 px-5">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    const notFound = (q.error as unknown as ApiError)?.error === "UNIT_NOT_FOUND";
    return (
      <div className="min-h-dvh bg-paper">
        <FloatingBackButton to={mapLink} />
        <div className="mx-auto max-w-xl px-5 pt-20">
          <Card className="p-6">
            <ErrorState
              message={notFound ? "해당 물건을 찾을 수 없습니다." : "불러오는 중 문제가 발생했어요."}
              onRetry={notFound ? undefined : () => q.refetch()}
            />
            <div className="pb-4 text-center">
              <Link to="/" className="text-sm font-semibold text-accent hover:underline">
                검색으로 돌아가기
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!q.data) return null;
  const { unit, statistics, timeline, neighborhood, disclaimer } = q.data;
  const colors = categoryColors(timeline.map((t) => t.category));
  const last = timeline[timeline.length - 1];
  const isOpen = last?.status === "영업";
  const sel = timeline[selected];
  const extras = mockExtras(selected);
  const maxMonths = Math.max(...timeline.map((t) => t.survivalMonths ?? 0), 1);

  const risk = riskLevel(statistics.closedCount);
  const repeat = repeatCategoryFailure(timeline);
  const span = yearsSpan(timeline, TODAY);
  const diagnosisLines = buildDiagnosis(statistics, timeline, TODAY);
  const signalCards = buildSignals(statistics, timeline, TODAY);
  const checklistItems = buildChecklist(statistics, timeline, neighborhood, TODAY);

  return (
    <div className="min-h-dvh bg-paper pb-16">
      <FloatingBackButton to={mapLink} />
      <FloatingTopButton />

      {/* 네이비 히어로 */}
      <div className="relative overflow-hidden bg-navy pb-24 pt-4 text-white">
        <div
          aria-hidden
          className="grid-bg-dark pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="relative mx-auto w-full max-w-4xl px-5 pl-16 sm:pl-5">
          <Brand dark />
          <div className="fade-up mt-8">
            <p className="text-sm text-white/60">
              {unit.jibunAddress} · {unit.roadAddress}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{unit.label}</h1>
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold backdrop-blur">
                <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-mint" : "bg-slate-400"}`} />
                {isOpen ? `지금은 ${last.businessName} 영업 중` : "지금은 비어 있어요"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto -mt-16 w-full max-w-4xl space-y-4 px-5">
        {/* 01 · SUMMARY */}
        <Card className="fade-up p-5 sm:p-6">
          <SectionHeading no="01" label="SUMMARY" title="한눈에 보는 자리 요약" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryTile label="위험도" value={<Stars stars={risk.stars} color="#1f2937" />} caption={risk.label} />
            <SummaryTile label={`최근 ${span}년 폐업`} value={`${statistics.closedCount}회`} />
            <SummaryTile
              label="평균 생존기간"
              value={statistics.averageSurvivalMonths != null ? `${statistics.averageSurvivalMonths}개월` : "-"}
            />
            <SummaryTile
              label="현재 업종"
              value={isOpen ? last.businessName : "공실"}
              caption={isOpen ? `${last.survivalMonths}개월 운영중` : "현재 비어 있어요"}
            />
            <SummaryTile
              label="현재 운영기간"
              value={isOpen ? `${last.survivalMonths}개월` : "-"}
              caption={isOpen ? "안정적으로 지속" : "공실 상태"}
            />
            <SummaryTile
              label="반복 실패 업종"
              value={repeat.category ?? "해당 없음"}
              caption={repeat.repeated ? `동일 업종 ${repeat.count}회 반복` : "동일 업종 반복 없음"}
              tone={repeat.repeated ? "flame" : "emerald"}
            />
          </div>
        </Card>

        {timeline.length === 0 ? (
          <Card className="p-6">
            <EmptyState title="영업 이력이 없어요" />
          </Card>
        ) : (
          <>
            {/* 02 · 운영 타임라인 */}
            <Card className="fade-up p-5 sm:p-6">
              <SectionHeading
                no="02"
                label="TIMELINE"
                title="운영 타임라인"
                aside={`${ym(timeline[0].licensedAt)} – ${isOpen ? "현재" : ym(last.closedAt ?? TODAY)}`}
              />
              <TimelineBar timeline={timeline} colors={colors} selected={selected} onSelect={setSelected} />
              <div className="mt-4 inline-flex max-w-full divide-x divide-line overflow-x-auto rounded-full border border-line bg-white shadow-[0_1px_5px_rgba(13,27,42,0.13)]">
                {Object.entries(colors).map(([cat, color]) => (
                  <span
                    key={cat}
                    className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-1.5 text-sm font-semibold text-slate-600"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {cat}
                  </span>
                ))}
              </div>
            </Card>

            {/* 03 · 매장 세부정보 */}
            <Card className="fade-up p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionHeading no="03" label="DETAIL" title="매장 세부정보" />
                <select
                  value={selected}
                  onChange={(e) => setSelected(Number(e.target.value))}
                  aria-label="가게 선택"
                  className="mb-4 h-fit rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-accent focus:outline-none"
                >
                  {timeline.map((t, i) => (
                    <option key={i} value={i}>
                      {t.businessName} · {period(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div key={selected} className="fade-up grid gap-3 sm:grid-cols-2">
                <section className="rounded-xl border border-line bg-slate-50 p-4">
                  <h3 className="text-xs font-bold tracking-wide text-slate-400">인허가 정보</h3>
                  <dl className="mt-3 space-y-2">
                    <InfoRow k="상호명" v={sel.businessName} />
                    <InfoRow k="업종" v={sel.category} />
                    <InfoRow k="개업일자" v={sel.licensedAt} />
                    <InfoRow
                      k="폐업일자"
                      v={
                        sel.closedAt ? (
                          <span className="inline-flex items-center gap-1.5">
                            {sel.closedAt}
                            {sel.closedAtEstimated && <StatusBadge label="추정" />}
                          </span>
                        ) : (
                          "영업중"
                        )
                      }
                    />
                    <InfoRow k="영업기간" v={`${sel.survivalMonths ?? "-"}개월`} />
                    <InfoRow k="영업상태" v={<StatusBadge label={sel.status} />} />
                  </dl>
                </section>

                <section className="rounded-xl border border-dashed border-line bg-white p-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-400">
                    계약·주변상권 정보
                    {!neighborhood && <StatusBadge label="예시" />}
                  </h3>
                  <dl className="mt-3 space-y-2">
                    <InfoRow k="전용면적" v={extras.area} />
                    <InfoRow k="보증금 / 월세" v={`${extras.deposit} / ${extras.rent} 원`} />
                    <InfoRow k="권리금" v={extras.premium} />
                    <InfoRow k="일평균 유동인구" v={extras.foot} />
                    {neighborhood ? (
                      <>
                        <InfoRow
                          k={`반경 ${neighborhood.radiusMeters}m 동일 업종`}
                          v={`${neighborhood.sameCategoryCount}곳`}
                        />
                        <InfoRow k="반경 내 전체 점포" v={`${neighborhood.totalStoreCount}곳`} />
                      </>
                    ) : (
                      <InfoRow k={`주변 같은 업종(${sel.category})`} v="자료 없음" />
                    )}
                    <InfoRow k="주변 공실률" v={extras.vacancy} />
                  </dl>
                  <p className="mt-3 text-[11px] text-slate-400">
                    {neighborhood
                      ? `주변상권 기준일 ${neighborhood.snapshotAt} · 면적·보증금 등 일부 항목은 예시값입니다.`
                      : "실 데이터 연동 전 예시값입니다."}
                  </p>
                </section>
              </div>
            </Card>

            {/* 04 · 종합 분석 */}
            <Card className="fade-up p-5 sm:p-6">
              <SectionHeading no="04" label="DIAGNOSIS" title="이 자리의 진단" />
              <ul className="space-y-2.5">
                {diagnosisLines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-ink/80">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {line}
                  </li>
                ))}
              </ul>
            </Card>

            {/* 05 · 위험도 */}
            <Card className="fade-up p-5 sm:p-6">
              <SectionHeading no="05" label="RISK" title="계약 위험도" />
              <RiskGauge stars={risk.stars} label={risk.label} />
            </Card>

            {/* 06 · 핵심 인사이트 */}
            <Card className="fade-up p-5 sm:p-6">
              <SectionHeading no="06" label="INSIGHT" title="자리를 관통하는 4가지 신호" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {signalCards.map((s) => (
                  <SignalCard key={s.title} signal={s} />
                ))}
              </div>
            </Card>

            {/* 07 · 운영 이력(드롭다운형 타임라인) */}
            <Card className="fade-up p-5 sm:p-6">
              <SectionHeading no="07" label="HISTORY" title="이 자리에서 있었던 일들" aside="가장 최근이 아래입니다" />
              <ol>
                {timeline.map((t, i) => (
                  <RecordRow
                    key={i}
                    t={t}
                    color={colors[t.category]}
                    maxMonths={maxMonths}
                    isLast={i === timeline.length - 1}
                    selected={i === selected}
                    onSelect={() => setSelected(i)}
                  />
                ))}
              </ol>
            </Card>

            {/* 08 · 통계 */}
            <Card className="fade-up p-5 sm:p-6">
              <SectionHeading no="08" label="STATS" title="숫자로 보는 자리" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat label="총 폐업" value={statistics.closedCount} suffix="회" accent="flame" />
                <Stat label="평균 생존기간" value={statistics.averageSurvivalMonths} suffix="개월" accent="blue" />
                <Stat label="최장 운영" value={statistics.longestSurvivalMonths} suffix="개월" />
                <Stat label="최단 운영" value={statistics.shortestSurvivalMonths} suffix="개월" />
                <Stat label="동일 업종 실패" value={repeat.count} suffix="회" />
              </div>
            </Card>

            {/* 09 · 계약 체크리스트 */}
            <Card className="fade-up p-5 sm:p-6">
              <SectionHeading no="09" label="CHECKLIST" title="서명하기 전에, 이것만은 확인하세요" />
              <ul>
                {checklistItems.map((item) => (
                  <ChecklistRow key={item.title} item={item} />
                ))}
              </ul>
            </Card>
          </>
        )}

        <div className="fade-up flex flex-col items-center gap-3 border-t border-line pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="text-xs text-slate-400">이 리포트는 계약 전 검토를 돕기 위한 참고 자료입니다.</p>
          <div className="flex shrink-0 gap-2">
            <Link
              to="/"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-accent/40"
            >
              다른 자리 분석하기
            </Link>
            <Link
              to="/#about-section"
              className="rounded-full bg-navy px-4 py-2 text-sm font-bold text-white transition hover:bg-navy-600"
            >
              서비스 소개로
            </Link>
          </div>
        </div>
        <Disclaimer disclaimer={disclaimer} />
      </main>
    </div>
  );
}

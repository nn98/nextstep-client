import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUnit } from "../api/client";
import type { ApiError, Tenancy } from "../types";
import { buildSegments, categoryColors, yearTicks } from "../lib/timeline";
import {
  Brand,
  Card,
  Disclaimer,
  EmptyState,
  ErrorState,
  Skeleton,
  Stat,
  StatusBadge,
} from "../components/ui";

const TODAY = new Date().toISOString().slice(0, 10);
const ym = (d: string) => d.slice(0, 7).replace("-", ".");
const period = (t: Tenancy) =>
  t.closedAt ? `${ym(t.licensedAt)} – ${ym(t.closedAt)}` : `${ym(t.licensedAt)} – 현재`;

// 운영기간 라인: 업종 색 세그먼트 + 연도 축
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

  return (
    <div>
      <div className="flex h-20 w-full overflow-hidden rounded-xl border border-line">
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
              className={`relative flex flex-col items-center justify-center overflow-hidden border-l border-white/70 px-1 text-white transition ${
                s.idx === selected
                  ? "z-10 ring-2 ring-inset ring-navy"
                  : "opacity-85 hover:opacity-100"
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
            </button>
          )
        )}
      </div>

      {/* 하단 연도 축 */}
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

// 세부 입점 기록 한 줄: 기간·가게·생존 막대
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
      {/* 타임라인 세로선·점 */}
      {!isLast && <span className="absolute left-[7px] top-6 h-full w-px bg-line" />}
      <span
        className="absolute left-0 top-4 h-4 w-4 rounded-full border-4 border-white shadow"
        style={{ backgroundColor: color }}
      />
      <button
        onClick={onSelect}
        className={`mb-2 w-full rounded-xl border px-4 py-3 text-left transition ${
          selected
            ? "border-navy/30 bg-slate-50 shadow-sm"
            : "border-line bg-white hover:bg-slate-50"
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
        <div className="mt-1 text-sm font-semibold tabular-nums text-slate-500">
          {period(t)}
        </div>
        {/* 생존개월 가로 막대 */}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
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
        <div className="h-52 bg-navy" />
        <div className="mx-auto -mt-16 max-w-4xl space-y-4 px-5">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (q.isError) {
    const notFound = (q.error as unknown as ApiError)?.error === "UNIT_NOT_FOUND";
    return (
      <div className="mx-auto max-w-xl px-5 pt-20">
        <Card className="p-6">
          <ErrorState
            message={notFound ? "해당 물건을 찾을 수 없습니다." : "불러오는 중 문제가 발생했어요."}
            onRetry={notFound ? undefined : () => q.refetch()}
          />
          <div className="pb-4 text-center">
            <Link to="/" className="text-sm font-semibold text-teal hover:underline">
              검색으로 돌아가기
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!q.data) return null;
  const { unit, statistics, timeline, disclaimer } = q.data;
  const colors = categoryColors(timeline.map((t) => t.category));
  const last = timeline[timeline.length - 1];
  const isOpen = last?.status === "영업";
  const sel = timeline[selected];
  const maxMonths = Math.max(...timeline.map((t) => t.survivalMonths ?? 0), 1);

  return (
    <div className="min-h-dvh bg-paper">
      {/* 네이비 히어로 */}
      <div className="bg-navy pb-24 pt-4 text-white">
        <div className="mx-auto w-full max-w-4xl px-5">
          <div className="flex items-center justify-between">
            <Brand dark />
            <Link
              to={mapLink}
              className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              ← 지도로
            </Link>
          </div>
          <div className="fade-up mt-8">
            <p className="text-sm text-white/60">
              {unit.jibunAddress} · {unit.roadAddress}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                {unit.label}
              </h1>
              <span className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold backdrop-blur">
                <span
                  className={`h-2 w-2 rounded-full ${isOpen ? "bg-mint" : "bg-slate-400"}`}
                />
                {isOpen ? `현재 ${last.businessName} 영업중` : "현재 공실"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto -mt-16 w-full max-w-4xl space-y-4 px-5 pb-16">
        {/* 통계 */}
        <div className="fade-up grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="거쳐간 가게" value={statistics.totalTenancyCount} suffix="곳" />
          <Stat label="폐업" value={statistics.closedCount} suffix="건" accent="flame" />
          <Stat
            label="평균 생존"
            value={statistics.averageSurvivalMonths}
            suffix="개월"
            accent="teal"
          />
          <Stat
            label="최장 / 최단"
            value={
              statistics.longestSurvivalMonths != null
                ? `${statistics.longestSurvivalMonths} / ${statistics.shortestSurvivalMonths}`
                : null
            }
            suffix="개월"
          />
        </div>

        {timeline.length === 0 ? (
          <Card className="p-6">
            <EmptyState title="영업 이력이 없어요" />
          </Card>
        ) : (
          <>
            {/* 운영기간 라인 */}
            <Card className="fade-up p-5 sm:p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-extrabold text-ink">운영기간 라인</h2>
                <span className="text-sm text-slate-400">
                  {ym(timeline[0].licensedAt)} – {isOpen ? "현재" : ym(last.closedAt ?? TODAY)}
                </span>
              </div>

              <div className="mt-4">
                <TimelineBar
                  timeline={timeline}
                  colors={colors}
                  selected={selected}
                  onSelect={setSelected}
                />
              </div>

              {/* 선택됨 요약 */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-slate-50 px-4 py-3">
                <span className="text-xs font-bold text-slate-400">선택됨</span>
                <span className="font-extrabold text-ink">{sel.businessName}</span>
                <span className="text-sm tabular-nums text-slate-500">{period(sel)}</span>
                <span className="ml-auto flex items-center gap-2 text-sm text-slate-500">
                  {sel.category} · {sel.survivalMonths ?? "-"}개월
                  <StatusBadge label={sel.status} />
                </span>
              </div>

              {/* 범례 */}
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                {Object.entries(colors).map(([cat, color]) => (
                  <span key={cat} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="h-2 w-3.5 rounded-sm" style={{ backgroundColor: color }} />
                    {cat}
                  </span>
                ))}
              </div>
            </Card>

            {/* 세부 입점 기록 */}
            <Card className="fade-up p-5 sm:p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-extrabold text-ink">세부 입점 기록</h2>
                <span className="text-sm text-slate-400">최신순 · 막대는 생존개월</span>
              </div>
              <ol className="mt-4">
                {timeline
                  .map((t, i) => ({ t, i }))
                  .reverse()
                  .map(({ t, i }, order, arr) => (
                    <RecordRow
                      key={i}
                      t={t}
                      color={colors[t.category]}
                      maxMonths={maxMonths}
                      isLast={order === arr.length - 1}
                      selected={i === selected}
                      onSelect={() => setSelected(i)}
                    />
                  ))}
              </ol>
              <div className="mt-3 border-t border-line pt-3">
                <Disclaimer disclaimer={disclaimer} />
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

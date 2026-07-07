import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUnit } from "../api/client";
import type { ApiError, Tenancy } from "../types";
import { buildSegments, categoryColors, yearTicks } from "../lib/timeline";
import { useSelection } from "../selection";
import {
  Card,
  Eyebrow,
  Pill,
  Stat,
  StatusBadge,
  Skeleton,
  EmptyState,
  ErrorState,
} from "../components/ui";

const TODAY = new Date().toISOString().slice(0, 10);
const ym = (d: string) => d.slice(0, 7).replace("-", ".");
const period = (t: Tenancy) =>
  t.closedAt ? `${ym(t.licensedAt)} – ${ym(t.closedAt)}` : `${ym(t.licensedAt)} – 현재`;

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

  // 세그먼트는 무채색 명암차로 구분, 업종 색은 하단 스트립으로만
  const GRAYS = ["#3f4a5e", "#5b6577", "#727c8d"];

  return (
    <div>
      {/* 세그먼트 막대 (연도는 넣지 않음) */}
      <div className="flex h-16 w-full overflow-hidden rounded-xl border border-line">
        {segments.map((s, i) =>
          s.kind === "vacancy" ? (
            <div
              key={i}
              style={{ width: `${s.widthPct}%` }}
              className="flex items-center justify-center border-l border-white bg-slate-100 text-[11px] text-slate-400"
            >
              {s.widthPct > 6 && "공실"}
            </div>
          ) : (
            <button
              key={i}
              onClick={() => onSelect(s.idx)}
              title={`${timeline[s.idx].businessName} · ${timeline[s.idx].category}`}
              style={{ width: `${s.widthPct}%`, backgroundColor: GRAYS[s.idx % GRAYS.length] }}
              className={`relative flex items-center justify-center overflow-hidden border-l border-white/60 px-1 text-white transition ${
                s.idx === selected ? "z-10 ring-2 ring-inset ring-slate-900" : "opacity-90 hover:opacity-100"
              }`}
            >
              {s.widthPct > 7 && (
                <span className="truncate pb-1.5 text-xs font-semibold">
                  {timeline[s.idx].businessName}
                </span>
              )}
              {/* 업종 색 오버레이 라벨 */}
              <span
                className="absolute inset-x-0 bottom-0 h-1.5"
                style={{ backgroundColor: colors[timeline[s.idx].category] }}
              />
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

function RecordRow({
  t,
  color,
  selected,
  onSelect,
}: {
  t: Tenancy;
  color: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const ongoing = t.status === "영업";
  return (
    <button
      onClick={onSelect}
      className={`grid w-full grid-cols-[auto_1fr_auto] items-center gap-x-3 rounded-xl border px-4 py-3 text-left transition sm:grid-cols-[130px_1fr_1fr_auto] ${
        selected ? "border-slate-300 bg-slate-50" : "border-line bg-white hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className={`text-sm font-semibold ${ongoing ? "text-blue-600" : "text-slate-500"}`}>
          {period(t)}
        </span>
      </span>
      <span className="truncate font-semibold text-slate-900">{t.businessName}</span>
      <span className="hidden text-sm text-slate-500 sm:block">{t.category}</span>
      <span className="flex items-center justify-end gap-1">
        {t.closedAtEstimated && <StatusBadge label="추정" />}
        <StatusBadge label={t.status} />
      </span>
    </button>
  );
}

export default function Unit() {
  const { unitId } = useParams();
  const { select } = useSelection();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (unitId) select(unitId);
  }, [unitId, select]);

  const q = useQuery({
    queryKey: ["unit", unitId],
    queryFn: () => getUnit(unitId!),
    enabled: !!unitId,
  });

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (q.isError) {
    const notFound = (q.error as unknown as ApiError)?.error === "UNIT_NOT_FOUND";
    return (
      <Card className="p-6">
        <ErrorState
          message={notFound ? "해당 물건을 찾을 수 없습니다." : "불러오는 중 문제가 발생했어요."}
          onRetry={notFound ? undefined : () => q.refetch()}
        />
      </Card>
    );
  }

  if (!q.data) return null;
  const { unit, statistics, timeline, disclaimer } = q.data;
  const colors = categoryColors(timeline.map((t) => t.category));
  const last = timeline[timeline.length - 1];
  const isOpen = last?.status === "영업";
  const sel = timeline[selected];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <Eyebrow>조회 주소 · {unit.jibunAddress}</Eyebrow>
          <h1 className="mt-1 truncate text-2xl font-bold text-slate-900">{unit.label}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill>
            <span className={`h-2 w-2 rounded-full ${isOpen ? "bg-emerald-500" : "bg-slate-400"}`} />
            {isOpen ? `현재 ${last.businessName} 영업중` : "현재 공실"}
          </Pill>
          <Pill>거쳐간 가게 {statistics.totalTenancyCount}곳</Pill>
        </div>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="거쳐간 가게" value={statistics.totalTenancyCount} />
        <Stat label="폐업" value={statistics.closedCount} />
        <Stat label="평균 생존(월)" value={statistics.averageSurvivalMonths} />
        <Stat label="최장 / 최단(월)" value={
          statistics.longestSurvivalMonths != null
            ? `${statistics.longestSurvivalMonths} / ${statistics.shortestSurvivalMonths}`
            : null
        } />
      </div>

      {timeline.length === 0 ? (
        <Card className="p-6"><EmptyState title="영업 이력이 없어요" /></Card>
      ) : (
        <>
          {/* 운영기간 라인 */}
          <Card className="p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-slate-900">히스토리</h2>
              <span className="text-sm text-slate-400">이 자리를 거쳐간 가게</span>
            </div>

            <div className="mt-4">
              <TimelineBar timeline={timeline} colors={colors} selected={selected} onSelect={setSelected} />
            </div>

            {/* 선택됨 요약 */}
            <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:grid-cols-[80px_1fr_1fr_auto]">
              <span className="text-xs font-semibold text-slate-400">선택됨</span>
              <span className="font-bold text-slate-900">{sel.businessName}</span>
              <span className="hidden text-sm text-slate-500 sm:block">{period(sel)}</span>
              <span className="flex items-center justify-end gap-2 text-sm text-slate-500">
                {sel.category} · {sel.survivalMonths ?? "-"}개월
                <StatusBadge label={sel.status} />
              </span>
            </div>

            {/* 범례 (업종 색) */}
            <div className="mt-3 flex flex-wrap gap-x-2.5 gap-y-1">
              {Object.entries(colors).map(([cat, color]) => (
                <span key={cat} className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="h-1.5 w-3 rounded-sm" style={{ backgroundColor: color }} />
                  {cat}
                </span>
              ))}
            </div>
          </Card>

          {/* 세부 입점 기록 (최신순) */}
          <Card className="p-5">
            <h2 className="text-lg font-bold text-slate-900">세부 입점 기록</h2>
            <div className="mt-3 space-y-2">
              {timeline
                .map((t, i) => ({ t, i }))
                .reverse()
                .map(({ t, i }) => (
                  <RecordRow
                    key={i}
                    t={t}
                    color={colors[t.category]}
                    selected={i === selected}
                    onSelect={() => setSelected(i)}
                  />
                ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              기준일 {disclaimer.dataAsOf} · {disclaimer.note}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

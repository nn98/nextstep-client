import { useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
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

// ponytail: 계약·주변상권 정보는 API 미제공 — 데모용 예시값(가게 인덱스 기반 고정)
function mockExtras(i: number) {
  const pick = <T,>(arr: T[]) => arr[i % arr.length];
  return {
    area: pick(["42.6㎡", "56.2㎡", "33.1㎡", "48.9㎡", "38.5㎡"]),
    deposit: pick(["5,000만", "3,000만", "4,000만", "6,000만", "4,500만"]),
    rent: pick(["280만", "190만", "230만", "310만", "250만"]),
    premium: pick(["무", "3,000만 원", "무", "1,500만 원", "2,000만 원"]),
    foot: pick(["21,400명", "18,700명", "24,100명", "16,900명", "22,800명"]),
    peers: pick([14, 9, 17, 11, 12]),
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

  // 포인터 위치(%) → 해당 세그먼트 인덱스
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
      <div
        className="relative"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* 포인터를 따라 흐르는 툴팁 */}
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

        <div className="flex h-20 w-full overflow-hidden rounded-xl border border-line shadow-[0_2px_12px_rgba(13,27,42,0.08)]">
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
                className={`relative flex flex-col items-center justify-center overflow-hidden border-l border-white/70 px-1 text-white transition-[opacity,filter] duration-150 ${
                  s.idx === selected
                    ? "brightness-110"
                    : "opacity-90 hover:opacity-100 hover:brightness-110"
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
                {/* 흰색→업종 파스텔 그라데이션 하단선 */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
                  style={{
                    background: `linear-gradient(90deg, rgba(255,255,255,0.9), color-mix(in srgb, ${colors[timeline[s.idx].category]} 55%, white))`,
                  }}
                />
              </button>
            )
          )}
        </div>
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
            <Link to="/" className="text-sm font-semibold text-accent hover:underline">
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
  const extras = mockExtras(selected);
  const maxMonths = Math.max(...timeline.map((t) => t.survivalMonths ?? 0), 1);

  return (
    <div className="min-h-dvh bg-paper">
      {/* 네이비 히어로 */}
      <div className="relative overflow-hidden bg-navy pb-24 pt-4 text-white">
        <div
          aria-hidden
          className="grid-bg-dark pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <div className="relative mx-auto w-full max-w-4xl px-5">
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
                {isOpen ? `지금은 ${last.businessName} 영업 중` : "지금은 비어 있어요"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto -mt-16 w-full max-w-4xl space-y-4 px-5 pb-16">
        {/* 통계 */}
        <div className="fade-up grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="거쳐간 가게" value={statistics.totalTenancyCount} suffix="곳" />
          <Stat label="폐업" value={statistics.closedCount} suffix="번" accent="flame" />
          <Stat
            label="평균 영업 기간"
            value={statistics.averageSurvivalMonths}
            suffix="개월"
            accent="blue"
          />
          <Stat
            label="가장 길게 / 짧게"
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
                <h2 className="text-lg font-extrabold text-ink">운영 타임라인</h2>
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

              {/* 범례 — 업종 종류 */}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(colors).map(([cat, color]) => (
                  <span
                    key={cat}
                    className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-semibold text-slate-600"
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                    {cat}
                  </span>
                ))}
              </div>
            </Card>

            {/* 가게 상세 정보 — 막대·기록·드롭다운 어디서 선택해도 여기로 반영 */}
            <Card className="fade-up p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-ink">가게 자세히 보기</h2>
                <select
                  value={selected}
                  onChange={(e) => setSelected(Number(e.target.value))}
                  aria-label="가게 선택"
                  className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink focus:border-accent focus:outline-none"
                >
                  {timeline.map((t, i) => (
                    <option key={i} value={i}>
                      {t.businessName} · {period(t)}
                    </option>
                  ))}
                </select>
              </div>

              {/* key로 선택 변경 시 페이드 재생 */}
              <div key={selected} className="fade-up mt-4 grid gap-3 sm:grid-cols-2">
                {/* 인허가 정보 */}
                <section className="rounded-xl border border-line bg-slate-50 p-4">
                  <h3 className="text-xs font-bold tracking-wide text-slate-400">
                    인허가 정보
                  </h3>
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

                {/* 계약·주변상권 (예시) */}
                <section className="rounded-xl border border-dashed border-line bg-white p-4">
                  <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-slate-400">
                    계약·주변상권 정보
                    <StatusBadge label="예시" />
                  </h3>
                  <dl className="mt-3 space-y-2">
                    <InfoRow k="전용면적" v={extras.area} />
                    <InfoRow k="보증금 / 월세" v={`${extras.deposit} / ${extras.rent} 원`} />
                    <InfoRow k="권리금" v={extras.premium} />
                    <InfoRow k="일평균 유동인구" v={extras.foot} />
                    <InfoRow k={`주변 같은 업종(${sel.category})`} v={`${extras.peers}곳`} />
                    <InfoRow k="주변 공실률" v={extras.vacancy} />
                  </dl>
                  <p className="mt-3 text-[11px] text-slate-400">
                    실 데이터 연동 전 예시값입니다.
                  </p>
                </section>
              </div>
            </Card>

            {/* 세부 입점 기록 */}
            <Card className="fade-up p-5 sm:p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-extrabold text-ink">입점 기록</h2>
                <span className="text-sm text-slate-400">최근 가게부터 · 막대 길이는 영업 기간</span>
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

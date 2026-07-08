import { useState, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getUnit } from "../api/client";
import type { ApiError, Tenancy } from "../types";
import { buildSegments, categoryColors, yearTicks } from "../lib/timeline";
import {
  Card,
  Disclaimer,
  EmptyState,
  ErrorState,
  Gauge,
  HeaderBar,
  Pill,
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
      <dt className="shrink-0 text-ink/40">{k}</dt>
      <dd className="text-right font-bold text-ink">{v}</dd>
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
            className="pointer-events-none absolute -top-9 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-navy px-3 py-1.5 text-xs font-bold text-white shadow-lg transition-[left] duration-100 ease-out"
            style={{ left: hover.x }}
          >
            {hoverT
              ? `${hoverT.businessName} · ${hoverT.category} · ${hoverT.survivalMonths ?? "-"}개월`
              : "공실"}
          </div>
        )}

        <div className="relative flex h-20 w-full overflow-hidden rounded-xl border border-line">
          {hover && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 z-[15] w-full"
              style={{
                background: `radial-gradient(150px 90px at ${hover.x}px 50%, rgba(255,255,255,0.14), rgba(20,37,66,0.07) 62%, transparent 78%)`,
              }}
            />
          )}
          {segments.map((s, i) =>
            s.kind === "vacancy" ? (
              <div
                key={i}
                style={{ width: `${s.widthPct}%` }}
                className="hatch flex items-center justify-center border-l border-white text-[11px] font-semibold text-ink/40"
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
            <span className="h-2 w-2 rounded-full bg-ink/15" />
            {(!thin || i % 2 === 0) && (
              <span className="mt-1 text-[10px] tabular-nums text-ink/35">{t.year}</span>
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
      {!isLast && <span className="absolute left-[7px] top-6 h-full w-px bg-line" />}
      <span
        className="absolute left-0 top-4 h-4 w-4 rounded-full border-4 border-white shadow"
        style={{ backgroundColor: color }}
      />
      <button
        onClick={onSelect}
        className={`mb-2 w-full rounded-xl border px-4 py-3 text-left transition ${
          selected ? "border-navy/25 bg-navy/[0.03]" : "border-line bg-white hover:bg-ink/[0.02]"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-bold text-ink">{t.businessName}</span>
            <span className="shrink-0 text-sm text-ink/40">{t.category}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            {t.closedAtEstimated && <StatusBadge label="폐업일 추정" />}
            <StatusBadge label={t.status} />
          </span>
        </div>
        <div className="mt-1 text-sm font-bold tabular-nums text-ink/50">{period(t)}</div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/[0.07]">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-ink/50">
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
        <div className="mx-auto max-w-4xl space-y-4 px-5 pt-5">
          <Skeleton className="h-28 w-full rounded-2xl" />
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
            <Link to="/" className="text-sm font-bold text-navy hover:underline">
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
  const gaugeMax = Math.max(statistics.longestSurvivalMonths ?? 0, 24);

  return (
    <div className="min-h-dvh bg-paper">
      <div className="mx-auto w-full max-w-4xl space-y-4 px-5 py-5">
        <div className="fade-up">
          <HeaderBar eyebrow={`${unit.jibunAddress} · ${unit.roadAddress}`} title={unit.label} live={isOpen}>
            <div className="flex items-center gap-2">
              <Link
                to={mapLink}
                className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                ← 지도로
              </Link>
            </div>
          </HeaderBar>
          <p className="mt-3 px-1 text-sm text-ink/55">
            {isOpen ? `지금은 ${last.businessName} 영업 중` : "지금은 비어 있어요"}
          </p>
        </div>

        {/* KPI 타일 */}
        <div className="fade-up grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="거쳐간 가게" value={statistics.totalTenancyCount} suffix="곳" />
          <Stat label="폐업" value={statistics.closedCount} suffix="번" accent="rise" />
          <Gauge
            label="평균 영업 기간"
            value={statistics.averageSurvivalMonths}
            max={gaugeMax}
            suffix="개월"
            minLabel="0개월"
            maxLabel={`${gaugeMax}개월`}
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
            {/* 운영 타임라인 */}
            <Card className="fade-up p-5 sm:p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-extrabold text-ink">운영 타임라인</h2>
                <span className="text-sm text-ink/35">
                  {ym(timeline[0].licensedAt)} – {isOpen ? "현재" : ym(last.closedAt ?? TODAY)}
                </span>
              </div>

              <div className="mt-4">
                <TimelineBar timeline={timeline} colors={colors} selected={selected} onSelect={setSelected} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(colors).map(([cat, color]) => (
                  <Pill key={cat}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    {cat}
                  </Pill>
                ))}
              </div>
            </Card>

            {/* 가게 자세히 보기 */}
            <Card className="fade-up p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold text-ink">가게 자세히 보기</h2>
                <select
                  value={selected}
                  onChange={(e) => setSelected(Number(e.target.value))}
                  aria-label="가게 선택"
                  className="rounded-full border border-line bg-white px-3.5 py-2 text-sm font-bold text-ink focus:border-navy/40 focus:outline-none"
                >
                  {timeline.map((t, i) => (
                    <option key={i} value={i}>
                      {t.businessName} · {period(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div key={selected} className="fade-up mt-4 grid gap-3 sm:grid-cols-2">
                <section className="rounded-xl border border-line bg-ink/[0.02] p-4">
                  <h3 className="text-xs font-bold tracking-wide text-ink/40">인허가 정보</h3>
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
                  <h3 className="flex items-center gap-2 text-xs font-bold tracking-wide text-ink/40">
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
                  <p className="mt-3 text-[11px] text-ink/35">실 데이터 연동 전 예시값입니다.</p>
                </section>
              </div>
            </Card>

            {/* 세부 입점 기록 */}
            <Card className="fade-up p-5 sm:p-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-extrabold text-ink">입점 기록</h2>
                <span className="text-sm text-ink/35">최근 가게부터 · 막대 길이는 영업 기간</span>
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
      </div>
    </div>
  );
}

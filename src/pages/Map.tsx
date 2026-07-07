import {
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapContainer,
  TileLayer,
  Marker,
  ZoomControl,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { search, featuredSites, getSite } from "../api/client";
import type { Candidate } from "../types";
import {
  Brand,
  Disclaimer,
  EmptyState,
  SearchBar,
  Skeleton,
  StatusBadge,
} from "../components/ui";

// 외부 이미지 대신 인라인 SVG 핀(깨짐 방지)
const pinIcon = (active: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${
        active ? "#16202e" : "#94a7c4"
      }" stroke="white" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="5.5" fill="white"/>
    </svg>`,
  });

const DEFAULT_CENTER: [number, number] = [37.4013, 127.1047];
type Located = Candidate & { latitude: number; longitude: number };

// 지도 빈 곳 클릭 → 패널 접기(마커 클릭은 map click으로 전파되지 않음)
function MapClick({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick });
  return null;
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 17);
    else map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 17 });
    setTimeout(() => map.invalidateSize(), 0);
  }, [map, JSON.stringify(points)]);
  return null;
}

export default function MapPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const pnuParam = params.get("pnu");
  const navigate = useNavigate();
  const [selPnu, setSelPnu] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  // 클릭 지점에서 화면을 덮으며 이동하는 전환
  const [cover, setCover] = useState<{ x: number; y: number; c: string } | null>(null);
  const coverGo = (to: string, e: ReactMouseEvent, c: string) => {
    setCover({ x: e.clientX, y: e.clientY, c });
    setTimeout(() => navigate(to), 340);
  };

  const list = useQuery({
    queryKey: ["map", q],
    queryFn: () => (q ? search(q).then((r) => r.candidates) : featuredSites()),
  });

  const candidates = (list.data ?? []).filter(
    (c): c is Located => c.latitude != null && c.longitude != null
  );
  const points = candidates.map((c) => [c.latitude, c.longitude] as [number, number]);

  // pnu 파라미터 있으면 그 자리, 없으면 첫 후보 선택
  const ids = candidates.map((c) => c.pnu).join(",");
  useEffect(() => {
    if (!candidates.length) return;
    const wanted =
      pnuParam && candidates.some((c) => c.pnu === pnuParam) ? pnuParam : null;
    if (wanted) setSelPnu(wanted);
    else if (!candidates.some((c) => c.pnu === selPnu)) setSelPnu(candidates[0].pnu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids, pnuParam]);

  const site = useQuery({
    queryKey: ["site", selPnu],
    queryFn: () => getSite(selPnu!),
    enabled: !!selPnu,
  });

  const selected = candidates.find((c) => c.pnu === selPnu);

  return (
    <div className="fixed inset-0">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={16}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        {/* 파스텔톤 라이트 타일(CARTO Positron) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />
        <MapClick onClick={() => setCollapsed(true)} />
        <FitBounds points={points} />
        {candidates.map((c) => (
          <Marker
            key={c.pnu}
            position={[c.latitude, c.longitude]}
            icon={pinIcon(c.pnu === selPnu)}
            zIndexOffset={c.pnu === selPnu ? 1000 : 0}
            eventHandlers={{
              click: () => {
                setSelPnu(c.pnu);
                setCollapsed(false);
              },
            }}
          />
        ))}
      </MapContainer>

      {/* 플로팅 UI */}
      <div className="pointer-events-none absolute inset-0 z-[1000] flex flex-col p-4 sm:p-5">
        {/* 상단: 브랜드 + 검색(포커스 시 확장) */}
        <div className="pointer-events-auto flex w-full max-w-[420px] items-center gap-3 transition-all duration-300 focus-within:max-w-[600px]">
          {/* Link 기본 이동을 가로채 커버 전환 후 이동 */}
          <div
            onClickCapture={(e) => {
              e.preventDefault();
              e.stopPropagation();
              coverGo("/", e, "#f6f7f9");
            }}
            className="cursor-pointer rounded-2xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur transition hover:shadow-xl"
          >
            <Brand compact />
          </div>
          <div className="min-w-0 flex-1">
            <SearchBar
              size="md"
              initial={q}
              onSearch={(v) => setParams(v ? { q: v } : {})}
            />
          </div>
        </div>

        {/* 좌측(모바일: 하단) 플로팅 패널 — 지도 클릭 시 슬라이드 아웃 */}
        <div className="flex min-h-0 flex-1 flex-col sm:mt-4">
          <aside
            className={`pointer-events-auto mt-auto flex max-h-[58dvh] w-full flex-col overflow-hidden rounded-2xl bg-white/95 shadow-2xl backdrop-blur transition-all duration-300 sm:mt-0 sm:max-h-full sm:w-[420px] ${
              collapsed
                ? "pointer-events-none translate-y-[130%] opacity-0 sm:-translate-x-[120%] sm:translate-y-0"
                : ""
            }`}
          >
            {list.isLoading && (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            )}

            {list.isError && (
              <EmptyState title="검색 중 문제가 발생했어요." hint="다시 시도해 주세요." />
            )}

            {list.isSuccess && candidates.length === 0 && (
              <EmptyState
                title={q ? `‘${q}’ 주소의 기록을 찾지 못했어요` : "표시할 자리가 없어요"}
                hint="다른 지번으로 검색해 보세요."
              />
            )}

            {candidates.length > 0 && (
              <>
                {/* 자리(후보) 선택 */}
                {candidates.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto border-b border-line p-3">
                    {candidates.map((c) => (
                      <button
                        key={c.pnu}
                        onClick={() => setSelPnu(c.pnu)}
                        className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                          c.pnu === selPnu
                            ? "bg-navy text-white"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {c.jibunAddress.split(" ").slice(-2).join(" ")}
                      </button>
                    ))}
                  </div>
                )}

                {/* 선택된 자리 요약 */}
                <div className="border-b border-line px-5 py-4">
                  <div className="text-xs font-semibold text-slate-400">선택한 자리</div>
                  <div className="mt-1 truncate text-lg font-extrabold text-ink">
                    {selected?.jibunAddress}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-slate-500">
                    {selected?.roadAddress}
                  </div>
                  <div className="mt-2 flex gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                      물건 {selected?.unitCount}개
                    </span>
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-flame">
                      누적 폐업 {selected?.closedCount}건
                    </span>
                  </div>
                </div>

                {/* 물건 목록 */}
                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  <div className="px-2 pb-2 text-xs font-semibold text-slate-400">
                    물건을 선택하면 히스토리를 볼 수 있어요
                  </div>
                  {site.isLoading ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : site.data?.units.length === 0 ? (
                    <EmptyState title="등록된 물건이 없어요" />
                  ) : (
                    <ul className="space-y-2">
                      {site.data?.units
                        .slice()
                        .sort((a, b) => b.closedCount - a.closedCount)
                        .map((u) => (
                          <li key={u.unitId}>
                            <button
                              onClick={(e) => coverGo(`/units/${u.unitId}`, e, "#0d1b2a")}
                              className="grid w-full grid-cols-[1fr_auto] items-center gap-x-3 rounded-xl border border-line bg-white px-4 py-3 text-left transition hover:border-accent/50 hover:shadow-md"
                            >
                              <span className="min-w-0">
                                <span className="flex items-center gap-2">
                                  <span className="font-bold text-ink">{u.label}</span>
                                  <StatusBadge label={u.currentStatus} />
                                </span>
                                <span className="mt-0.5 block truncate text-sm text-slate-500">
                                  {u.currentBusinessName ?? "현재 공실"} ·{" "}
                                  {u.totalTenancyCount}곳 거쳐감 · 폐업 {u.closedCount}
                                  {u.averageSurvivalMonths != null &&
                                    ` · 평균 ${u.averageSurvivalMonths}개월`}
                                </span>
                              </span>
                              <svg
                                viewBox="0 0 24 24"
                                className="h-4 w-4 text-slate-300"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m9 6 6 6-6 6" />
                              </svg>
                            </button>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                {site.data && (
                  <div className="border-t border-line px-5 py-3">
                    <Disclaimer disclaimer={site.data.disclaimer} />
                  </div>
                )}
              </>
            )}
          </aside>
        </div>

        {/* 접힌 패널 다시 열기 */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="fade-up pointer-events-auto absolute bottom-6 left-4 flex items-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-bold text-white shadow-xl transition hover:bg-navy-600 sm:left-5"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            물건 목록
          </button>
        )}
      </div>

      {/* 커버 전환 오버레이 */}
      {cover && (
        <div
          className="cover-expand fixed inset-0 z-[2000]"
          style={
            {
              backgroundColor: cover.c,
              "--cx": `${cover.x}px`,
              "--cy": `${cover.y}px`,
            } as CSSProperties
          }
        />
      )}
    </div>
  );
}

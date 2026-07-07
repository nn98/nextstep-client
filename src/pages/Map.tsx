import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { search, featuredSites, getSite } from "../api/client";
import type { Candidate } from "../types";
import { useSelection } from "../selection";
import { Card, Eyebrow, Pill, StatusBadge, Skeleton, EmptyState } from "../components/ui";

// 외부 이미지 대신 인라인 SVG 핀(깨짐 방지)
const pinIcon = (active: boolean) =>
  L.divIcon({
    className: "",
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    html: `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 25 15 25s15-14.5 15-25C30 6.7 23.3 0 15 0z" fill="${
        active ? "#363c4a" : "#2f8f7d"
      }" stroke="white" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="5.5" fill="white"/>
    </svg>`,
  });

const DEFAULT_CENTER: [number, number] = [37.4013, 127.1047];
type Located = Candidate & { latitude: number; longitude: number };

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 17);
    else map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 17 });
    setTimeout(() => map.invalidateSize(), 0);
  }, [map, JSON.stringify(points)]);
  return null;
}

export default function MapPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const pnuParam = params.get("pnu");
  const navigate = useNavigate();
  const { select } = useSelection();
  const [selPnu, setSelPnu] = useState<string | null>(null);

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
  const totalUnits = candidates.reduce((a, c) => a + c.unitCount, 0);
  const totalClosed = candidates.reduce((a, c) => a + c.closedCount, 0);
  const openUnit = (unitId: string) => {
    select(unitId);
    navigate(`/units/${unitId}`);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <Eyebrow>조회 주소</Eyebrow>
          <div className="mt-1 text-2xl font-bold text-slate-900">
            {selected?.jibunAddress ?? q ?? "지도"}
          </div>
        </div>
        <Pill>
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-teal" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21s-7-6.3-7-11a7 7 0 1 1 14 0c0 4.7-7 11-7 11Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          자리 {candidates.length}곳 · 물건 {totalUnits}개 · 누적 폐업 {totalClosed}건
        </Pill>
      </Card>

      {list.isError && <Card className="p-6"><EmptyState title="검색 중 문제가 발생했어요." /></Card>}
      {list.isSuccess && candidates.length === 0 && (
        <Card className="p-6">
          <EmptyState
            title={q ? `‘${q}’ 주소의 기록을 찾지 못했어요` : "표시할 자리가 없어요"}
            hint="다른 지번으로 검색해 보세요."
          />
        </Card>
      )}

      {candidates.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* 지도 */}
          <Card className="overflow-hidden p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">
                선택: {selected?.jibunAddress.split(" ").slice(-1)[0] ?? "-"}
              </span>
              <span className="rounded-full border border-line bg-slate-50 px-3 py-1 text-xs text-slate-500">
                핀을 눌러 자리 선택
              </span>
            </div>
            <div className="h-[300px] overflow-hidden rounded-xl lg:h-[420px]">
              <MapContainer center={DEFAULT_CENTER} zoom={16} scrollWheelZoom className="h-full w-full">
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds points={points} />
                {candidates.map((c) => (
                  <Marker
                    key={c.pnu}
                    position={[c.latitude, c.longitude]}
                    icon={pinIcon(c.pnu === selPnu)}
                    zIndexOffset={c.pnu === selPnu ? 1000 : 0}
                    eventHandlers={{ click: () => setSelPnu(c.pnu) }}
                  />
                ))}
              </MapContainer>
            </div>
          </Card>

          {/* 물건 목록 */}
          <Card className="p-5">
            <h2 className="text-lg font-bold text-slate-900">건물 및 세부 물건</h2>

            <div className="mt-3 rounded-xl border border-line bg-slate-50 p-4">
              {site.isLoading || !site.data ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <>
                  <div className="font-bold text-slate-900">{site.data.site.jibunAddress}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {site.data.site.roadAddress} · 물건 {site.data.units.length}개 · 누적 폐업{" "}
                    {site.data.units.reduce((a, u) => a + u.closedCount, 0)}건
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto_auto] items-center gap-x-3 border-b border-line px-2 pb-2 text-xs font-semibold text-slate-400">
              <span>층/호수 · 현재 업종</span>
              <span className="text-right">이력</span>
              <span className="text-right">상태</span>
            </div>

            {site.isLoading ? (
              <div className="mt-2 space-y-2">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : site.data?.units.length === 0 ? (
              <EmptyState title="등록된 물건이 없어요" />
            ) : (
              <ul className="mt-1 divide-y divide-line">
                {site.data?.units
                  .slice()
                  .sort((a, b) => b.closedCount - a.closedCount)
                  .map((u) => (
                    <li key={u.unitId}>
                      <button
                        onClick={() => openUnit(u.unitId)}
                        className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-x-3 rounded-lg px-2 py-3 text-left hover:bg-slate-50"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900">{u.label}</span>
                          <span className="block truncate text-sm text-slate-500">
                            {u.currentBusinessName ?? "현재 공실"}
                          </span>
                        </span>
                        <span className="whitespace-nowrap text-right text-xs text-slate-500">
                          {u.totalTenancyCount}곳 · 폐업 {u.closedCount}
                        </span>
                        <span className="text-right">
                          <StatusBadge label={u.currentStatus} />
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}

            {site.data && (
              <p className="mt-4 text-xs text-slate-400">
                기준일 {site.data.disclaimer.dataAsOf} · {site.data.disclaimer.note}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* 지도용 재검색 */}
      <div className="pt-1">
        <MiniSearch initial={q} onSearch={(v) => setParams(v ? { q: v } : {})} />
      </div>
    </div>
  );
}

function MiniSearch({ initial, onSearch }: { initial: string; onSearch: (q: string) => void }) {
  const [v, setV] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(v.trim());
      }}
      className="mx-auto flex max-w-md gap-2"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="다른 주소 검색"
        className="flex-1 rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
      />
      <button className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110">
        검색
      </button>
    </form>
  );
}

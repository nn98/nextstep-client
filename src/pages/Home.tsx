import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { search } from "../api/client";
import {
  Card,
  Eyebrow,
  Pill,
  SearchBar,
  AddressText,
  EmptyState,
  ErrorState,
  Skeleton,
} from "../components/ui";

const CHIPS = ["금토동 405", "판교로 22", "시흥동 123"];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["search", query],
    queryFn: () => search(query!),
    enabled: query !== null,
  });

  const pick = (pnu: string) =>
    navigate(`/map?q=${encodeURIComponent(query ?? "")}&pnu=${pnu}`);

  return (
    <div className="mx-auto max-w-xl">
      <div className="pt-8 text-center sm:pt-14">
        <Eyebrow>조회 시작</Eyebrow>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          지번을 입력하세요
        </h1>
        <p className="mt-3 text-slate-500">
          그 자리를 거쳐간 가게들의 개·폐업 히스토리와 생존 통계를 확인하세요
        </p>
      </div>

      <Card className="mt-8 p-5">
        <div className="text-xs font-semibold text-slate-400">조회 주소</div>
        <div className="mt-2">
          <SearchBar onSearch={(v) => v && setQuery(v)} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="py-1 text-xs text-slate-400">예시</span>
          {CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => setQuery(c)}
              className="rounded-full border border-line bg-slate-50 px-3 py-1 text-sm text-slate-600 hover:border-slate-400 hover:text-slate-900"
            >
              {c}
            </button>
          ))}
        </div>
      </Card>

      {/* 검색 결과 목록 */}
      <div className="mt-4">
        {query === null && (
          <button
            onClick={() => navigate("/map")}
            className="mx-auto flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            지도에서 바로 둘러보기
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        )}

        {q.isLoading && (
          <div className="space-y-2">
            {[0, 1].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        )}

        {q.isError && (
          <Card className="p-4">
            <ErrorState message="검색 중 문제가 발생했어요." onRetry={() => q.refetch()} />
          </Card>
        )}

        {q.data && q.data.candidates.length === 0 && (
          <Card className="p-4">
            <EmptyState title="기록을 찾지 못했어요" hint="다른 지번으로 검색해 보세요." />
          </Card>
        )}

        {q.data && q.data.candidates.length > 0 && (
          <>
            <div className="mb-2 px-1 text-xs font-semibold text-slate-400">
              검색 결과 {q.data.candidates.length}건
            </div>
            <ul className="space-y-2">
              {q.data.candidates.map((c) => (
                <li key={c.pnu}>
                  <button
                    onClick={() => pick(c.pnu)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-white p-4 text-left transition hover:border-slate-300 hover:shadow-sm"
                  >
                    <AddressText jibun={c.jibunAddress} road={c.roadAddress} />
                    <span className="flex shrink-0 items-center gap-2">
                      <Pill>물건 {c.unitCount} · 폐업 {c.closedCount}</Pill>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

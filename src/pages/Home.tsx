import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { search } from "../api/client";
import {
  AddressText,
  Brand,
  EmptyState,
  ErrorState,
  Pill,
  SearchBar,
  Skeleton,
} from "../components/ui";

const CHIPS = ["금토동 405", "판교로 22", "시흥동 123"];

const STEPS: [string, string][] = [
  ["지번 검색", "지번·도로명 일부만 입력"],
  ["물건 선택", "지도에서 건물과 점포 선택"],
  ["히스토리 확인", "개·폐업 기록과 생존 통계"],
];

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
    <div className="relative min-h-dvh overflow-hidden bg-navy text-white">
      {/* 배경 장식 */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-flame/10 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <Brand dark />
        <Link
          to="/map"
          className="rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          지도로 바로 둘러보기 →
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:pt-16">
        <div className="fade-up text-center">
          <p className="text-sm font-bold tracking-[0.2em] text-mint">
            상가 이력 조회
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            이 자리, 몇 번이나
            <br />
            바뀌었을까
          </h1>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            지번만 입력하면 그 자리를 거쳐간 가게들의
            개·폐업 히스토리와 생존 통계를 보여드립니다.
          </p>
        </div>

        <div className="fade-up-delay mt-8">
          <SearchBar onSearch={(v) => v && setQuery(v)} />
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-white/40">예시</span>
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setQuery(c)}
                className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-white/80 transition hover:border-mint/60 hover:text-white"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 전: 이용 3단계 온보딩 */}
        {query === null && (
          <ol className="fade-up-delay mx-auto mt-14 grid max-w-lg gap-3 sm:grid-cols-3">
            {STEPS.map(([title, desc], i) => (
              <li
                key={title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur"
              >
                <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-teal text-xs font-bold">
                  {i + 1}
                </span>
                <div className="mt-2 font-bold">{title}</div>
                <div className="mt-1 text-xs leading-relaxed text-white/50">{desc}</div>
              </li>
            ))}
          </ol>
        )}

        {/* 검색 결과 */}
        {query !== null && (
          <section className="mt-8">
            {q.isLoading && (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl bg-white/10" />
                ))}
              </div>
            )}

            {q.isError && (
              <div className="rounded-2xl bg-white p-4 text-ink">
                <ErrorState message="검색 중 문제가 발생했어요." onRetry={() => q.refetch()} />
              </div>
            )}

            {q.data && q.data.candidates.length === 0 && (
              <div className="rounded-2xl bg-white p-4 text-ink">
                <EmptyState
                  title={`‘${query}’의 기록을 찾지 못했어요`}
                  hint="다른 지번으로 검색해 보세요."
                />
              </div>
            )}

            {q.data && q.data.candidates.length > 0 && (
              <>
                <div className="mb-2 px-1 text-xs font-semibold text-white/50">
                  검색 결과 {q.data.candidates.length}건 · 선택하면 지도로 이동합니다
                </div>
                <ul className="space-y-2">
                  {q.data.candidates.map((c) => (
                    <li key={c.pnu} className="fade-up">
                      <button
                        onClick={() => pick(c.pnu)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                      >
                        <AddressText jibun={c.jibunAddress} road={c.roadAddress} />
                        <span className="flex shrink-0 items-center gap-2">
                          <Pill>
                            물건 {c.unitCount} · 폐업 {c.closedCount}
                          </Pill>
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
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="absolute inset-x-0 bottom-0 z-10 pb-5 text-center text-xs text-white/30">
        인허가 신고 기준 데이터로 실제 영업 현황과 차이가 있을 수 있습니다.
      </footer>
    </div>
  );
}

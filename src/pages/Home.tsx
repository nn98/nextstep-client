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
  ["지번 검색", "상가 주소(지번·도로명) 일부만 입력하면 이력이 있는 자리를 찾아드립니다"],
  ["물건 선택", "지도에서 건물을 고르고 층·호수 단위 물건까지 선택합니다"],
  ["히스토리 확인", "거쳐간 가게 수, 폐업 이력, 평균 생존개월을 한눈에 확인합니다"],
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
    <div className="relative min-h-dvh bg-paper">
      {/* 매트릭스 그리드 배경(아래로 갈수록 사라짐) */}
      <div
        aria-hidden
        className="grid-bg pointer-events-none absolute inset-x-0 top-0 h-[560px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <header className="relative z-10 border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Brand />
          <Link
            to="/map"
            className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-ink"
          >
            지도로 둘러보기 →
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-3xl px-5 pb-24 pt-14 sm:pt-20">
        <div className="fade-up">
          <span className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-bold text-accent shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            창업예정자·신규 창업자를 위한 상가 이력 조회
          </span>
          <h1 className="mt-6 text-4xl font-black leading-[1.18] tracking-tight text-ink sm:text-5xl">
            이 자리, 지금까지
            <br />
            <span className="text-accent">몇 개의 가게</span>가 거쳐갔을까요?
          </h1>
          <p className="mt-5 max-w-xl leading-relaxed text-slate-500">
            지번 하나로 그 자리를 거쳐간 가게들의 개업·폐업 이력, 업종 변화,
            평균 생존기간을 확인합니다. 권리금과 임대료 뒤에 숨은 자리의 진짜 이력 —
            계약서에 도장을 찍기 전에 데이터로 검증하세요.
          </p>
        </div>

        <div className="fade-up-delay mt-8 max-w-xl">
          <SearchBar onSearch={(v) => v && setQuery(v)} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">예시</span>
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setQuery(c)}
                className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm text-slate-600 transition hover:border-accent/50 hover:text-accent"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 전: 이용 3단계 온보딩 */}
        {query === null && (
          <ol className="fade-up-delay mt-14 grid gap-3 sm:grid-cols-3">
            {STEPS.map(([title, desc], i) => (
              <li
                key={title}
                className="rounded-2xl border border-line bg-white p-5 shadow-sm"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                  {i + 1}
                </span>
                <div className="mt-3 font-bold text-ink">{title}</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</div>
              </li>
            ))}
          </ol>
        )}

        {/* 검색 결과 */}
        {query !== null && (
          <section className="mt-8 max-w-xl">
            {q.isLoading && (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            )}

            {q.isError && (
              <div className="rounded-2xl border border-line bg-white p-4">
                <ErrorState message="검색 중 문제가 발생했어요." onRetry={() => q.refetch()} />
              </div>
            )}

            {q.data && q.data.candidates.length === 0 && (
              <div className="rounded-2xl border border-line bg-white p-4">
                <EmptyState
                  title={`‘${query}’의 기록을 찾지 못했어요`}
                  hint="다른 지번으로 검색해 보세요."
                />
              </div>
            )}

            {q.data && q.data.candidates.length > 0 && (
              <>
                <div className="mb-2 px-1 text-xs font-semibold text-slate-400">
                  검색 결과 {q.data.candidates.length}건 · 선택하면 지도로 이동합니다
                </div>
                <ul className="space-y-2">
                  {q.data.candidates.map((c) => (
                    <li key={c.pnu} className="fade-up">
                      <button
                        onClick={() => pick(c.pnu)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
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

      <footer className="absolute inset-x-0 bottom-0 z-10 pb-5 text-center text-xs text-slate-400">
        인허가 신고 기준 데이터로 실제 영업 현황과 차이가 있을 수 있습니다.
      </footer>
    </div>
  );
}

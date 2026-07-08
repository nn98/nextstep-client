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
  ["점포 선택", "지도에서 건물을 고르고 층·호수 단위 점포까지 선택합니다"],
  ["히스토리 확인", "거쳐간 가게 수, 폐업 이력, 평균 생존개월을 한눈에 확인합니다"],
];

const REASONS: [string, string][] = [
  ["자리 단위로 봅니다", "상권 전체 통계가 아니라, 계약서에 도장 찍기 전 그 층·호수의 기록만 봅니다."],
  ["원본 그대로 보여드립니다", "통계로 뭉개지 않고, 인허가 데이터의 개업·폐업 이력을 시간순 그대로 옮겼습니다."],
  ["판단은 사용자의 몫입니다", "결론을 대신 내리지 않습니다. 근거가 되는 기록만 정직하게 드립니다."],
];

const FACTS: [string, string][] = [
  ["데이터 출처", "성남시 인허가"],
  ["단위", "자리(PNU)·물건(호실)"],
  ["기준", "개업·폐업 이력"],
  ["대상", "창업예정자·신규 창업자"],
];

function ScrollHint() {
  return (
    <a
      href="#about-section"
      className="relative z-10 flex flex-col items-center gap-1 pb-4 text-xs font-semibold text-slate-400 transition hover:text-ink"
    >
      더 알아보기
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 motion-safe:animate-bounce"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </a>
  );
}

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
    <div className="h-dvh snap-y snap-mandatory overflow-y-scroll scroll-smooth bg-paper">
      {/* 1/2 — 검색 화면. 뷰포트 한 화면에 맞춰 스냅 */}
      <section
        id="search-section"
        className="relative flex h-dvh snap-start snap-always flex-col overflow-hidden"
      >
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

        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-5">
          <div className="mx-auto w-full max-w-3xl py-5 sm:py-7">
            {query === null ? (
              <>
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
                  <div className="mt-3 flex items-center gap-2">
                    <span className="shrink-0 text-xs text-slate-400">예시</span>
                    <div className="flex overflow-x-auto divide-x divide-line rounded-full border border-line bg-white">
                      {CHIPS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setQuery(c)}
                          className="shrink-0 whitespace-nowrap px-3.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-accent"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <ol className="fade-up-delay mt-6 hidden max-w-2xl gap-3 sm:grid sm:grid-cols-3">
                  {STEPS.map(([title, desc], i) => (
                    <li key={title} className="rounded-2xl border border-line bg-white p-3.5 shadow-sm">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <div className="mt-2.5 font-bold text-ink">{title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</div>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <div className="max-w-xl">
                <div className="fade-up flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black tracking-tight text-ink">검색 결과</h2>
                  <button
                    onClick={() => setQuery(null)}
                    className="shrink-0 text-sm font-semibold text-slate-500 hover:text-ink"
                  >
                    ← 다시 찾기
                  </button>
                </div>

                <div className="fade-up-delay mt-4">
                  <SearchBar initial={query} size="md" onSearch={(v) => v && setQuery(v)} />
                </div>

                {/* 안내문 자리를 미리 확보 — 로딩→결과 전환 시 아래 목록이 밀리지 않도록 */}
                <div className="mt-4 h-4 px-1 text-xs font-semibold text-slate-400">
                  {q.isLoading ? (
                    <Skeleton className="h-3 w-40" />
                  ) : (
                    q.data &&
                    q.data.candidates.length > 0 &&
                    `${q.data.candidates.length}곳을 찾았어요 · 누르면 지도로 이어져요`
                  )}
                </div>

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
                              점포 {c.unitCount} · 폐업 {c.closedCount}
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
                )}
              </div>
            )}
          </div>
        </div>

        <ScrollHint />
      </section>

      {/* 2/2 — About Us */}
      <section
        id="about-section"
        className="relative flex min-h-dvh snap-start snap-always flex-col bg-white px-5"
      >
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-16">
          <a href="#search-section" className="text-xs font-semibold text-slate-400 hover:text-ink">
            ↑ 다시 검색하기
          </a>
          <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-bold text-accent">
            About 넥스트스텝
          </span>
          <h2 className="mt-5 text-3xl font-black leading-[1.25] tracking-tight text-ink sm:text-4xl">
            숫자가 아니라,
            <br />이 자리가 겪어온 일을 보여드립니다.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-slate-500">
            넥스트스텝은 상권 통계 서비스가 아닙니다. 계약하려는 바로 그 자리 — 지번, 층,
            호수 단위로 어떤 가게가 얼마나 있다 나갔는지, 성남시 공공 인허가 기록을 정제해
            그대로 옮겨왔습니다.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {REASONS.map(([title, desc], i) => (
              <div key={title} className="rounded-2xl border border-line bg-paper p-4">
                <span className="text-xs font-bold text-slate-400">0{i + 1}</span>
                <div className="mt-2 font-bold text-ink">{title}</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            {FACTS.map(([label, value]) => (
              <div key={label} className="bg-white p-4">
                <div className="text-xs text-slate-400">{label}</div>
                <div className="mt-1 font-bold text-ink">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <footer className="mx-auto w-full max-w-3xl pb-6 text-center text-xs text-slate-400">
          인허가 신고 기준 데이터로 실제 영업 현황과 차이가 있을 수 있습니다.
        </footer>
      </section>
    </div>
  );
}

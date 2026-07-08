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
  ["계약 전에 확인합니다", "계약서에 서명하기 전에, 그 자리가 어떤 이력을 가지고 있는지 먼저 확인합니다. 임차 이후 알게 되는 리스크를 앞당깁니다."],
  ["자리 단위 리포트입니다", "상권 분석이 아닌, 계약하려는 바로 그 층·호 단위의 개별 리포트입니다. 옆 호수의 성공은 이 자리의 근거가 아닙니다."],
  ["의사결정의 근거를 남깁니다", "데이터를 나열하지 않습니다. 계약 여부를 판단할 수 있는 이력과 통계를 함께 드립니다."],
];

const FACTS: [string, string][] = [
  ["공공데이터", "인허가 기반"],
  ["지번 단위", "동일 지번 내 전체 상가"],
  ["층·호 단위", "상가별 개별 리포트"],
  ["운영 이력", "폐업·생존 통계"],
];

function ScrollHint({ target }: { target: string }) {
  return (
    <a
      href={target}
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
  // 검색 전 화면(히어로+예시+3단계)이 슬라이드로 빠지는 동안 잠깐 유지되는 상태
  const [leaving, setLeaving] = useState(false);

  const q = useQuery({
    queryKey: ["search", query],
    queryFn: () => search(query!),
    enabled: query !== null,
  });

  const pick = (pnu: string) =>
    navigate(`/map?q=${encodeURIComponent(query ?? "")}&pnu=${pnu}`);

  const submit = (v: string) => {
    if (!v) return;
    if (query === null) {
      setLeaving(true);
      setTimeout(() => {
        setQuery(v);
        setLeaving(false);
      }, 220);
    } else {
      setQuery(v);
    }
  };

  return (
    <div className="h-dvh snap-y snap-mandatory overflow-y-scroll scroll-smooth bg-paper">
      {/* 1/3 — 검색 화면. 뷰포트 한 화면에 맞춰 스냅 */}
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
              <div
                className={`transition-all duration-200 ease-in ${
                  leaving ? "-translate-y-4 opacity-0" : "translate-y-0 opacity-100"
                }`}
              >
                <div className="fade-up">
                  <span className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-bold text-accent shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    창업예정자를 위한 입지 실사 리포트
                  </span>
                  <h1 className="mt-6 text-4xl font-black leading-[1.18] tracking-tight text-ink sm:text-5xl">
                    자리를 보면,
                    <br />
                    <span className="text-accent">창업</span>이 보입니다.
                  </h1>
                  <p className="mt-5 max-w-xl leading-relaxed text-slate-500">
                    좋은 창업은, 좋은 자리를 보는 것에서 시작됩니다. 계약하려는 바로 그
                    자리의 과거 개업·폐업 이력과 생존 통계를 분석해 드립니다.
                  </p>
                </div>

                <div className="fade-up-delay mt-8 max-w-xl">
                  <SearchBar onSearch={submit} />
                  <div className="mt-3 flex items-center gap-2">
                    <span className="shrink-0 text-xs text-slate-400">예시</span>
                    <div className="flex overflow-x-auto divide-x divide-line rounded-full border border-line bg-white">
                      {CHIPS.map((c) => (
                        <button
                          key={c}
                          onClick={() => submit(c)}
                          className="shrink-0 whitespace-nowrap px-3.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-accent"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    공공데이터 기반 · 지번 주소 하나로 시작합니다
                  </p>
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
              </div>
            ) : (
              <div className="fade-up max-w-xl">
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
                  <SearchBar initial={query} size="md" onSearch={submit} />
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

        <ScrollHint target="#about-section" />
      </section>

      {/* 2/3 — 왜 터봄인가 */}
      <section
        id="about-section"
        className="relative flex min-h-dvh snap-start snap-always flex-col bg-white"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="mx-auto w-full max-w-3xl py-10">
            <a href="#search-section" className="text-xs font-semibold text-slate-400 hover:text-ink">
              ↑ 다시 검색하기
            </a>
            <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-md border border-line bg-paper px-3 py-1.5 text-xs font-bold text-accent">
              왜 터봄인가
            </span>
            <h2 className="mt-5 text-3xl font-black leading-[1.25] tracking-tight text-ink sm:text-4xl">
              상권을 보기 전에,
              <br />
              자리를 봅니다.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-slate-500">
              터봄은 상권 통계 서비스가 아닙니다. 계약하려는 바로 그 자리 — 지번, 층,
              호수 단위로 어떤 가게가 얼마나 있다 나갔는지, 성남시 공공 인허가 기록을
              정제해 그대로 옮겨왔습니다.
            </p>

            <div className="mt-8 flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
              {REASONS.map(([title, desc], i) => (
                <div
                  key={title}
                  className="w-64 shrink-0 rounded-2xl border border-line bg-paper p-4 sm:w-auto"
                >
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
        </div>

        <ScrollHint target="#report-section" />
      </section>

      {/* 3/3 — 분석 리포트 미리보기 + CTA */}
      <section
        id="report-section"
        className="relative flex min-h-dvh snap-start snap-always flex-col bg-paper"
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="mx-auto w-full max-w-3xl py-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-bold text-accent">
              분석 리포트 미리보기
            </span>
            <h2 className="mt-3 text-2xl font-black leading-[1.25] tracking-tight text-ink sm:text-3xl">
              데이터가 아니라,
              <br />
              판단 근거를 드립니다.
            </h2>
            <p className="mt-2.5 max-w-xl leading-relaxed text-slate-500">
              5초 안에 "이 자리를 계약해도 괜찮을까?"에 답할 수 있도록, 이력과 통계를
              한 화면에 정리해 드립니다.
            </p>

            {/* 샘플 리포트 카드 — 실제 물건 상세 화면과 같은 항목 구성 */}
            <div className="mt-5 max-w-md rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-teal">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                  분석 리포트 · 미리보기
                </span>
                <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-bold text-slate-400">
                  SAMPLE
                </span>
              </div>
              <div className="mt-3 text-xs text-slate-400">경기도 성남시 수정구 시흥동 85-5</div>
              <div className="text-base font-black text-ink">1층 101호 · 상가 리포트</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-paper p-3">
                  <div className="text-[11px] text-slate-400">거쳐간 가게</div>
                  <div className="text-lg font-black text-ink">5곳</div>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <div className="text-[11px] text-slate-400">폐업</div>
                  <div className="text-lg font-black text-flame">4회</div>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <div className="text-[11px] text-slate-400">평균 생존기간</div>
                  <div className="text-lg font-black text-ink">27개월</div>
                </div>
                <div className="rounded-xl bg-paper p-3">
                  <div className="text-[11px] text-slate-400">현재 업종</div>
                  <div className="text-lg font-black text-emerald-600">치킨나라</div>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                <span className="font-bold">치킨나라가 2023년 개업 후 지금까지 이어지고 있어요.</span>{" "}
                이전 업종들의 생존기간도 함께 확인해 보세요.
              </div>
            </div>

            <div className="mt-5 flex flex-col items-start gap-4 rounded-2xl bg-navy p-5 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-lg font-black">계약 전에, 자리를 먼저 보세요.</div>
                <p className="mt-1 text-sm text-white/60">
                  지번 주소 하나로 시작합니다. 층·호 단위 상가별 리포트를 확인하세요.
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <a
                  href="#search-section"
                  className="rounded-full bg-white px-4 py-2 text-sm font-bold text-navy transition hover:brightness-95"
                >
                  자리 분석하기
                </a>
                <Link
                  to="/map"
                  className="rounded-full border border-white/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  지도 둘러보기
                </Link>
              </div>
            </div>
          </div>
        </div>

        <footer className="mx-auto flex w-full max-w-3xl flex-col items-center gap-1.5 px-5 pb-4 text-center">
          <Brand compact />
          <p className="text-xs text-slate-400">© 2026 터봄 · 계약 전, 자리를 봅니다.</p>
          <p className="text-xs text-slate-400">
            인허가 신고 기준 데이터로 실제 영업 현황과 차이가 있을 수 있습니다.
          </p>
        </footer>
      </section>
    </div>
  );
}

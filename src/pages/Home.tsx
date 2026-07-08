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
    <div className="min-h-dvh bg-paper">
      <header className="border-b border-ledger">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-3">
          <Brand />
          <Link
            to="/map"
            className="border border-ink/20 px-4 py-1.5 font-mono text-xs text-ink/60 transition hover:border-ink hover:text-ink"
          >
            지도로 둘러보기 →
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 pb-24 pt-12 sm:pt-16">
        <div className="fade-up">
          <p className="font-mono text-xs tracking-[0.15em] text-ink/45">
            공공 인허가 데이터 기반 · 상가이력 등록기록
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-[1.3] tracking-tight text-ink sm:text-5xl">
            이 자리, 지금까지
            <br />
            <span className="text-seal">몇 개의 가게</span>가 거쳐갔을까요?
          </h1>
          <p className="mt-5 max-w-xl font-body leading-relaxed text-ink/60">
            지번 하나로 그 상가의 개업·폐업 이력과 평균 생존기간을 확인합니다.
            권리금과 임대료 뒤에 숨은 자리의 진짜 기록 — 계약서에 도장을 찍기 전에
            등록된 사실로 검증하세요.
          </p>
        </div>

        <div className="fade-up-delay mt-9 max-w-xl">
          <SearchBar onSearch={(v) => v && setQuery(v)} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink/35">예시</span>
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => setQuery(c)}
                className="border border-ledger px-3 py-1 font-mono text-xs text-ink/60 transition hover:border-ink hover:text-ink"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 검색 전: 이용 안내 3단계 */}
        {query === null && (
          <ol className="fade-up-delay mt-14 grid gap-0 border border-ledger sm:grid-cols-3">
            {STEPS.map(([title, desc], i) => (
              <li
                key={title}
                className={`p-5 ${i > 0 ? "border-t border-ledger sm:border-l sm:border-t-0" : ""}`}
              >
                <span className="font-mono text-xs text-ink/35">0{i + 1}</span>
                <div className="mt-1 font-display font-bold text-ink">{title}</div>
                <div className="mt-1 text-sm leading-relaxed text-ink/55">{desc}</div>
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
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            )}

            {q.isError && (
              <div className="border border-ledger p-4">
                <ErrorState message="검색 중 문제가 발생했어요." onRetry={() => q.refetch()} />
              </div>
            )}

            {q.data && q.data.candidates.length === 0 && (
              <div className="border border-ledger p-4">
                <EmptyState
                  title={`‘${query}’의 기록을 찾지 못했어요`}
                  hint="다른 지번으로 검색해 보세요."
                />
              </div>
            )}

            {q.data && q.data.candidates.length > 0 && (
              <>
                <div className="mb-2 px-1 font-mono text-xs text-ink/40">
                  {q.data.candidates.length}건 조회됨 · 선택하면 지도로 이동합니다
                </div>
                <ul className="border border-ledger">
                  {q.data.candidates.map((c, i) => (
                    <li
                      key={c.pnu}
                      className={`fade-up ${i > 0 ? "border-t border-ledger" : ""}`}
                    >
                      <button
                        onClick={() => pick(c.pnu)}
                        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-ink/[0.03]"
                      >
                        <AddressText jibun={c.jibunAddress} road={c.roadAddress} />
                        <span className="flex shrink-0 items-center gap-2">
                          <Pill>
                            점포 {c.unitCount} · 폐업 {c.closedCount}
                          </Pill>
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

      <footer className="border-t border-ledger py-5 text-center font-mono text-[11px] text-ink/35">
        인허가 신고 기준 데이터로 실제 영업 현황과 차이가 있을 수 있습니다.
      </footer>
    </div>
  );
}

// 상세 페이지의 진단/위험도/신호/체크리스트 — 전부 statistics·timeline(그리고 있으면 neighborhood)에서
// 파생 계산. 규칙이 하나로 정해져 있는 값이 아니라 첫 버전 휴리스틱이므로, 실제 서비스화 시
// 폐업 데이터가 쌓이면 임계값(closedCount 구간 등)을 다시 튜닝해야 한다.
import type { Neighborhood, Statistics, Tenancy } from "../types";
import { DAY, monthsBetween } from "./timeline.ts";

const YEAR = 365 * DAY;

export function yearsSpan(timeline: Tenancy[], todayISO: string): number {
  if (timeline.length === 0) return 0;
  return Math.max(1, Math.round(monthsBetween(timeline[0].licensedAt, todayISO) / 12));
}

const RISK_LABELS = ["", "매우 안정", "안정", "보통", "위험", "매우 위험"];

export function riskLevel(closedCount: number): { stars: number; label: string } {
  const stars = closedCount === 0 ? 1 : closedCount <= 2 ? 2 : closedCount <= 4 ? 3 : closedCount <= 6 ? 4 : 5;
  return { stars, label: RISK_LABELS[stars] };
}

export function repeatCategoryFailure(
  timeline: Tenancy[]
): { repeated: boolean; category: string | null; count: number } {
  const counts = new Map<string, number>();
  for (const t of timeline) {
    if (t.status !== "폐업") continue;
    counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  }
  let top: [string, number] | null = null;
  for (const entry of counts) {
    if (entry[1] >= 2 && (!top || entry[1] > top[1])) top = entry;
  }
  return top ? { repeated: true, category: top[0], count: top[1] } : { repeated: false, category: null, count: 0 };
}

function recentClosureTrend(timeline: Tenancy[], todayISO: string) {
  const today = Date.parse(todayISO);
  const closedAtMs = (t: Tenancy) => (t.closedAt ? Date.parse(t.closedAt) : null);
  const recentCount = timeline.filter((t) => {
    const c = closedAtMs(t);
    return c != null && c >= today - 5 * YEAR;
  }).length;
  const priorCount = timeline.filter((t) => {
    const c = closedAtMs(t);
    return c != null && c >= today - 10 * YEAR && c < today - 5 * YEAR;
  }).length;
  const trend = recentCount < priorCount ? "완화" : recentCount > priorCount ? "심화" : "평이";
  return { recentCount, trend };
}

export interface Signal {
  icon: "down" | "clock" | "warn" | "up";
  value: string;
  title: string;
  desc: string;
}

export function signals(statistics: Statistics, timeline: Tenancy[], todayISO: string): Signal[] {
  const last = timeline[timeline.length - 1];
  const { recentCount, trend } = recentClosureTrend(timeline, todayISO);
  const avg = statistics.averageSurvivalMonths;
  const currentMonths = last?.status === "영업" ? last.survivalMonths : null;
  const isLongestRunning =
    currentMonths != null && timeline.every((t) => (t.survivalMonths ?? 0) <= currentMonths);
  const aboveAverage = currentMonths != null && avg != null && currentMonths > avg;

  return [
    {
      icon: "down",
      value: `${recentCount}회`,
      title: `최근 5년 폐업 흐름 ${trend}`,
      desc: `최근 5년간 폐업 빈도가 이전 대비 ${
        trend === "완화" ? "감소" : trend === "심화" ? "증가" : "비슷"
      }했습니다.`,
    },
    {
      icon: "clock",
      value: currentMonths != null ? `${currentMonths}개월` : "-",
      title: isLongestRunning ? "현재업종 최장 운영" : "현재업종 운영 기간",
      desc:
        last?.status === "영업"
          ? isLongestRunning
            ? "현재 업종은 해당 자리에서 가장 오래 운영되고 있습니다."
            : `${last.businessName}은(는) 이 자리에서 ${currentMonths}개월째 운영되고 있습니다.`
          : "현재 이 물건은 공실 상태입니다.",
    },
    {
      icon: "warn",
      value: avg != null ? `${avg}개월` : "-",
      title: "평균 생존기간",
      desc: `해당 상가의 평균 생존기간은 ${avg ?? "-"}개월입니다.`,
    },
    {
      icon: "up",
      value: avg != null ? `${avg}개월` : "-",
      title: aboveAverage ? "현재 운영, 평균보다 김" : "평균 대비 운영기간",
      desc: aboveAverage
        ? "현재 임차인의 운영 기간이 이 물건 평균보다 깁니다."
        : "현재 임차인의 운영 기간을 이 물건의 평균과 비교해 보세요.",
    },
  ];
}

export function diagnosis(statistics: Statistics, timeline: Tenancy[], todayISO: string): string[] {
  const span = yearsSpan(timeline, todayISO);
  const repeat = repeatCategoryFailure(timeline);
  const last = timeline[timeline.length - 1];
  const lines = [
    `최근 ${span}년 동안 총 ${statistics.closedCount}회의 폐업이 발생했습니다.`,
    repeat.repeated
      ? `${repeat.category} 업종의 반복적인 폐업(${repeat.count}회) 이력이 확인됩니다.`
      : "동일 업종의 반복적인 폐업 이력은 확인되지 않았습니다.",
  ];
  lines.push(
    last?.status === "영업"
      ? `현재 ${last.businessName}은(는) ${last.survivalMonths}개월째 운영되고 있습니다.`
      : "현재 이 물건은 공실 상태입니다."
  );
  lines.push(
    statistics.closedCount <= 2
      ? "현재 업종과 유사한 카테고리는 상대적으로 안정적인 흐름을 보입니다."
      : "폐업 빈도가 다소 높은 편이니 신중한 검토가 필요합니다."
  );
  return lines;
}

export interface ChecklistItem {
  title: string;
  desc: string;
  status: "ok" | "warn";
}

export function checklist(
  statistics: Statistics,
  timeline: Tenancy[],
  neighborhood: Neighborhood | undefined,
  todayISO: string
): ChecklistItem[] {
  const span = yearsSpan(timeline, todayISO);
  const repeat = repeatCategoryFailure(timeline);
  const last = timeline[timeline.length - 1];

  return [
    {
      title: "최근 폐업 횟수",
      desc: `최근 ${span}년간 ${statistics.closedCount}회의 폐업이 확인되었습니다.`,
      status: statistics.closedCount <= 2 ? "ok" : "warn",
    },
    {
      title: "동일 업종 반복 실패",
      desc: repeat.repeated
        ? `${repeat.category} 업종이 ${repeat.count}회 반복 폐업했습니다.`
        : "동일 업종의 반복적인 폐업은 확인되지 않았습니다.",
      status: repeat.repeated ? "warn" : "ok",
    },
    {
      title: "평균 생존기간",
      desc: `평균 ${statistics.averageSurvivalMonths ?? "-"}개월. 계약 기간과의 정합성을 검토하세요.`,
      status: "warn",
    },
    {
      title: "현재 업종 운영기간",
      desc:
        last?.status === "영업"
          ? `현재 ${last.businessName}이(가) ${last.survivalMonths}개월째 운영 중입니다.`
          : "현재 공실 상태입니다.",
      status: "ok",
    },
    {
      title: "주변 동일 업종 분포",
      desc: neighborhood
        ? `반경 ${neighborhood.radiusMeters}m 내 동일 업종 ${neighborhood.sameCategoryCount}곳 · 전체 ${neighborhood.totalStoreCount}곳`
        : "동일 지번 및 인접 상권의 유사 업종 분포도 함께 검토하세요.",
      status: "ok",
    },
  ];
}

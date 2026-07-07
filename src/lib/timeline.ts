// 운영기간 라인: 이력들을 하나의 연속 막대(세그먼트)로. 사이 빈 기간은 '공실' 세그먼트.

export interface Span {
  licensedAt: string;
  closedAt: string | null;
}

export interface Segment {
  kind: "tenancy" | "vacancy";
  idx: number; // tenancy면 원본 인덱스, vacancy면 -1
  widthPct: number;
  startYear: number;
  endYear: number;
  ongoing: boolean;
}

export interface BuiltSegments {
  segments: Segment[];
  startLabel: string;
  endLabel: string;
}

const DAY = 86_400_000;
const yr = (ms: number) => new Date(ms).getFullYear();
const ym = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function buildSegments(items: Span[], todayISO: string): BuiltSegments {
  if (items.length === 0) return { segments: [], startLabel: "", endLabel: "" };

  const today = Date.parse(todayISO);
  const starts = items.map((i) => Date.parse(i.licensedAt));
  const ends = items.map((i) => (i.closedAt ? Date.parse(i.closedAt) : today));
  const start = starts[0];
  const end = Math.max(ends[ends.length - 1], today);
  const span = Math.max(1, end - start);
  const pct = (ms: number) => (ms / span) * 100;

  const segments: Segment[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      const gap = starts[i] - ends[i - 1];
      if (gap > 15 * DAY) {
        segments.push({
          kind: "vacancy",
          idx: -1,
          widthPct: pct(gap),
          startYear: yr(ends[i - 1]),
          endYear: yr(starts[i]),
          ongoing: false,
        });
      }
    }
    segments.push({
      kind: "tenancy",
      idx: i,
      widthPct: Math.max(3, pct(ends[i] - starts[i])),
      startYear: yr(starts[i]),
      endYear: yr(ends[i]),
      ongoing: !items[i].closedAt,
    });
  }
  // 마지막 이력이 폐업이고 오늘까지 비어있으면 후행 공실
  const lastEnd = ends[ends.length - 1];
  if (items[items.length - 1].closedAt && today - lastEnd > 15 * DAY) {
    segments.push({
      kind: "vacancy",
      idx: -1,
      widthPct: pct(today - lastEnd),
      startYear: yr(lastEnd),
      endYear: yr(today),
      ongoing: true,
    });
  }

  return {
    segments,
    startLabel: ym(start),
    endLabel: items[items.length - 1].closedAt ? ym(lastEnd) : "현재",
  };
}

// 막대 하단 연도 축: 각 연 1월 1일 위치(%). 시작연은 좌측 끝(0%).
export function yearTicks(items: Span[], todayISO: string): { year: number; leftPct: number }[] {
  if (items.length === 0) return [];
  const today = Date.parse(todayISO);
  const starts = items.map((i) => Date.parse(i.licensedAt));
  const ends = items.map((i) => (i.closedAt ? Date.parse(i.closedAt) : today));
  const start = starts[0];
  const end = Math.max(ends[ends.length - 1], today);
  const span = Math.max(1, end - start);

  const ticks: { year: number; leftPct: number }[] = [];
  for (let y = new Date(start).getFullYear(); y <= new Date(end).getFullYear(); y++) {
    const jan = Date.parse(`${y}-01-01`);
    const leftPct = jan <= start ? 0 : (jan - start) / span * 100;
    if (leftPct <= 100) ticks.push({ year: y, leftPct });
  }
  return ticks;
}

const PALETTE = [
  "#2f8f7d", "#c2410c", "#b45309", "#3b82f6", "#7c3aed",
  "#be123c", "#15803d", "#a21caf", "#0e7490", "#a16207",
];

// 업종 → 색상. 첫 등장 순서대로 배정(같은 업종은 같은 색).
export function categoryColors(categories: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  let i = 0;
  for (const c of categories) {
    if (!(c in map)) map[c] = PALETTE[i++ % PALETTE.length];
  }
  return map;
}

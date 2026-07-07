// node --experimental-strip-types src/lib/timeline.check.ts
import assert from "node:assert";
import { buildSegments, categoryColors, yearTicks } from "./timeline.ts";

const today = "2026-07-07";
const items = [
  { licensedAt: "2013-05-02", closedAt: "2017-01-10" },
  { licensedAt: "2018-04-01", closedAt: null }, // 영업중 → 오늘까지
];
const { segments, startLabel, endLabel } = buildSegments(items, today);

// tenancy, vacancy(2017~2018 공백), tenancy → 3세그먼트
assert.strictEqual(segments.length, 3, "공실 구간 포함 3세그먼트");
assert.strictEqual(segments[1].kind, "vacancy", "가운데는 공실");
assert.ok(segments[2].ongoing, "마지막은 영업중");
const sum = segments.reduce((a, s) => a + s.widthPct, 0);
assert.ok(Math.abs(sum - 100) < 0.5, "폭 합계 ~100%");
assert.strictEqual(startLabel, "2013.05");
assert.strictEqual(endLabel, "현재");

const ticks = yearTicks(items, today);
assert.strictEqual(ticks[0].leftPct, 0, "시작연은 좌측 끝");
assert.strictEqual(ticks[0].year, 2013);
assert.ok(ticks[ticks.length - 1].year === 2026, "마지막 눈금은 올해");
assert.ok(ticks.every((t) => t.leftPct >= 0 && t.leftPct <= 100), "눈금 범위 내");

const c = categoryColors(["한식", "커피", "한식"]);
assert.strictEqual(c["한식"], c["한식"]);
assert.notStrictEqual(c["한식"], c["커피"], "다른 업종은 다른 색");

console.log("timeline.check ok");

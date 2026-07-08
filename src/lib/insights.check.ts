// node --experimental-strip-types src/lib/insights.check.ts
import assert from "node:assert";
import { checklist, diagnosis, repeatCategoryFailure, riskLevel, signals, yearsSpan } from "./insights.ts";
import type { Statistics, Tenancy } from "../types.ts";

const today = "2026-07-08";
const stats: Statistics = {
  totalTenancyCount: 5,
  closedCount: 4,
  averageSurvivalMonths: 27,
  longestSurvivalMonths: 44,
  shortestSurvivalMonths: 11,
};
const timeline: Tenancy[] = [
  { businessName: "고기굽는집", category: "한식", licensedAt: "2013-05-02", closedAt: "2017-01-10", status: "폐업", survivalMonths: 44, closedAtEstimated: false },
  { businessName: "카페모모", category: "커피", licensedAt: "2017-03-01", closedAt: "2018-05-20", status: "폐업", survivalMonths: 14, closedAtEstimated: false },
  { businessName: "마라방", category: "중식", licensedAt: "2018-08-15", closedAt: "2019-07-10", status: "폐업", survivalMonths: 11, closedAtEstimated: true },
  { businessName: "분식왕", category: "분식", licensedAt: "2019-10-01", closedAt: "2022-12-05", status: "폐업", survivalMonths: 38, closedAtEstimated: false },
  { businessName: "치킨나라", category: "치킨", licensedAt: "2023-01-15", closedAt: null, status: "영업", survivalMonths: 41, closedAtEstimated: false },
];

assert.strictEqual(yearsSpan(timeline, today), 13, "2013~2026 대략 13년");

const risk = riskLevel(1);
assert.strictEqual(risk.stars, 2, "폐업 1회 -> 2성");
assert.strictEqual(risk.label, "안정");
assert.strictEqual(riskLevel(0).stars, 1);
assert.strictEqual(riskLevel(7).stars, 5);

const noRepeat = repeatCategoryFailure(timeline);
assert.strictEqual(noRepeat.repeated, false, "이 목데이터는 업종이 전부 달라 반복 없음");

const repeatTimeline: Tenancy[] = [
  ...timeline,
  { businessName: "제2카페", category: "커피", licensedAt: "2020-01-01", closedAt: "2020-06-01", status: "폐업", survivalMonths: 5, closedAtEstimated: false },
];
const repeat = repeatCategoryFailure(repeatTimeline);
assert.strictEqual(repeat.repeated, true);
assert.strictEqual(repeat.category, "커피");
assert.strictEqual(repeat.count, 2);

const sig = signals(stats, timeline, today);
assert.strictEqual(sig.length, 4, "신호 카드 4개");
assert.ok(sig.every((s) => typeof s.value === "string" && s.title.length > 0));

const diag = diagnosis(stats, timeline, today);
assert.ok(diag.length >= 3, "진단 문장 최소 3개");
assert.ok(diag[0].includes("13년"));

const items = checklist(stats, timeline, null, today);
assert.strictEqual(items.length, 5, "체크리스트 5항목");
assert.strictEqual(items[1].status, "ok", "반복 실패 없으니 ok");
const itemsWithRepeat = checklist(stats, repeatTimeline, null, today);
assert.strictEqual(itemsWithRepeat[1].status, "warn", "반복 실패 있으면 warn");
assert.ok(items[4].desc.includes("검토"), "sameCategoryNearbyCount 없으면 안내 문구로 대체");
const itemsWithCount = checklist(stats, timeline, 14, today);
assert.ok(itemsWithCount[4].desc.includes("14곳"), "실값 있으면 곳 수를 그대로 노출");

console.log("insights.check ok");

// 성남시 수정구 일반음식점 인허가 데이터 → schema.sql 시드 변환.
// 규칙 출처: files0/10-backend-spec.md §3.1(D-U1), §4.2(P-1~P-5), §5(통계).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import proj4 from "proj4";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 원본 CSV는 용량 문제로 저장소에 커밋하지 않음 — ingestion/ 바로 아래에 두고 실행.
// 다른 데이터셋으로 재사용할 땐 이 파일명과 DONG_CODES, JIBUN_RE만 바꾸면 된다.
const SRC_CSV = path.resolve(__dirname, "../식품_일반음식점_경기성남시_2016~.csv");
const OUT_DIR = path.resolve(__dirname, "../out");

// 행정표준코드관리시스템(code.go.kr) 법정동코드 전체자료 기준, 성남시 수정구(41131) 발췌.
const DONG_CODES = {
  신흥동: "4113110100",
  태평동: "4113110200",
  수진동: "4113110300",
  단대동: "4113110400",
  산성동: "4113110500",
  양지동: "4113110600",
  복정동: "4113110700",
  창곡동: "4113110800",
  신촌동: "4113110900",
  오야동: "4113111000",
  심곡동: "4113111100",
  고등동: "4113111200",
  상적동: "4113111300",
  둔전동: "4113111400",
  시흥동: "4113111500",
  금토동: "4113111600",
  사송동: "4113111700",
};

// 인허가 원본좌표는 EPSG:5174(Bessel, TM 중부원점) 관행 — 검증: 시흥동 표본 변환값이
// 실제 수정구 위치(약 37.42N/127.10E)와 일치함(ingestion 준비 중 수동 확인).
const EPSG5174 =
  "+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-146.43,507.89,681.46";

const TODAY = new Date().toISOString().slice(0, 10);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadRecords() {
  const buf = readFileSync(SRC_CSV);
  const text = new TextDecoder("euc-kr").decode(buf);
  const rows = parseCsv(text);
  const header = rows[0];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols[header.indexOf("관리번호")]) continue; // 파일 끝의 패딩 공백행(P-0)
    const obj = {};
    header.forEach((h, idx) => (obj[h] = (cols[idx] ?? "").trim()));
    out.push(obj);
  }
  return out;
}

function normalizeStatus(name) {
  if (/휴업/.test(name)) return "휴업";
  if (/폐업/.test(name)) return "폐업";
  if (/영업/.test(name)) return "영업";
  return null; // P-1: 그 외 상태 제외
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function dateOnly(s) {
  if (!s) return null;
  return DATE_RE.test(s) ? s : null;
}
function dateTimeToDateOnly(s) {
  if (!s) return null;
  const d = s.split(/\s+/)[0];
  return DATE_RE.test(d) ? d : null;
}

const JIBUN_RE = /수정구\s+(\S+동)\s+(산)?\s*(\d+)(?:-(\d+))?\s*(.*)$/;
function parseJibun(addr) {
  const m = addr.match(JIBUN_RE);
  if (!m) return null;
  return {
    dong: m[1],
    mountain: !!m[2],
    bonbun: m[3],
    bubun: m[4] ?? null,
    detail: (m[5] ?? "").trim(),
  };
}

function buildPnu({ dongCode, mountain, bonbun, bubun }) {
  const b1 = bonbun.padStart(4, "0");
  const b2 = (bubun ?? "0").padStart(4, "0");
  return `${dongCode}${mountain ? "1" : "0"}${b1}${b2}`;
}

function monthsBetween(startISO, endISO) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
  if (e.getDate() < s.getDate()) months--;
  return Math.max(0, months);
}

function toWgs84(xRaw, yRaw) {
  const x = parseFloat(xRaw);
  const y = parseFloat(yRaw);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const [lon, lat] = proj4(EPSG5174, "EPSG:4326", [x, y]);
  return { lat: Number(lat.toFixed(7)), lon: Number(lon.toFixed(7)) };
}

// ---- 1) Load + Filter ----
const raw = loadRecords();
const sujeong = raw.filter((r) => r["지번주소"].includes("수정구"));

// ---- 2) Clean(P-1~P-4) ----
const exclusions = [];
const cleaned = [];
for (const r of sujeong) {
  const status = normalizeStatus(r["영업상태명"]);
  if (!status) {
    exclusions.push({ mgtNo: r["관리번호"], reason: "P1_STATUS", snippet: r["영업상태명"] });
    continue;
  }
  const licensedAt = dateOnly(r["인허가일자"]);
  if (!licensedAt) {
    exclusions.push({ mgtNo: r["관리번호"], reason: "P4_PARSE_FAIL", snippet: r["인허가일자"] });
    continue;
  }

  let closedAt = null;
  let closedAtEstimated = false;
  if (status === "폐업") {
    closedAt = dateOnly(r["폐업일자"]);
    if (!closedAt) {
      closedAt = dateTimeToDateOnly(r["최종수정시점"]); // P-2
      closedAtEstimated = closedAt != null;
    }
  }
  if (closedAt && closedAt < licensedAt) {
    exclusions.push({ mgtNo: r["관리번호"], reason: "P3_DATE_ORDER", snippet: `${licensedAt}~${closedAt}` });
    continue;
  }

  const parsed = parseJibun(r["지번주소"]);
  const dongCode = parsed && DONG_CODES[parsed.dong];
  if (!parsed || !dongCode) {
    exclusions.push({ mgtNo: r["관리번호"], reason: "P4_PARSE_FAIL", snippet: r["지번주소"] });
    continue;
  }

  const pnu = buildPnu({ dongCode, ...parsed });
  const canonicalJibun = `경기도 성남시 수정구 ${parsed.dong} ${parsed.mountain ? "산" : ""}${parsed.bonbun}${
    parsed.bubun ? "-" + parsed.bubun : ""
  }`;

  cleaned.push({
    pnu,
    canonicalJibun,
    roadAddress: r["도로명주소"],
    detail: parsed.detail,
    businessName: r["사업장명"],
    category: r["업태구분명"] || null,
    licensedAt,
    closedAt,
    status,
    closedAtEstimated,
    x: r["좌표정보(X)"],
    y: r["좌표정보(Y)"],
  });
}

// ---- 3) Group by pnu → Site ----
const sites = new Map();
for (const rec of cleaned) {
  if (!sites.has(rec.pnu)) sites.set(rec.pnu, []);
  sites.get(rec.pnu).push(rec);
}

// ---- 4) Split units per site (D-U1) ----
// D-U1 rule 2~4: 영업 기간이 겹치는 서로 다른 상호는 별개 물건.
// 상세주소가 같아도 겹침이 있으면(예: 배달전용 공유주방 다중 사업자 등록) 물리적으로
// 한 칸에 동시 두 영업은 불가하다는 전제를 어기므로, 상세주소 유무와 무관하게 항상 적용.
function partitionByOverlap(records) {
  const sorted = records.slice().sort((a, b) => a.licensedAt.localeCompare(b.licensedAt));
  const buckets = []; // {records:[], lastEnd}
  for (const rec of sorted) {
    const end = rec.closedAt ?? TODAY;
    let best = null;
    for (const b of buckets) {
      if (b.lastEnd < rec.licensedAt && (!best || b.lastEnd > best.lastEnd)) best = b;
    }
    if (best) {
      best.records.push(rec);
      best.lastEnd = end;
    } else {
      buckets.push({ records: [rec], lastEnd: end });
    }
  }
  return buckets.map((b) => b.records);
}

function splitUnits(records) {
  const detailed = new Map(); // detail string -> records[]
  const undetailed = [];
  for (const rec of records) {
    if (rec.detail) {
      if (!detailed.has(rec.detail)) detailed.set(rec.detail, []);
      detailed.get(rec.detail).push(rec);
    } else {
      undetailed.push(rec);
    }
  }

  const units = [];
  for (const [detail, recs] of detailed) {
    const subBuckets = partitionByOverlap(recs);
    subBuckets.forEach((bucketRecs, i) => {
      units.push({ detail, sub: subBuckets.length > 1 ? i + 1 : 0, records: bucketRecs });
    });
  }
  for (const bucketRecs of partitionByOverlap(undetailed)) {
    units.push({ detail: "", sub: 0, records: bucketRecs });
  }
  units.sort((a, b) => a.records[0].licensedAt.localeCompare(b.records[0].licensedAt));

  const single = units.length === 1;
  let letterIdx = 0;
  return units.map((u) => {
    let label;
    if (single) label = "단일 점포";
    else if (u.detail) label = u.sub ? `${u.detail} (${u.sub})` : u.detail;
    else label = `물건 ${String.fromCharCode(65 + letterIdx++)}`;
    return { label, records: u.records.slice().sort((a, b) => a.licensedAt.localeCompare(b.licensedAt)) };
  });
}

function survivalStats(records) {
  const closed = records.filter((r) => r.status === "폐업" && r.closedAt);
  const closedMonths = closed.map((r) => monthsBetween(r.licensedAt, r.closedAt));
  const avg = closedMonths.length
    ? Math.round((closedMonths.reduce((a, b) => a + b, 0) / closedMonths.length) * 10) / 10
    : null;
  return {
    totalTenancyCount: records.length,
    closedCount: closed.length,
    averageSurvivalMonths: avg,
    longestSurvivalMonths: closedMonths.length ? Math.max(...closedMonths) : null,
    shortestSurvivalMonths: closedMonths.length ? Math.min(...closedMonths) : null,
  };
}

// ---- 5) Assemble output rows ----
const siteRows = [];
const unitRows = [];
const tenancyRows = [];
const unitStatRows = [];
const siteStatRows = [];
let tenancyId = 1;
let missingCoordSites = 0;

for (const [pnu, records] of sites) {
  const withCoord = records.find((r) => r.x && r.y);
  const coord = withCoord ? toWgs84(withCoord.x, withCoord.y) : null;
  if (!coord) missingCoordSites++;

  // ponytail: 대표 도로명주소 = 그룹 내 최단 문자열(상세주소 접미사 없을 가능성 높음)
  const roadAddress =
    records
      .map((r) => r.roadAddress)
      .filter(Boolean)
      .sort((a, b) => a.length - b.length)[0] ?? null;

  siteRows.push({
    pnu,
    jibunAddress: records[0].canonicalJibun,
    roadAddress,
    latitude: coord?.lat ?? null,
    longitude: coord?.lon ?? null,
    geocoded: false,
  });

  const units = splitUnits(records);
  units.forEach((unit, i) => {
    const unitId = `${pnu}-U${i + 1}`;
    unitRows.push({ unitId, sitePnu: pnu, label: unit.label });

    for (const rec of unit.records) {
      const survivalMonths =
        rec.status === "폐업" && rec.closedAt
          ? monthsBetween(rec.licensedAt, rec.closedAt)
          : rec.status === "영업"
          ? monthsBetween(rec.licensedAt, TODAY)
          : null;
      tenancyRows.push({
        id: tenancyId++,
        unitId,
        businessName: rec.businessName,
        category: rec.category,
        licensedAt: rec.licensedAt,
        closedAt: rec.closedAt,
        status: rec.status,
        closedAtEstimated: rec.closedAtEstimated,
        survivalMonths,
      });
    }

    unitStatRows.push({ unitId, ...survivalStats(unit.records) });
  });

  const siteStats = survivalStats(records);
  siteStatRows.push({
    sitePnu: pnu,
    closureCount: siteStats.closedCount,
    averageSurvivalMonths: siteStats.averageSurvivalMonths,
    longestSurvivalMonths: siteStats.longestSurvivalMonths,
    shortestSurvivalMonths: siteStats.shortestSurvivalMonths,
  });
}

// ---- 6) Emit SQL ----
const sqlStr = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
const sqlNum = (v) => (v == null ? "NULL" : String(v));
const sqlBool = (v) => (v ? "TRUE" : "FALSE");

const lines = [];
lines.push("-- 자동 생성. 재실행: npm run parse (woowaTon/ingestion)");
lines.push(`-- 적재 시점(disclaimer.dataAsOf): ${TODAY}`);
lines.push("");

for (const s of siteRows) {
  lines.push(
    `INSERT INTO site (pnu, road_address, jibun_address, longitude, latitude, geocoded) VALUES (${sqlStr(
      s.pnu
    )}, ${sqlStr(s.roadAddress)}, ${sqlStr(s.jibunAddress)}, ${sqlNum(s.longitude)}, ${sqlNum(
      s.latitude
    )}, ${sqlBool(s.geocoded)});`
  );
}
lines.push("");
for (const u of unitRows) {
  lines.push(
    `INSERT INTO unit (unit_id, site_pnu, label) VALUES (${sqlStr(u.unitId)}, ${sqlStr(u.sitePnu)}, ${sqlStr(
      u.label
    )});`
  );
}
lines.push("");
for (const t of tenancyRows) {
  lines.push(
    `INSERT INTO tenancy_record (id, unit_id, business_name, category_code, licensed_at, closed_at, status, closed_at_estimated, survival_months, source_updated_at) VALUES (${t.id}, ${sqlStr(
      t.unitId
    )}, ${sqlStr(t.businessName)}, ${sqlStr(t.category)}, ${sqlStr(t.licensedAt)}, ${sqlStr(
      t.closedAt
    )}, ${sqlStr(t.status)}, ${sqlBool(t.closedAtEstimated)}, ${sqlNum(t.survivalMonths)}, NULL);`
  );
}
lines.push("");
for (const s of unitStatRows) {
  lines.push(
    `INSERT INTO unit_statistics (unit_id, total_tenancy_count, closed_count, average_survival_months, longest_survival_months, shortest_survival_months) VALUES (${sqlStr(
      s.unitId
    )}, ${s.totalTenancyCount}, ${s.closedCount}, ${sqlNum(s.averageSurvivalMonths)}, ${sqlNum(
      s.longestSurvivalMonths
    )}, ${sqlNum(s.shortestSurvivalMonths)});`
  );
}
lines.push("");
for (const s of siteStatRows) {
  lines.push(
    `INSERT INTO site_statistics (site_pnu, closure_count, average_survival_months, longest_survival_months, shortest_survival_months) VALUES (${sqlStr(
      s.sitePnu
    )}, ${s.closureCount}, ${sqlNum(s.averageSurvivalMonths)}, ${sqlNum(s.longestSurvivalMonths)}, ${sqlNum(
      s.shortestSurvivalMonths
    )});`
  );
}
lines.push("");
for (const e of exclusions) {
  lines.push(
    `INSERT INTO ingestion_exclusion_log (raw_mgtno, reason_code, raw_snippet) VALUES (${sqlStr(
      e.mgtNo
    )}, ${sqlStr(e.reason)}, ${sqlStr(e.snippet.slice(0, 500))});`
  );
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, "data.sql"), lines.join("\n") + "\n", "utf8");

const summary = {
  dataAsOf: TODAY,
  totalRowsInFile: raw.length,
  sujeongGuRows: sujeong.length,
  excludedRows: exclusions.length,
  excludedByReason: exclusions.reduce((acc, e) => {
    acc[e.reason] = (acc[e.reason] ?? 0) + 1;
    return acc;
  }, {}),
  siteCount: siteRows.length,
  unitCount: unitRows.length,
  tenancyCount: tenancyRows.length,
  sitesMissingCoordinates: missingCoordSites,
  note: "geocoded는 전부 false — VWorld API 키 없어 좌표 보강 미실행(원본 X/Y만 변환). 좌표 없는 자리는 지도 마커 제외 대상.",
};
writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2), "utf8");

console.log(JSON.stringify(summary, null, 2));

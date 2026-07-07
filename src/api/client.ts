import type { Candidate, SearchResponse, SiteDetail, UnitDetail, ApiError } from "../types";
import { candidates, sites, units } from "../mocks/data";

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const MOCK = !BASE_URL;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s: string) => s.replace(/\s/g, "").toLowerCase();

// 목/실 어느 쪽이든 { error, message } 형태를 throw → 화면이 동일한 404 UI를 낸다.
function fail(error: string, message: string): never {
  const e: ApiError = { error, message };
  throw e;
}

async function real<T>(path: string): Promise<T> {
  const res = await fetch(BASE_URL + path);
  const body = await res.json();
  if (!res.ok) throw body as ApiError;
  return body as T;
}

export async function search(query: string): Promise<SearchResponse> {
  if (MOCK) {
    await delay(300);
    const q = norm(query);
    if (!q) fail("INVALID_QUERY", "검색어를 입력해 주세요.");
    return {
      candidates: candidates.filter(
        (c) => norm(c.jibunAddress).includes(q) || norm(c.roadAddress).includes(q)
      ),
    };
  }
  return real(`/api/sites/search?query=${encodeURIComponent(query)}`);
}

// 지도 첫 진입(검색어 없음)용. 실 API엔 목록 엔드포인트가 없어 mock에서만 채운다.
// ponytail: real API에 list 엔드포인트 생기면 그걸로 교체
export async function featuredSites(): Promise<Candidate[]> {
  if (MOCK) {
    await delay(200);
    return candidates;
  }
  return [];
}

export async function getSite(pnu: string): Promise<SiteDetail> {
  if (MOCK) {
    await delay(300);
    return sites[pnu] ?? fail("SITE_NOT_FOUND", "해당 자리를 찾을 수 없습니다.");
  }
  return real(`/api/sites/${encodeURIComponent(pnu)}`);
}

export async function getUnit(unitId: string): Promise<UnitDetail> {
  if (MOCK) {
    await delay(300);
    return units[unitId] ?? fail("UNIT_NOT_FOUND", "해당 물건을 찾을 수 없습니다.");
  }
  return real(`/api/units/${encodeURIComponent(unitId)}`);
}

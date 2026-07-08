// api-spec.md와 1:1

export interface Candidate {
  pnu: string;
  jibunAddress: string;
  roadAddress: string;
  latitude: number | null;
  longitude: number | null;
  unitCount: number;
  closedCount: number;
}
export interface SearchResponse {
  candidates: Candidate[];
}

export interface Disclaimer {
  dataAsOf: string;
  note: string;
}

export type LocationSource = "license" | "sangga_api" | "overlap_inferred";

export interface UnitSummary {
  unitId: string;
  label: string;
  currentBusinessName: string | null;
  currentStatus: "영업" | "공실";
  totalTenancyCount: number;
  closedCount: number;
  averageSurvivalMonths: number | null;
  industryDetail: string | null;
  locationSource: LocationSource;
}
export interface SiteDetail {
  site: {
    pnu: string;
    jibunAddress: string;
    roadAddress: string;
    latitude: number | null;
    longitude: number | null;
  };
  units: UnitSummary[];
  disclaimer: Disclaimer;
}

export interface Statistics {
  totalTenancyCount: number;
  closedCount: number;
  averageSurvivalMonths: number | null;
  longestSurvivalMonths: number | null;
  shortestSurvivalMonths: number | null;
}
export type EnrichmentSource = "sangga_api" | "license_only";

// timeline[]의 이력 하나에 붙는 계약·주변상권 정보. sameCategoryNearbyCount만 실값
// 시도(상가API 반경조회), 나머지는 소스가 없어 항상 목업(isPlaceholder: true).
export interface MarketInfo {
  isPlaceholder: boolean;
  leaseAreaSqm: number | null;
  depositKrw: number | null;
  monthlyRentKrw: number | null;
  keyMoneyKrw: number | null;
  dailyFloatingPopulation: number | null;
  sameCategoryNearbyCount: number | null;
  vacancyRatePercent: number | null;
  asOf: string;
}

export interface Tenancy {
  tenancyId: string;
  businessName: string;
  category: string;
  industryDetail: string | null;
  licensedAt: string;
  closedAt: string | null;
  status: "영업" | "폐업" | "휴업";
  survivalMonths: number | null;
  closedAtEstimated: boolean;
  enrichmentSource: EnrichmentSource;
  marketInfo: MarketInfo;
}
export interface UnitDetail {
  unit: {
    unitId: string;
    label: string;
    jibunAddress: string;
    roadAddress: string;
  };
  statistics: Statistics;
  timeline: Tenancy[];
  disclaimer: Disclaimer;
}

export interface ApiError {
  error: string;
  message: string;
}

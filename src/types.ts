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

export interface UnitSummary {
  unitId: string;
  label: string;
  currentBusinessName: string | null;
  currentStatus: "영업" | "공실";
  totalTenancyCount: number;
  closedCount: number;
  averageSurvivalMonths: number | null;
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
export interface Tenancy {
  businessName: string;
  category: string;
  licensedAt: string;
  closedAt: string | null;
  status: "영업" | "폐업" | "휴업";
  survivalMonths: number | null;
  closedAtEstimated: boolean;
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

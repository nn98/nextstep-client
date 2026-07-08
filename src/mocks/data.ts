import type { Candidate, MarketInfo, SiteDetail, UnitDetail } from "../types";

const disclaimer = {
  dataAsOf: "2026-07-04",
  note: "인허가 신고 기준 데이터로 실제 영업 현황과 차이가 있을 수 있습니다.",
};

export const candidates: Candidate[] = [
  {
    pnu: "4113310300104050001",
    jibunAddress: "경기도 성남시 수정구 금토동 405-1",
    roadAddress: "경기도 성남시 수정구 대왕판교로 815",
    latitude: 37.4012,
    longitude: 127.1045,
    unitCount: 3,
    closedCount: 8,
  },
  {
    pnu: "4113310300104050003",
    jibunAddress: "경기도 성남시 수정구 금토동 405-3",
    roadAddress: "경기도 성남시 수정구 대왕판교로 817",
    latitude: 37.4015,
    longitude: 127.105,
    unitCount: 1,
    closedCount: 3,
  },
];

export const sites: Record<string, SiteDetail> = {
  "4113310300104050001": {
    site: {
      pnu: "4113310300104050001",
      jibunAddress: "경기도 성남시 수정구 금토동 405-1",
      roadAddress: "경기도 성남시 수정구 대왕판교로 815",
      latitude: 37.4012,
      longitude: 127.1045,
    },
    units: [
      {
        unitId: "4113310300104050001-U1",
        label: "1층 101호",
        currentBusinessName: "치킨나라",
        currentStatus: "영업",
        totalTenancyCount: 5,
        closedCount: 4,
        averageSurvivalMonths: 27,
        industryDetail: "후라이드/양념치킨",
        locationSource: "sangga_api",
      },
      {
        unitId: "4113310300104050001-U2",
        label: "2층 201호",
        currentBusinessName: null,
        currentStatus: "공실",
        totalTenancyCount: 3,
        closedCount: 3,
        averageSurvivalMonths: 14,
        industryDetail: null,
        locationSource: "overlap_inferred",
      },
      {
        unitId: "4113310300104050001-U3",
        label: "1층 102호",
        currentBusinessName: "파리바게뜨",
        currentStatus: "영업",
        totalTenancyCount: 2,
        closedCount: 1,
        averageSurvivalMonths: 60,
        industryDetail: "제과점",
        locationSource: "sangga_api",
      },
    ],
    disclaimer,
  },
  "4113310300104050003": {
    site: {
      pnu: "4113310300104050003",
      jibunAddress: "경기도 성남시 수정구 금토동 405-3",
      roadAddress: "경기도 성남시 수정구 대왕판교로 817",
      latitude: 37.4015,
      longitude: 127.105,
    },
    units: [
      {
        unitId: "4113310300104050003-U1",
        label: "단일 점포",
        currentBusinessName: null,
        currentStatus: "공실",
        totalTenancyCount: 3,
        closedCount: 3,
        averageSurvivalMonths: 9,
        industryDetail: null,
        locationSource: "license",
      },
    ],
    disclaimer,
  },
};

// timeline[]의 marketInfo — api-spec-v3.md대로 sameCategoryNearbyCount만 물건마다 다르고
// 나머지 5필드(소스 없음)는 물건 단위로 고정값. isPlaceholder는 현재 항상 true.
function marketInfo(base: Omit<MarketInfo, "isPlaceholder" | "asOf">): MarketInfo {
  return { isPlaceholder: true, asOf: "2026-07-04", ...base };
}

export const units: Record<string, UnitDetail> = {
  "4113310300104050001-U1": {
    unit: {
      unitId: "4113310300104050001-U1",
      label: "1층 101호",
      jibunAddress: "경기도 성남시 수정구 금토동 405-1",
      roadAddress: "경기도 성남시 수정구 대왕판교로 815",
    },
    statistics: {
      totalTenancyCount: 5,
      closedCount: 4,
      averageSurvivalMonths: 27,
      longestSurvivalMonths: 44,
      shortestSurvivalMonths: 11,
    },
    timeline: [
      { tenancyId: "t-1001", businessName: "고기굽는집", category: "한식", industryDetail: null, licensedAt: "2013-05-02", closedAt: "2017-01-10", status: "폐업", survivalMonths: 44, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 42.6, depositKrw: 50000000, monthlyRentKrw: 2800000, keyMoneyKrw: 0, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 14, vacancyRatePercent: 6.2 }) },
      { tenancyId: "t-1002", businessName: "카페모모", category: "커피", industryDetail: null, licensedAt: "2017-03-01", closedAt: "2018-05-20", status: "폐업", survivalMonths: 14, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 42.6, depositKrw: 50000000, monthlyRentKrw: 2800000, keyMoneyKrw: 0, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 6, vacancyRatePercent: 6.2 }) },
      { tenancyId: "t-1003", businessName: "마라방", category: "중식", industryDetail: null, licensedAt: "2018-08-15", closedAt: "2019-07-10", status: "폐업", survivalMonths: 11, closedAtEstimated: true, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 42.6, depositKrw: 50000000, monthlyRentKrw: 2800000, keyMoneyKrw: 0, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 3, vacancyRatePercent: 6.2 }) },
      { tenancyId: "t-1004", businessName: "분식왕", category: "분식", industryDetail: null, licensedAt: "2019-10-01", closedAt: "2022-12-05", status: "폐업", survivalMonths: 38, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 42.6, depositKrw: 50000000, monthlyRentKrw: 2800000, keyMoneyKrw: 0, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 9, vacancyRatePercent: 6.2 }) },
      { tenancyId: "t-1005", businessName: "치킨나라", category: "치킨", industryDetail: "후라이드/양념치킨", licensedAt: "2023-01-15", closedAt: null, status: "영업", survivalMonths: 41, closedAtEstimated: false, enrichmentSource: "sangga_api", marketInfo: marketInfo({ leaseAreaSqm: 42.6, depositKrw: 50000000, monthlyRentKrw: 2800000, keyMoneyKrw: 0, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 14, vacancyRatePercent: 6.2 }) },
    ],
    disclaimer,
  },
  "4113310300104050001-U2": {
    unit: {
      unitId: "4113310300104050001-U2",
      label: "2층 201호",
      jibunAddress: "경기도 성남시 수정구 금토동 405-1",
      roadAddress: "경기도 성남시 수정구 대왕판교로 815",
    },
    statistics: {
      totalTenancyCount: 3,
      closedCount: 3,
      averageSurvivalMonths: 14,
      longestSurvivalMonths: 20,
      shortestSurvivalMonths: 8,
    },
    timeline: [
      { tenancyId: "t-2001", businessName: "호프하우스", category: "주점", industryDetail: null, licensedAt: "2019-02-01", closedAt: "2020-10-01", status: "폐업", survivalMonths: 20, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 28.9, depositKrw: 30000000, monthlyRentKrw: 1800000, keyMoneyKrw: 0, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 2, vacancyRatePercent: 6.2 }) },
      { tenancyId: "t-2002", businessName: "샐러디", category: "양식", industryDetail: null, licensedAt: "2021-01-10", closedAt: "2021-09-15", status: "폐업", survivalMonths: 8, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 28.9, depositKrw: 30000000, monthlyRentKrw: 1800000, keyMoneyKrw: 0, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 4, vacancyRatePercent: 6.2 }) },
      { tenancyId: "t-2003", businessName: "떡볶이연구소", category: "분식", industryDetail: null, licensedAt: "2022-03-01", closedAt: "2023-04-20", status: "폐업", survivalMonths: 13, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 28.9, depositKrw: 30000000, monthlyRentKrw: 1800000, keyMoneyKrw: 0, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 9, vacancyRatePercent: 6.2 }) },
    ],
    disclaimer,
  },
  "4113310300104050001-U3": {
    unit: {
      unitId: "4113310300104050001-U3",
      label: "1층 102호",
      jibunAddress: "경기도 성남시 수정구 금토동 405-1",
      roadAddress: "경기도 성남시 수정구 대왕판교로 815",
    },
    statistics: {
      totalTenancyCount: 2,
      closedCount: 1,
      averageSurvivalMonths: 60,
      longestSurvivalMonths: 60,
      shortestSurvivalMonths: 60,
    },
    timeline: [
      { tenancyId: "t-3001", businessName: "김밥천국", category: "분식", industryDetail: null, licensedAt: "2013-01-05", closedAt: "2018-01-05", status: "폐업", survivalMonths: 60, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 35.0, depositKrw: 40000000, monthlyRentKrw: 2200000, keyMoneyKrw: 5000000, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 9, vacancyRatePercent: 6.2 }) },
      { tenancyId: "t-3002", businessName: "파리바게뜨", category: "제과", industryDetail: "제과점", licensedAt: "2018-04-01", closedAt: null, status: "영업", survivalMonths: 99, closedAtEstimated: false, enrichmentSource: "sangga_api", marketInfo: marketInfo({ leaseAreaSqm: 35.0, depositKrw: 40000000, monthlyRentKrw: 2200000, keyMoneyKrw: 5000000, dailyFloatingPopulation: 21400, sameCategoryNearbyCount: 3, vacancyRatePercent: 6.2 }) },
    ],
    disclaimer,
  },
  "4113310300104050003-U1": {
    unit: {
      unitId: "4113310300104050003-U1",
      label: "단일 점포",
      jibunAddress: "경기도 성남시 수정구 금토동 405-3",
      roadAddress: "경기도 성남시 수정구 대왕판교로 817",
    },
    statistics: {
      totalTenancyCount: 3,
      closedCount: 3,
      averageSurvivalMonths: 9,
      longestSurvivalMonths: 12,
      shortestSurvivalMonths: 6,
    },
    timeline: [
      { tenancyId: "t-4001", businessName: "무한리필고기", category: "한식", industryDetail: null, licensedAt: "2020-01-01", closedAt: "2021-01-01", status: "폐업", survivalMonths: 12, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 50.2, depositKrw: 20000000, monthlyRentKrw: 1500000, keyMoneyKrw: 0, dailyFloatingPopulation: 8600, sameCategoryNearbyCount: 1, vacancyRatePercent: 11.4 }) },
      { tenancyId: "t-4002", businessName: "포케올데이", category: "양식", industryDetail: null, licensedAt: "2021-05-01", closedAt: "2021-11-01", status: "폐업", survivalMonths: 6, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 50.2, depositKrw: 20000000, monthlyRentKrw: 1500000, keyMoneyKrw: 0, dailyFloatingPopulation: 8600, sameCategoryNearbyCount: 0, vacancyRatePercent: 11.4 }) },
      { tenancyId: "t-4003", businessName: "마차코", category: "카페", industryDetail: null, licensedAt: "2022-02-01", closedAt: "2022-11-01", status: "폐업", survivalMonths: 9, closedAtEstimated: false, enrichmentSource: "license_only", marketInfo: marketInfo({ leaseAreaSqm: 50.2, depositKrw: 20000000, monthlyRentKrw: 1500000, keyMoneyKrw: 0, dailyFloatingPopulation: 8600, sameCategoryNearbyCount: 2, vacancyRatePercent: 11.4 }) },
    ],
    disclaimer,
  },
};

import type { Candidate, SiteDetail, UnitDetail } from "../types";

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
      },
      {
        unitId: "4113310300104050001-U2",
        label: "2층 201호",
        currentBusinessName: null,
        currentStatus: "공실",
        totalTenancyCount: 3,
        closedCount: 3,
        averageSurvivalMonths: 14,
      },
      {
        unitId: "4113310300104050001-U3",
        label: "1층 102호",
        currentBusinessName: "파리바게뜨",
        currentStatus: "영업",
        totalTenancyCount: 2,
        closedCount: 1,
        averageSurvivalMonths: 60,
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
      },
    ],
    disclaimer,
  },
};

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
      { businessName: "고기굽는집", category: "한식", licensedAt: "2013-05-02", closedAt: "2017-01-10", status: "폐업", survivalMonths: 44, closedAtEstimated: false },
      { businessName: "카페모모", category: "커피", licensedAt: "2017-03-01", closedAt: "2018-05-20", status: "폐업", survivalMonths: 14, closedAtEstimated: false },
      { businessName: "마라방", category: "중식", licensedAt: "2018-08-15", closedAt: "2019-07-10", status: "폐업", survivalMonths: 11, closedAtEstimated: true },
      { businessName: "분식왕", category: "분식", licensedAt: "2019-10-01", closedAt: "2022-12-05", status: "폐업", survivalMonths: 38, closedAtEstimated: false },
      { businessName: "치킨나라", category: "치킨", licensedAt: "2023-01-15", closedAt: null, status: "영업", survivalMonths: 41, closedAtEstimated: false },
    ],
    neighborhood: {
      totalStoreCount: 86,
      sameCategoryCount: 6,
      categoryBreakdown: [
        { category: "한식", count: 22 },
        { category: "치킨", count: 6 },
        { category: "카페", count: 14 },
        { category: "분식", count: 9 },
        { category: "기타", count: 35 },
      ],
      recentOpenCount: 4,
      radiusMeters: 300,
      snapshotAt: "2026-07-01",
    },
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
      { businessName: "호프하우스", category: "주점", licensedAt: "2019-02-01", closedAt: "2020-10-01", status: "폐업", survivalMonths: 20, closedAtEstimated: false },
      { businessName: "샐러디", category: "양식", licensedAt: "2021-01-10", closedAt: "2021-09-15", status: "폐업", survivalMonths: 8, closedAtEstimated: false },
      { businessName: "떡볶이연구소", category: "분식", licensedAt: "2022-03-01", closedAt: "2023-04-20", status: "폐업", survivalMonths: 13, closedAtEstimated: false },
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
      { businessName: "김밥천국", category: "분식", licensedAt: "2013-01-05", closedAt: "2018-01-05", status: "폐업", survivalMonths: 60, closedAtEstimated: false },
      { businessName: "파리바게뜨", category: "제과", licensedAt: "2018-04-01", closedAt: null, status: "영업", survivalMonths: 99, closedAtEstimated: false },
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
      { businessName: "무한리필고기", category: "한식", licensedAt: "2020-01-01", closedAt: "2021-01-01", status: "폐업", survivalMonths: 12, closedAtEstimated: false },
      { businessName: "포케올데이", category: "양식", licensedAt: "2021-05-01", closedAt: "2021-11-01", status: "폐업", survivalMonths: 6, closedAtEstimated: false },
      { businessName: "마차코", category: "카페", licensedAt: "2022-02-01", closedAt: "2022-11-01", status: "폐업", survivalMonths: 9, closedAtEstimated: false },
    ],
    disclaimer,
  },
};

import { describe, expect, it } from "vitest";
import type { Lounge, LoungeFilters } from "./lounge-types";
import {
  applyFilterChange,
  EMPTY_FILTERS,
  filterLounges,
  formatAirportOption,
  getFilterOptions,
  sanitizeFilters,
  splitValues
} from "./lounge-filter";

const lounges: Lounge[] = [
  {
    id: "1",
    continent: "亚洲",
    country: "日本",
    city: "东京",
    airport: "东京成田国际机场",
    code: "NRT",
    terminal: "T1航站楼",
    loungeName: "IASS Executive Lounge",
    departureType: "国际出发,国内出发",
    securityType: "安检后",
    directions: "26号登机口附近"
  },
  {
    id: "2",
    continent: "亚洲",
    country: "泰国",
    city: "曼谷",
    airport: "素万那普国际机场",
    code: "BKK",
    terminal: "主航站楼",
    loungeName: "Miracle Lounge",
    departureType: "国际出发",
    securityType: "安检后",
    directions: "D区附近"
  },
  {
    id: "3",
    continent: "欧洲",
    country: "英国",
    city: "伦敦",
    airport: "伦敦希思罗机场",
    code: "LHR",
    terminal: "T5航站楼",
    loungeName: "Plaza Premium Lounge",
    departureType: "国际到达",
    securityType: "到达区",
    directions: "到达大厅"
  }
];

const cascadeLounges: Lounge[] = [
  {
    id: "cascade-1",
    continent: "欧洲",
    country: "英国",
    city: "伦敦市",
    airport: "伦敦希思罗机场",
    code: "LHR",
    terminal: "T2航站楼",
    loungeName: "No1 Lounge",
    departureType: "国际出发",
    securityType: "安检后",
    directions: "A18登机口附近"
  },
  {
    id: "cascade-2",
    continent: "欧洲",
    country: "英国",
    city: "伦敦市",
    airport: "伦敦盖特威克机场",
    code: "LGW",
    terminal: "南航站楼",
    loungeName: "Clubrooms",
    departureType: "国际出发",
    securityType: "安检后",
    directions: "出发大厅"
  },
  {
    id: "cascade-3",
    continent: "欧洲",
    country: "英国",
    city: "曼彻斯特",
    airport: "曼彻斯特机场",
    code: "MAN",
    terminal: "T1航站楼",
    loungeName: "Escape Lounge",
    departureType: "国际出发",
    securityType: "安检后",
    directions: "1号航站楼"
  },
  {
    id: "cascade-4",
    continent: "欧洲",
    country: "法国",
    city: "巴黎",
    airport: "巴黎戴高乐机场",
    code: "CDG",
    terminal: "T1航站楼",
    loungeName: "Star Alliance Lounge",
    departureType: "国际出发",
    securityType: "安检后",
    directions: "T1"
  },
  {
    id: "cascade-5",
    continent: "亚洲",
    country: "日本",
    city: "东京市",
    airport: "东京成田国际机场",
    code: "NRT",
    terminal: "T1航站楼",
    loungeName: "IASS Executive Lounge",
    departureType: "国际出发",
    securityType: "安检后",
    directions: "26号登机口附近"
  }
];

function filters(overrides: Partial<LoungeFilters>): LoungeFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe("lounge filter engine", () => {
  it("splits comma-separated labels", () => {
    expect(splitValues("国际出发,国内出发")).toEqual(["国际出发", "国内出发"]);
  });

  it("filters by cascade fields and split departure type", () => {
    const result = filterLounges(lounges, filters({ continent: "亚洲", departureType: "国内出发" }));

    expect(result.map((item) => item.code)).toEqual(["NRT"]);
  });

  it("searches airport code, lounge name, and directions", () => {
    expect(filterLounges(lounges, filters({ query: "lhr" })).map((item) => item.city)).toEqual(["伦敦"]);
    expect(filterLounges(lounges, filters({ query: "Miracle" })).map((item) => item.code)).toEqual(["BKK"]);
    expect(filterLounges(lounges, filters({ query: "26号" })).map((item) => item.code)).toEqual(["NRT"]);
  });

  it("limits country options after selecting a continent", () => {
    expect(getFilterOptions(lounges, filters({ continent: "亚洲" }), "country")).toEqual(["日本", "泰国"]);
  });

  it("limits each filter option list only by earlier cascade filters", () => {
    const selected = filters({
      continent: "欧洲",
      country: "英国",
      city: "伦敦市",
      airport: "伦敦希思罗机场",
      terminal: "T2航站楼"
    });

    expect(getFilterOptions(cascadeLounges, selected, "continent")).toEqual(expect.arrayContaining(["亚洲", "欧洲"]));
    expect(getFilterOptions(cascadeLounges, selected, "country")).toEqual(expect.arrayContaining(["法国", "英国"]));
    expect(getFilterOptions(cascadeLounges, selected, "city")).toEqual(expect.arrayContaining(["伦敦市", "曼彻斯特"]));
    expect(getFilterOptions(cascadeLounges, selected, "airport")).toEqual(
      expect.arrayContaining(["伦敦希思罗机场", "伦敦盖特威克机场"])
    );
  });

  it("does not let query text hide cascade filter options", () => {
    const selected = filters({
      query: "没有匹配的搜索词",
      continent: "欧洲",
      country: "英国"
    });

    expect(getFilterOptions(cascadeLounges, selected, "continent")).toEqual(expect.arrayContaining(["亚洲", "欧洲"]));
    expect(getFilterOptions(cascadeLounges, selected, "country")).toEqual(expect.arrayContaining(["法国", "英国"]));
  });

  it("clears downstream filters after changing an upstream filter", () => {
    const selected = filters({
      continent: "欧洲",
      country: "英国",
      city: "伦敦市",
      airport: "伦敦希思罗机场",
      terminal: "T2航站楼",
      departureType: "国际出发",
      securityType: "安检后"
    });

    expect(applyFilterChange(cascadeLounges, selected, "airport", "伦敦盖特威克机场")).toMatchObject({
      airport: "伦敦盖特威克机场",
      terminal: "",
      departureType: "",
      securityType: ""
    });
  });

  it("keeps airport options as airport names while display formatting includes code", () => {
    expect(getFilterOptions(lounges, filters({ country: "日本" }), "airport")).toEqual(["东京成田国际机场"]);
    expect(formatAirportOption(lounges[0])).toBe("东京成田国际机场 · NRT");
  });

  it("normalizes terminal spacing for filter options and matching", () => {
    const heathrowLounges: Lounge[] = [
      {
        ...lounges[2],
        id: "lhr-1",
        terminal: "T2 航站楼",
        loungeName: "No1 Lounge"
      },
      {
        ...lounges[2],
        id: "lhr-2",
        terminal: "T2航站楼",
        loungeName: "Plaza Premium Lounge"
      }
    ];

    expect(getFilterOptions(heathrowLounges, EMPTY_FILTERS, "terminal")).toEqual(["T2航站楼"]);
    expect(filterLounges(heathrowLounges, filters({ terminal: "T2航站楼" })).map((item) => item.id)).toEqual([
      "lhr-1",
      "lhr-2"
    ]);
  });

  it("searches terminals with normalized spacing", () => {
    const heathrowLounges: Lounge[] = [
      {
        ...lounges[2],
        id: "lhr-1",
        terminal: "T2 航站楼",
        loungeName: "No1 Lounge",
        directions: "A18登机口附近"
      },
      {
        ...lounges[2],
        id: "lhr-2",
        terminal: "T2航站楼",
        loungeName: "Plaza Premium Lounge",
        directions: "A3 Lounge标识附近"
      }
    ];

    expect(filterLounges(heathrowLounges, filters({ query: "T2航站楼" })).map((item) => item.id)).toEqual([
      "lhr-1",
      "lhr-2"
    ]);
  });

  it("clears invalid downstream values after upstream changes", () => {
    const stale = filters({ continent: "欧洲", country: "日本", city: "东京" });

    expect(sanitizeFilters(lounges, stale)).toMatchObject({ continent: "欧洲", country: "", city: "" });
  });
});

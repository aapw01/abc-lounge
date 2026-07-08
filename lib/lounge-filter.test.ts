import { describe, expect, it } from "vitest";
import type { Lounge, LoungeFilters } from "./lounge-types";
import {
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

  it("clears invalid downstream values after upstream changes", () => {
    const stale = filters({ continent: "欧洲", country: "日本", city: "东京" });

    expect(sanitizeFilters(lounges, stale)).toMatchObject({ continent: "欧洲", country: "", city: "" });
  });
});

import type { FilterKey, Lounge, LoungeFilters } from "./lounge-types";

export const EMPTY_FILTERS: LoungeFilters = {
  query: "",
  continent: "",
  country: "",
  city: "",
  airport: "",
  terminal: "",
  departureType: "",
  securityType: ""
};

const FILTER_KEYS: FilterKey[] = [
  "continent",
  "country",
  "city",
  "airport",
  "terminal",
  "departureType",
  "securityType"
];

const SPLIT_FIELDS = new Set<FilterKey>(["departureType"]);

export function normalizeTerminal(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^([A-Za-z]\d+[A-Za-z]?)\s+航站楼$/i, "$1航站楼");
}

export function normalizeFilterValue(key: FilterKey, value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return key === "terminal" ? normalizeTerminal(trimmed) : trimmed;
}

export function splitValues(value: string): string[] {
  return value
    .split(/[,，]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function itemValues(item: Lounge, key: FilterKey): string[] {
  const value = item[key];
  if (!value) {
    return [];
  }
  const values = SPLIT_FIELDS.has(key) ? splitValues(value) : [value];
  return values.map((part) => normalizeFilterValue(key, part)).filter(Boolean);
}

function matchesField(item: Lounge, key: FilterKey, expected: string): boolean {
  const normalizedExpected = normalizeFilterValue(key, expected);
  if (!normalizedExpected) {
    return true;
  }
  return itemValues(item, key).includes(normalizedExpected);
}

function matchesQuery(item: Lounge, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return [
    item.continent,
    item.country,
    item.city,
    item.airport,
    item.code,
    item.terminal,
    item.loungeName,
    item.departureType,
    item.securityType,
    item.directions
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export function filterLounges(lounges: Lounge[], filters: LoungeFilters): Lounge[] {
  return lounges.filter((item) => {
    return FILTER_KEYS.every((key) => matchesField(item, key, filters[key])) && matchesQuery(item, filters.query);
  });
}

export function getFilterOptions(lounges: Lounge[], filters: LoungeFilters, key: FilterKey): string[] {
  const scopedFilters = { ...filters, [key]: "" };
  const scoped = filterLounges(lounges, scopedFilters);
  const values = new Set<string>();

  for (const item of scoped) {
    for (const value of itemValues(item, key)) {
      values.add(value);
    }
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
}

export function sanitizeFilters(lounges: Lounge[], filters: LoungeFilters): LoungeFilters {
  const next = { ...filters };
  const hierarchyContext = { ...EMPTY_FILTERS, query: "" };

  for (const key of FILTER_KEYS) {
    const value = normalizeFilterValue(key, next[key]);
    const options = getFilterOptions(lounges, hierarchyContext, key);

    if (value && options.includes(value)) {
      next[key] = value;
      hierarchyContext[key] = value;
      continue;
    }

    next[key] = "";
    hierarchyContext[key] = "";
  }

  return next;
}

export function formatAirportOption(lounge: Pick<Lounge, "airport" | "code">): string {
  const airport = lounge.airport || "未注明";
  if (!lounge.code) {
    return airport;
  }
  return `${airport} · ${lounge.code}`;
}

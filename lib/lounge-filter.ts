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

function normalizeSearchText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/([A-Za-z]\d+[A-Za-z]?)\s+航站楼/gi, "$1航站楼")
    .toLowerCase();
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
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return true;
  }

  const searchable = [
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
    .join(" ");

  return normalizeSearchText(searchable).includes(normalized);
}

export function filterLounges(lounges: Lounge[], filters: LoungeFilters): Lounge[] {
  return lounges.filter((item) => {
    return FILTER_KEYS.every((key) => matchesField(item, key, filters[key])) && matchesQuery(item, filters.query);
  });
}

function priorFilterScope(filters: LoungeFilters, key: FilterKey): LoungeFilters {
  const scopedFilters = { ...EMPTY_FILTERS, query: "" };
  const keyIndex = FILTER_KEYS.indexOf(key);

  for (const priorKey of FILTER_KEYS.slice(0, keyIndex)) {
    scopedFilters[priorKey] = normalizeFilterValue(priorKey, filters[priorKey]);
  }

  return scopedFilters;
}

export function getFilterOptions(lounges: Lounge[], filters: LoungeFilters, key: FilterKey): string[] {
  const scoped = filterLounges(lounges, priorFilterScope(filters, key));
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

export function applyFilterChange(
  lounges: Lounge[],
  filters: LoungeFilters,
  key: keyof LoungeFilters,
  value: string
): LoungeFilters {
  if (key === "query") {
    return sanitizeFilters(lounges, { ...filters, query: value });
  }

  const keyIndex = FILTER_KEYS.indexOf(key);
  const next = { ...filters, [key]: normalizeFilterValue(key, value) };

  for (const downstreamKey of FILTER_KEYS.slice(keyIndex + 1)) {
    next[downstreamKey] = "";
  }

  return sanitizeFilters(lounges, next);
}

export function formatAirportOption(lounge: Pick<Lounge, "airport" | "code">): string {
  const airport = lounge.airport || "未注明";
  if (!lounge.code) {
    return airport;
  }
  return `${airport} · ${lounge.code}`;
}

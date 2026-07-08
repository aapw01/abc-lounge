# Dragonpass Lounge Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, Vercel-ready, mobile-first Next.js search site for the ABC overseas DragonPass lounge spreadsheet.

**Architecture:** The Excel workbook is converted into static JSON at build time through a local script. The frontend imports that JSON and uses pure TypeScript functions for filtering, option generation, and invalid child-selection cleanup. The UI is a single mobile-first search page with cascade select boxes and result cards.

**Tech Stack:** Next.js, React, TypeScript, global CSS, Vitest, Testing Library, SheetJS `xlsx` for the Excel-to-JSON conversion script, Python standard library for local PNG generation, Vercel static deployment.

## Global Constraints

- Do not build a backend, database, login, admin panel, or API service.
- Use `W020260702557021741944.xlsx` as the source workbook and read only the `贵宾厅境外机场清单` sheet.
- Preserve `airport` and `code` as separate data fields; the airport select may display them together as `机场名 · 三字码`.
- Use select controls for primary filters.
- Cascade filter options so each select only shows values available under the current compatible filters.
- If an upstream filter change makes a downstream value invalid, clear the invalid downstream value.
- Mobile-first layout; page opens directly into the search tool.
- Keep the source Excel file unchanged.

---

## File Structure

- Create `package.json`: scripts, runtime dependencies, and test dependencies.
- Create `next.config.ts`: static-friendly Next.js config.
- Create `tsconfig.json`: strict TypeScript config with JSON imports.
- Create `vitest.config.ts`: jsdom test environment.
- Create `app/layout.tsx`: root metadata and document shell.
- Create `app/page.tsx`: client-side search page composition.
- Create `app/globals.css`: complete responsive visual design.
- Create `components/FilterSelect.tsx`: reusable select control.
- Create `components/LoungeCard.tsx`: mobile-first result card.
- Create `lib/lounge-types.ts`: shared `Lounge` and `LoungeFilters` types.
- Create `lib/lounge-filter.ts`: pure filter, option, split-label, and cleanup functions.
- Create `lib/lounge-filter.test.ts`: unit tests for cascade filtering.
- Create `scripts/convert-lounges.mjs`: Excel-to-JSON conversion script.
- Create `scripts/make-visual-asset.py`: generated bitmap texture for the search header.
- Generate `data/lounges.json`: static application data.
- Generate `public/lounge-terminal-texture.png`: local visual asset.
- Create `README.md`: local run, data refresh, and Vercel deployment notes.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm run test`, `npm run convert:data`.
- Produces: a minimal Next.js app that renders a static shell before data work begins.

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "abc-dragonpass-lounge-search",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "convert:data": "node scripts/convert-lounges.mjs",
    "make:asset": "python3 scripts/make-visual-asset.py"
  },
  "dependencies": {
    "lucide-react": "latest",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "typescript": "latest",
    "vitest": "latest",
    "xlsx": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and `node_modules` is populated.

- [ ] **Step 3: Add Next.js and test config**

Create `next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

- [ ] **Step 4: Add minimal app shell**

Create `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "农行境外贵宾休息室查询",
  description: "按州、国家、城市、机场、航站楼和安检类型查询农行境外贵宾休息室。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

Create `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">ABC DragonPass</p>
        <h1>农行境外贵宾休息室查询</h1>
        <p className="hero-copy">正在准备查询工具。</p>
      </section>
    </main>
  );
}
```

Create `app/globals.css`:

```css
:root {
  color-scheme: light;
  --ink: #17201a;
  --muted: #627068;
  --paper: #f7f5ef;
  --panel: #fffdf8;
  --line: #ded8ca;
  --accent: #176f56;
  --accent-strong: #0f4f3e;
  --gold: #b98b35;
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  background: var(--paper);
}

body {
  min-height: 100%;
  margin: 0;
  color: var(--ink);
  background: var(--paper);
  font-family: ui-serif, "Songti SC", "Noto Serif CJK SC", Georgia, serif;
}

button,
input,
select {
  font: inherit;
}

.app-shell {
  width: min(100%, 1120px);
  margin: 0 auto;
  padding: 20px;
}

.hero-panel {
  min-height: 240px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 32px 24px;
  background: var(--panel);
}

.eyebrow {
  margin: 0 0 12px;
  color: var(--accent);
  font-size: 0.78rem;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 8vw, 4rem);
  line-height: 1.05;
  letter-spacing: 0;
}

.hero-copy {
  max-width: 560px;
  color: var(--muted);
  line-height: 1.8;
}
```

- [ ] **Step 5: Verify scaffold**

Run: `npm run build`

Expected: Next.js build completes without TypeScript or CSS errors.

- [ ] **Step 6: Commit scaffold**

Run:

```bash
git add package.json package-lock.json next.config.ts tsconfig.json vitest.config.ts app
git commit -m "chore: scaffold lounge search app"
```

Expected: commit succeeds.

---

### Task 2: Data Conversion

**Files:**
- Create: `scripts/convert-lounges.mjs`
- Create: `data/lounges.json`
- Create: `lib/lounge-types.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `W020260702557021741944.xlsx`.
- Produces: `data/lounges.json` as an array of `Lounge`.
- Produces: `type Lounge` in `lib/lounge-types.ts`.

- [ ] **Step 1: Add shared data types**

Create `lib/lounge-types.ts`:

```ts
export type Lounge = {
  id: string;
  continent: string;
  country: string;
  city: string;
  airport: string;
  code: string;
  terminal: string;
  loungeName: string;
  departureType: string;
  securityType: string;
  directions: string;
};

export type FilterKey =
  | "continent"
  | "country"
  | "city"
  | "airport"
  | "terminal"
  | "departureType"
  | "securityType";

export type LoungeFilters = Record<FilterKey, string> & {
  query: string;
};
```

- [ ] **Step 2: Write conversion script**

Create `scripts/convert-lounges.mjs`:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import xlsx from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const source = path.join(root, "W020260702557021741944.xlsx");
const output = path.join(root, "data", "lounges.json");
const sheetName = "贵宾厅境外机场清单";

const fieldMap = {
  "州": "continent",
  "国家": "country",
  "城市": "city",
  "站点": "airport",
  "三字码": "code",
  "航站楼": "terminal",
  "名称": "loungeName",
  "出发类型": "departureType",
  "安检类型": "securityType",
  "位置指引": "directions",
};

function clean(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).replace(/\u3000/g, " ").trim();
}

const workbook = xlsx.readFile(source);
const sheet = workbook.Sheets[sheetName];

if (!sheet) {
  throw new Error(`Missing sheet: ${sheetName}`);
}

const rows = xlsx.utils.sheet_to_json(sheet, { defval: "", raw: false });
const missing = Object.keys(fieldMap).filter((column) => !Object.prototype.hasOwnProperty.call(rows[0] ?? {}, column));

if (missing.length) {
  throw new Error(`Missing required columns: ${missing.join(", ")}`);
}

const records = rows.map((row, index) => {
  const item = { id: `lounge-${String(index + 1).padStart(4, "0")}` };
  for (const [sourceKey, targetKey] of Object.entries(fieldMap)) {
    item[targetKey] = clean(row[sourceKey]);
  }
  return item;
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(records, null, 2)}\n`, "utf8");
console.log(`Wrote ${records.length} lounges to ${path.relative(root, output)}`);
```

- [ ] **Step 3: Run conversion**

Run: `npm run convert:data`

Expected: prints `Wrote 1024 lounges to data/lounges.json`.

- [ ] **Step 4: Verify generated JSON**

Run: `node -e "const data=require('./data/lounges.json'); console.log(data.length, data[0].continent, data[0].code, data[0].airport)"`

Expected: output starts with `1024 北美洲 ANU 圣约翰-维尔伯德国际机场`.

- [ ] **Step 5: Commit data conversion**

Run:

```bash
git add scripts/convert-lounges.mjs data/lounges.json lib/lounge-types.ts package.json
git commit -m "feat: convert lounge spreadsheet to static data"
```

Expected: commit succeeds.

---

### Task 3: Filter Engine

**Files:**
- Create: `lib/lounge-filter.test.ts`
- Create: `lib/lounge-filter.ts`

**Interfaces:**
- Consumes: `Lounge` and `LoungeFilters` from `lib/lounge-types.ts`.
- Produces: `EMPTY_FILTERS: LoungeFilters`.
- Produces: `splitValues(value: string): string[]`.
- Produces: `filterLounges(lounges: Lounge[], filters: LoungeFilters): Lounge[]`.
- Produces: `getFilterOptions(lounges: Lounge[], filters: LoungeFilters, key: FilterKey): string[]`.
- Produces: `sanitizeFilters(lounges: Lounge[], filters: LoungeFilters): LoungeFilters`.
- Produces: `formatAirportOption(lounge: Pick<Lounge, "airport" | "code">): string`.

- [ ] **Step 1: Write failing filter tests**

Create `lib/lounge-filter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Lounge, LoungeFilters } from "./lounge-types";
import {
  EMPTY_FILTERS,
  filterLounges,
  formatAirportOption,
  getFilterOptions,
  sanitizeFilters,
  splitValues,
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
    directions: "26号登机口附近",
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
    directions: "D区附近",
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
    directions: "到达大厅",
  },
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

  it("clears invalid downstream values after upstream changes", () => {
    const stale = filters({ continent: "欧洲", country: "日本", city: "东京" });
    expect(sanitizeFilters(lounges, stale)).toMatchObject({ continent: "欧洲", country: "", city: "" });
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run test -- lib/lounge-filter.test.ts`

Expected: FAIL because `lib/lounge-filter.ts` does not exist.

- [ ] **Step 3: Implement filter engine**

Create `lib/lounge-filter.ts`:

```ts
import type { FilterKey, Lounge, LoungeFilters } from "./lounge-types";

export const EMPTY_FILTERS: LoungeFilters = {
  query: "",
  continent: "",
  country: "",
  city: "",
  airport: "",
  terminal: "",
  departureType: "",
  securityType: "",
};

const FILTER_KEYS: FilterKey[] = [
  "continent",
  "country",
  "city",
  "airport",
  "terminal",
  "departureType",
  "securityType",
];

const SPLIT_FIELDS = new Set<FilterKey>(["departureType"]);

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
  return SPLIT_FIELDS.has(key) ? splitValues(value) : [value];
}

function matchesField(item: Lounge, key: FilterKey, expected: string): boolean {
  if (!expected) {
    return true;
  }
  return itemValues(item, key).includes(expected);
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
    item.directions,
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
  let next = { ...filters };

  for (const key of FILTER_KEYS) {
    const value = next[key];
    if (!value) {
      continue;
    }
    const options = getFilterOptions(lounges, next, key);
    if (!options.includes(value)) {
      next = { ...next, [key]: "" };
    }
  }

  return next;
}

export function formatAirportOption(lounge: Pick<Lounge, "airport" | "code">): string {
  if (!lounge.code) {
    return lounge.airport || "未注明";
  }
  return `${lounge.airport || "未注明"} · ${lounge.code}`;
}
```

- [ ] **Step 4: Run tests and verify pass**

Run: `npm run test -- lib/lounge-filter.test.ts`

Expected: all six tests pass.

- [ ] **Step 5: Commit filter engine**

Run:

```bash
git add lib/lounge-filter.ts lib/lounge-filter.test.ts
git commit -m "feat: add cascading lounge filters"
```

Expected: commit succeeds.

---

### Task 4: Search UI

**Files:**
- Create: `components/FilterSelect.tsx`
- Create: `components/LoungeCard.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `data/lounges.json`.
- Consumes: `filterLounges`, `getFilterOptions`, `sanitizeFilters`, `EMPTY_FILTERS`, `formatAirportOption`.
- Produces: a client-side mobile-first search page.

- [ ] **Step 1: Create reusable filter select**

Create `components/FilterSelect.tsx`:

```tsx
"use client";

type FilterSelectProps = {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  formatOption?: (value: string) => string;
  onChange: (value: string) => void;
};

export function FilterSelect({ label, value, options, placeholder, formatOption, onChange }: FilterSelectProps) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatOption ? formatOption(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}
```

- [ ] **Step 2: Create result card**

Create `components/LoungeCard.tsx`:

```tsx
import { MapPin, Plane, ShieldCheck } from "lucide-react";
import type { Lounge } from "../lib/lounge-types";

function valueOrFallback(value: string): string {
  return value || "未注明";
}

export function LoungeCard({ lounge }: { lounge: Lounge }) {
  return (
    <article className="lounge-card">
      <div className="card-heading">
        <div>
          <p className="city-line">{lounge.city} · {lounge.country}</p>
          <h2>{lounge.loungeName}</h2>
        </div>
        <span className="airport-code">{lounge.code}</span>
      </div>
      <p className="airport-name">{lounge.airport}</p>
      <div className="card-tags">
        <span><Plane size={15} aria-hidden="true" />{valueOrFallback(lounge.terminal)}</span>
        <span><ShieldCheck size={15} aria-hidden="true" />{valueOrFallback(lounge.securityType)}</span>
        <span>{valueOrFallback(lounge.departureType)}</span>
      </div>
      <div className="direction-line">
        <MapPin size={16} aria-hidden="true" />
        <p>{valueOrFallback(lounge.directions)}</p>
      </div>
    </article>
  );
}
```

- [ ] **Step 3: Wire page state and cascade behavior**

Replace `app/page.tsx`:

```tsx
"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FilterSelect } from "../components/FilterSelect";
import { LoungeCard } from "../components/LoungeCard";
import loungesData from "../data/lounges.json";
import {
  EMPTY_FILTERS,
  filterLounges,
  formatAirportOption,
  getFilterOptions,
  sanitizeFilters,
} from "../lib/lounge-filter";
import type { FilterKey, Lounge, LoungeFilters } from "../lib/lounge-types";

const lounges = loungesData as Lounge[];

const FILTERS: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: "continent", label: "州", placeholder: "全部州" },
  { key: "country", label: "国家", placeholder: "全部国家" },
  { key: "city", label: "城市", placeholder: "全部城市" },
  { key: "airport", label: "机场（显示三字码）", placeholder: "全部机场" },
  { key: "terminal", label: "航站楼", placeholder: "全部航站楼" },
  { key: "departureType", label: "出发类型", placeholder: "全部类型" },
  { key: "securityType", label: "安检类型", placeholder: "全部区域" },
];

function countActive(filters: LoungeFilters): number {
  return Object.entries(filters).filter(([, value]) => value.trim()).length;
}

export default function Home() {
  const [filters, setFilters] = useState<LoungeFilters>(EMPTY_FILTERS);

  const results = useMemo(() => filterLounges(lounges, filters), [filters]);
  const activeCount = countActive(filters);

  const airportLabelByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const lounge of lounges) {
      if (!map.has(lounge.airport)) {
        map.set(lounge.airport, formatAirportOption(lounge));
      }
    }
    return map;
  }, []);

  function updateFilter(key: keyof LoungeFilters, value: string) {
    setFilters((current) => sanitizeFilters(lounges, { ...current, [key]: value }));
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-text">
          <p className="eyebrow">ABC DragonPass</p>
          <h1>农行境外贵宾休息室查询</h1>
          <p className="hero-copy">按洲际、国家、城市、机场和航站楼快速缩小范围，手机上也不用在长表格里反复滑动。</p>
        </div>
        <div className="hero-stats" aria-label="数据概览">
          <strong>{lounges.length}</strong>
          <span>间休息室</span>
          <small>{results.length} 条匹配</small>
        </div>
      </section>

      <section className="search-panel" aria-label="查询条件">
        <label className="search-box">
          <Search size={20} aria-hidden="true" />
          <input
            value={filters.query}
            onChange={(event) => updateFilter("query", event.target.value)}
            placeholder="搜索城市、机场、三字码、休息室名称"
          />
        </label>

        <div className="filter-header">
          <div>
            <p><SlidersHorizontal size={16} aria-hidden="true" />筛选条件</p>
            <span>{activeCount ? `已选择 ${activeCount} 项` : "选择任意条件开始缩小范围"}</span>
          </div>
          <button type="button" onClick={clearFilters} disabled={!activeCount}>
            <X size={16} aria-hidden="true" />
            清空
          </button>
        </div>

        <div className="filter-grid">
          {FILTERS.map((filter) => (
            <FilterSelect
              key={filter.key}
              label={filter.label}
              value={filters[filter.key]}
              options={getFilterOptions(lounges, filters, filter.key)}
              placeholder={filter.placeholder}
              formatOption={
                filter.key === "airport"
                  ? (value) => airportLabelByName.get(value) ?? value
                  : undefined
              }
              onChange={(value) => updateFilter(filter.key, value)}
            />
          ))}
        </div>
      </section>

      <section className="results-section" aria-label="查询结果">
        <div className="results-heading">
          <p>查询结果</p>
          <span>{results.length} / {lounges.length}</span>
        </div>

        {results.length ? (
          <div className="result-list">
            {results.map((lounge) => (
              <LoungeCard key={lounge.id} lounge={lounge} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>没有找到匹配的休息室</p>
            <button type="button" onClick={clearFilters}>清空筛选</button>
          </div>
        )}
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Replace CSS with production layout**

Replace `app/globals.css` with responsive styles for:

```css
:root {
  color-scheme: light;
  --ink: #17201a;
  --muted: #647269;
  --paper: #f5f1e8;
  --panel: #fffdf8;
  --line: #ddd4c3;
  --accent: #14664f;
  --accent-strong: #0e4939;
  --gold: #b98932;
  --mist: #eaf1ec;
  --danger: #9b3d28;
  --shadow: 0 18px 60px rgba(42, 51, 40, 0.13);
}
```

The stylesheet must define stable responsive layouts for `.app-shell`, `.hero-panel`, `.hero-text`, `.hero-stats`, `.search-panel`, `.search-box`, `.filter-header`, `.filter-grid`, `.filter-field`, `.results-section`, `.results-heading`, `.result-list`, `.lounge-card`, `.card-heading`, `.airport-code`, `.card-tags`, `.direction-line`, and `.empty-state`. Use 8px or smaller border radii for cards and controls, keep letter spacing at `0`, and avoid text overflow inside buttons and select boxes.

- [ ] **Step 5: Run tests and build**

Run: `npm run test`

Expected: filter tests pass.

Run: `npm run build`

Expected: Next.js build succeeds.

- [ ] **Step 6: Commit search UI**

Run:

```bash
git add app components
git commit -m "feat: build mobile lounge search UI"
```

Expected: commit succeeds.

---

### Task 5: Visual Asset, Documentation, And Browser Verification

**Files:**
- Create: `scripts/make-visual-asset.py`
- Create: `public/lounge-terminal-texture.png`
- Create: `README.md`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: local Python 3 standard library.
- Produces: a local bitmap asset used by `.hero-panel`.
- Produces: README instructions for local development, data refresh, and Vercel deployment.

- [ ] **Step 1: Generate a local bitmap texture**

Create `scripts/make-visual-asset.py`:

```python
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "lounge-terminal-texture.png"


def chunk(kind: bytes, data: bytes) -> bytes:
    body = kind + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def mix(a: int, b: int, amount: float) -> int:
    return int(a * (1 - amount) + b * amount)


def color_at(x: int, y: int, width: int, height: int) -> tuple[int, int, int]:
    vertical = y / height
    r = mix(245, 224, vertical)
    g = mix(241, 232, vertical)
    b = mix(232, 216, vertical)

    route = abs(((x + y * 2) % 180) - 90)
    if route < 2:
        r, g, b = 207, 190, 157

    board = 760 < x < 1110 and 74 < y < 360
    if board and (abs(x - 760) < 5 or abs(x - 1110) < 5 or abs(y - 74) < 5 or abs(y - 360) < 5):
        r, g, b = 20, 102, 79
    if board and (abs(y - 135) < 3 or abs(y - 210) < 3 or abs(y - 285) < 3) and 790 < x < 1080:
        r, g, b = 185, 137, 50

    for stand_x in range(120, width, 220):
        if stand_x < x < stand_x + 120 and 120 < y < 180 and (abs(y - 120) < 3 or abs(y - 180) < 3 or abs(x - stand_x) < 3 or abs(x - stand_x - 120) < 3):
            r, g, b = 197, 160, 90
        leg_left = abs((x - (stand_x + 18)) - (y - 180) * 84 / 180) < 2 and 180 < y < 360
        leg_right = abs((x - (stand_x + 102)) + (y - 180) * 84 / 180) < 2 and 180 < y < 360
        if leg_left or leg_right:
            r, g, b = 197, 160, 90

    return r, g, b


def main() -> None:
    width, height = 1200, 520
    rows = []
    for y in range(height):
        row = bytearray([0])
        for x in range(width):
            row.extend(color_at(x, y, width, height))
        rows.append(bytes(row))

    raw = b"".join(rows)
    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(png)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
```

Run: `npm run make:asset`

Expected: prints `Wrote public/lounge-terminal-texture.png`.

- [ ] **Step 2: Use the visual asset in CSS**

Update `.hero-panel` in `app/globals.css`:

```css
.hero-panel {
  position: relative;
  overflow: hidden;
  min-height: 280px;
  border: 1px solid rgba(221, 212, 195, 0.9);
  border-radius: 8px;
  padding: 30px 22px;
  background:
    linear-gradient(90deg, rgba(255, 253, 248, 0.96), rgba(255, 253, 248, 0.78)),
    url("/lounge-terminal-texture.png") center / cover;
  box-shadow: var(--shadow);
}
```

- [ ] **Step 3: Add README**

Create `README.md`:

```md
# 农行境外贵宾休息室查询

一个无后端的 Next.js 静态查询站，用于把 `W020260702557021741944.xlsx` 中的农行境外贵宾休息室数据做成手机端友好的级联筛选页面。

## 本地开发

```bash
npm install
npm run convert:data
npm run make:asset
npm run dev
```

## 更新数据

替换根目录下的 `W020260702557021741944.xlsx` 后运行：

```bash
npm run convert:data
```

生成的数据位于 `data/lounges.json`。

## 验证

```bash
npm run test
npm run build
```

## Vercel 部署

将仓库导入 Vercel，框架选择 Next.js，Build Command 使用 `npm run build`。本项目不需要后端服务或数据库。
```

- [ ] **Step 4: Verify browser layout**

Run: `npm run dev`

Expected: local server prints a localhost URL.

Open desktop viewport and mobile viewport. Verify:
- Search page is the first screen.
- Select controls fit on mobile.
- Selecting `亚洲` limits country options to Asian countries.
- Selecting `日本` limits cities and airports to Japan.
- Airport select displays entries like `东京成田国际机场 · NRT` while retaining airport name as value.
- Result cards do not have overlapping text.
- Empty state appears after incompatible query text.

- [ ] **Step 5: Final verification**

Run: `npm run test`

Expected: all tests pass.

Run: `npm run build`

Expected: build succeeds.

Run: `git status --short`

Expected: only intentional generated/source files are modified or untracked.

- [ ] **Step 6: Commit final polish and docs**

Run:

```bash
git add README.md app/globals.css scripts/make-visual-asset.py public/lounge-terminal-texture.png
git commit -m "docs: add deployment and verification notes"
```

Expected: commit succeeds.

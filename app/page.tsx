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
  sanitizeFilters
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
  { key: "securityType", label: "安检类型", placeholder: "全部区域" }
];

function countActive(filters: LoungeFilters): number {
  return Object.values(filters).filter((value) => value.trim()).length;
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
          <p className="hero-copy">境外机场贵宾休息室地址索引</p>
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
            <p>
              <SlidersHorizontal size={16} aria-hidden="true" />
              筛选条件
            </p>
            <span>{activeCount ? `已选择 ${activeCount} 项` : "未选择筛选"}</span>
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
              formatOption={filter.key === "airport" ? (value) => airportLabelByName.get(value) ?? value : undefined}
              onChange={(value) => updateFilter(filter.key, value)}
            />
          ))}
        </div>
      </section>

      <section className="results-section" aria-label="查询结果">
        <div className="results-heading">
          <p>查询结果</p>
          <span>
            {results.length} / {lounges.length}
          </span>
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
            <button type="button" onClick={clearFilters}>
              清空筛选
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

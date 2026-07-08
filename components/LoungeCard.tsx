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
          <p className="city-line">
            {lounge.city} · {lounge.country}
          </p>
          <h2>{lounge.loungeName}</h2>
        </div>
        <span className="airport-code">{lounge.code || "N/A"}</span>
      </div>
      <p className="airport-name">{lounge.airport}</p>
      <div className="card-tags">
        <span>
          <Plane size={15} aria-hidden="true" />
          {valueOrFallback(lounge.terminal)}
        </span>
        <span>
          <ShieldCheck size={15} aria-hidden="true" />
          {valueOrFallback(lounge.securityType)}
        </span>
        <span>{valueOrFallback(lounge.departureType)}</span>
      </div>
      <div className="direction-line">
        <MapPin size={16} aria-hidden="true" />
        <p>{valueOrFallback(lounge.directions)}</p>
      </div>
    </article>
  );
}

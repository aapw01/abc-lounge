import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoungeCard } from "./LoungeCard";
import type { Lounge } from "../lib/lounge-types";

const lounge: Lounge = {
  id: "lhr-1",
  continent: "欧洲",
  country: "英国",
  city: "伦敦",
  airport: "伦敦希思罗机场",
  code: "LHR",
  terminal: "T2 航站楼",
  loungeName: "No1 Lounge",
  departureType: "国际出发",
  securityType: "安检后",
  directions: "T2出发大厅"
};

describe("LoungeCard", () => {
  it("displays normalized terminal spacing", () => {
    render(<LoungeCard lounge={lounge} />);

    expect(screen.getByText("T2航站楼")).toBeTruthy();
  });
});

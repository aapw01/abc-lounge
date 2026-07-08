import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

function optionTexts(select: HTMLElement): string[] {
  return within(select)
    .getAllByRole("option")
    .map((option) => option.textContent ?? "");
}

describe("Home page search experience", () => {
  it("uses a compact header summary instead of a large stats card", () => {
    render(<Home />);

    expect(screen.getByLabelText("查询摘要")).toBeTruthy();
    expect(screen.getByText("1024 间")).toBeTruthy();
    expect(screen.getByText("1024 条匹配")).toBeTruthy();
    expect(screen.queryByLabelText("数据概览")).toBeNull();
  });

  it("keeps advanced filters collapsed until the user asks for them", () => {
    render(<Home />);

    expect(screen.getAllByRole("combobox")).toHaveLength(3);
    expect(screen.getByLabelText("州")).toBeTruthy();
    expect(screen.getByLabelText("国家")).toBeTruthy();
    expect(screen.getByLabelText("城市")).toBeTruthy();
    expect(screen.queryByLabelText("机场（显示三字码）")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "更多筛选" }));

    expect(screen.getAllByRole("combobox")).toHaveLength(7);
    expect(screen.getByLabelText("机场（显示三字码）")).toBeTruthy();
  });

  it("renders the search controls and cascades country options by continent", () => {
    render(<Home />);

    expect(screen.getByPlaceholderText("搜索城市、机场、三字码、休息室名称")).toBeTruthy();

    const continent = screen.getByLabelText("州");
    fireEvent.change(continent, { target: { value: "亚洲" } });

    const country = screen.getByLabelText("国家");
    const countries = optionTexts(country);

    expect(countries).toContain("日本");
    expect(countries).toContain("泰国");
    expect(countries).not.toContain("英国");
  });

  it("shows airport options with airport name and code while using airport name as value", () => {
    render(<Home />);

    fireEvent.change(screen.getByLabelText("国家"), { target: { value: "加拿大" } });
    fireEvent.click(screen.getByRole("button", { name: "更多筛选" }));

    const airport = screen.getByLabelText("机场（显示三字码）") as HTMLSelectElement;
    const airportOptions = Array.from(airport.options);
    const pearson = airportOptions.find((option) => option.textContent?.includes("YYZ"));

    expect(pearson?.textContent).toContain("多伦多皮尔逊国际机场 · YYZ");
    expect(pearson?.value).toBe("多伦多皮尔逊国际机场");
  });

  it("searches and displays terminal names with normalized spacing", () => {
    render(<Home />);

    fireEvent.change(screen.getByPlaceholderText("搜索城市、机场、三字码、休息室名称"), {
      target: { value: "T2航站楼" }
    });

    expect(screen.getByText("No1 Lounge")).toBeTruthy();
    expect(screen.getAllByText("Plaza Premium Lounge").length).toBeGreaterThan(0);
    expect(screen.getAllByText("T2航站楼").length).toBeGreaterThan(1);
    expect(screen.queryByText("T2 航站楼")).toBeNull();
  });
});

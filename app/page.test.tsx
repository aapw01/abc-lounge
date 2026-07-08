import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

function optionTexts(select: HTMLElement): string[] {
  return within(select)
    .getAllByRole("option")
    .map((option) => option.textContent ?? "");
}

describe("Home page search experience", () => {
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

    const airport = screen.getByLabelText("机场（显示三字码）") as HTMLSelectElement;
    const airportOptions = Array.from(airport.options);
    const pearson = airportOptions.find((option) => option.textContent?.includes("YYZ"));

    expect(pearson?.textContent).toContain("多伦多皮尔逊国际机场 · YYZ");
    expect(pearson?.value).toBe("多伦多皮尔逊国际机场");
  });
});

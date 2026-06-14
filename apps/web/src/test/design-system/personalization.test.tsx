import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PersonalizationProvider, usePersonalization } from "@pumni/ui";

function Consumer() {
  const { accent, glass, setAccent, setGlass } = usePersonalization();
  return (
    <div>
      <span data-testid="accent">{accent}</span>
      <span data-testid="glass">{glass}</span>
      <button type="button" onClick={() => setAccent("violet")}>
        violet
      </button>
      <button type="button" onClick={() => setAccent("cyan")}>
        cyan
      </button>
      <button type="button" onClick={() => setGlass("strong")}>
        strong
      </button>
    </div>
  );
}

afterEach(() => {
  document.documentElement.removeAttribute("data-accent");
  document.documentElement.removeAttribute("data-glass");
  window.localStorage.clear();
});

describe("PersonalizationProvider", () => {
  it("defaults to cyan + default glass and writes no root attributes", () => {
    render(
      <PersonalizationProvider>
        <Consumer />
      </PersonalizationProvider>,
    );

    expect(screen.getByTestId("accent")).toHaveTextContent("cyan");
    expect(screen.getByTestId("glass")).toHaveTextContent("default");
    expect(document.documentElement.hasAttribute("data-accent")).toBe(false);
    expect(document.documentElement.hasAttribute("data-glass")).toBe(false);
  });

  it("reflects accent + glass changes onto the root element and storage", () => {
    render(
      <PersonalizationProvider>
        <Consumer />
      </PersonalizationProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "violet" }));
    expect(document.documentElement.getAttribute("data-accent")).toBe("violet");
    expect(window.localStorage.getItem("pumni-accent")).toBe("violet");

    fireEvent.click(screen.getByRole("button", { name: "strong" }));
    expect(document.documentElement.getAttribute("data-glass")).toBe("strong");

    // Returning to the default accent clears the attribute (base theme applies).
    fireEvent.click(screen.getByRole("button", { name: "cyan" }));
    expect(document.documentElement.hasAttribute("data-accent")).toBe(false);
  });

  it("throws when the hook is used outside the provider", () => {
    function Orphan() {
      usePersonalization();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(/within a PersonalizationProvider/);
    spy.mockRestore();
  });
});

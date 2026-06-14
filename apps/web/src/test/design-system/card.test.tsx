import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "@pumni/ui";

describe("Card", () => {
  it("renders as a div with solid variant by default", () => {
    render(
      <Card data-testid="card">
        Card Content
      </Card>
    );
    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("DIV");
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveAttribute("data-variant", "solid");
  });

  it("renders as the child element when asChild is true", () => {
    render(
      <Card asChild data-testid="card">
        <section>
          Card Content
        </section>
      </Card>
    );
    const card = screen.getByTestId("card");
    expect(card.tagName).toBe("SECTION");
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveAttribute("data-variant", "solid");
  });

  it("renders with inset variant", () => {
    render(
      <Card variant="inset" data-testid="card">
        Card Content
      </Card>
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-variant", "inset");
  });

  it("renders with glass variant", () => {
    render(
      <Card variant="glass" data-testid="card">
        Card Content
      </Card>
    );
    const card = screen.getByTestId("card");
    expect(card).toHaveAttribute("data-variant", "glass");
  });
});

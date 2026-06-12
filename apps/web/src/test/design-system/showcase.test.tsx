import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DesignSystemShowcase } from "@/app/(app)/design-system/showcase";

const toast = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast,
}));

describe("DesignSystemShowcase", () => {
  it("renders the primary QA sections from shared UI primitives", () => {
    render(React.createElement(DesignSystemShowcase));

    expect(screen.getByRole("heading", { name: "Design System" })).toBeInTheDocument();
    expect(screen.getByText("Liquid Glass")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Glass Accessibility Preview" })).toBeInTheDocument();
    expect(screen.getByText("Palette")).toBeInTheDocument();
    expect(screen.getByText("Controls")).toBeInTheDocument();
    expect(screen.getByText("Menus")).toBeInTheDocument();
    expect(screen.getByText("Feedback")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Application dock" })).toBeInTheDocument();
  });

  it("opens dialog and sends toast feedback", () => {
    render(React.createElement(DesignSystemShowcase));

    fireEvent.click(screen.getByRole("button", { name: "Success" }));
    expect(toast.success).toHaveBeenCalledWith("Success toast.");

    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("heading", { name: "Dialog Surface" })).toBeInTheDocument();
  });

  it("opens sheet and command palette surfaces", () => {
    render(React.createElement(DesignSystemShowcase));

    fireEvent.click(screen.getByRole("button", { name: /open sheet/i }));
    expect(screen.getByRole("heading", { name: "Sheet Surface" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: "Command" }));
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
  });

  it("opens dropdown and renders avatar group states", () => {
    render(React.createElement(DesignSystemShowcase));

    fireEvent.pointerDown(screen.getByRole("button", { name: /menu/i }), {
      button: 0,
      ctrlKey: false,
    });

    expect(screen.getByRole("menuitem", { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByText("PN")).toBeInTheDocument();
    expect(screen.getByText("+4")).toBeInTheDocument();
  });

  it("toggles glass accessibility preview states", () => {
    render(React.createElement(DesignSystemShowcase));

    const solidToggle = screen.getByRole("button", { name: "Solid" });
    const highToggle = screen.getByRole("button", { name: "High" });

    expect(solidToggle).toHaveAttribute("aria-pressed", "false");
    expect(highToggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(solidToggle);
    fireEvent.click(highToggle);

    expect(solidToggle).toHaveAttribute("aria-pressed", "true");
    expect(highToggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("High contrast")).toBeInTheDocument();
  });
});

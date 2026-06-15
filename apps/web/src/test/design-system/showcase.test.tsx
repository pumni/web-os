import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DesignSystemShowcase } from "@/app/(app)/design-system/showcase";
import { PersonalizationProvider } from "@pumni/ui";

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

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe("DesignSystemShowcase", () => {
  it("renders the primary QA sections from shared UI primitives", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    expect(screen.getByRole("heading", { name: "Design System" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Foundations", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Controls", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Surfaces & Layout", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Overlays & Menus", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Feedback", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Identity & Personalization", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Motion", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bento Grid (12-col)", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Card States & Spotlight", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Application dock" })).toBeInTheDocument();

    // Additional coverage for new primitives and structures
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(screen.getByText("Volume Adjustment")).toBeInTheDocument();
    expect(screen.getByText("Button Variants")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Destructive" })).toBeInTheDocument();
    expect(screen.getByText("Typography Scale")).toBeInTheDocument();
    expect(screen.getByText("JD")).toBeInTheDocument();
    expect(screen.getAllByText("JN")[0]).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More options" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Secondary" })[0]).toBeInTheDocument();
  });

  it("renders the motion window demo mounted by default", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    expect(screen.getByRole("button", { name: "Unmount Window" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Motion-tracked window" })).toBeInTheDocument();
  });

  it("renders form-control primitives with the default active tab", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    expect(screen.getByRole("switch", { name: /system updates/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /i agree to terms/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "General" })).toHaveAttribute("data-state", "active");
    expect(screen.getByRole("tab", { name: "Appearance" })).toHaveAttribute("data-state", "inactive");
  });

  it("opens the right-click context menu surface", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    fireEvent.contextMenu(screen.getByText("Right-Click Area"));

    expect(screen.getByRole("menuitem", { name: /new folder/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /clean workspace/i })).toBeInTheDocument();
  });

  it("opens dialog and sends toast feedback", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Success" }));
    expect(toast.success).toHaveBeenCalledWith("Changes saved successfully.");

    fireEvent.click(screen.getByRole("button", { name: "Trigger Dialog" }));
    expect(screen.getByRole("heading", { name: "Overlay Dialog Surface" })).toBeInTheDocument();
  });

  it("opens sheet and command palette surfaces", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /trigger sheet/i }));
    expect(screen.getByRole("heading", { name: "Overlay Side Sheet" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Command Palette" }));
    expect(screen.getByRole("dialog", { name: "Command palette" })).toBeInTheDocument();
  });

  it("opens dropdown and renders avatar group states", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: /open dropdown/i }), {
      button: 0,
      ctrlKey: false,
    });

    expect(screen.getByRole("menuitem", { name: /user settings/i })).toBeInTheDocument();
    expect(screen.getByText("PN")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("toggles APCA contrast preview states", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    const solidToggle = screen.getByRole("button", { name: "Opaque Solid" });
    const highToggle = screen.getByRole("button", { name: "High Contrast" });

    expect(solidToggle).toHaveAttribute("aria-pressed", "false");
    expect(highToggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(solidToggle);
    fireEvent.click(highToggle);

    expect(solidToggle).toHaveAttribute("aria-pressed", "true");
    expect(highToggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Contrast Boosted")).toBeInTheDocument();
  });

  it("renders fadeRise recipe demo and toggles visibility toggle", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    expect(screen.getByText("fadeRise Recipe")).toBeInTheDocument();
    expect(screen.getByText("Fade + Rise")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.getByRole("button", { name: "Show" })).toBeInTheDocument();
  });

  it("renders withViewTransition demo", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    expect(screen.getByText("View Transitions")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trigger withViewTransition" })).toBeInTheDocument();
  });

  it("renders APCA contrast calculator with pass/fail indicator", () => {
    render(
      <PersonalizationProvider>
        <DesignSystemShowcase />
      </PersonalizationProvider>
    );

    expect(screen.getByText("APCA Contrast Verification")).toBeInTheDocument();
    expect(screen.getByText("Pass — Text")).toBeInTheDocument();
  });
});

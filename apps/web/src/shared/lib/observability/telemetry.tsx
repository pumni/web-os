'use client';

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

/**
 * Vendor-neutral observability seam (ADR-0011).
 *
 * The platform skeleton emits structured signals through this interface and
 * ships a **no-op default**, so there is zero vendor lock-in and zero cost until
 * a consuming project wires a real sink (Sentry / OpenTelemetry / analytics) via
 * {@link TelemetryProvider}. Promote to a `@pumni/observability` package only
 * when a second consumer needs it, following the package-boundary rule in ADR-0031.
 */

export type TelemetryPrimitive = string | number | boolean | null | undefined;

export interface Telemetry {
  /** Record a structured product/health event. */
  event(name: string, attrs?: Record<string, TelemetryPrimitive>): void;
  /** Record a handled error with optional context. */
  error(error: unknown, context?: Record<string, TelemetryPrimitive>): void;
}

const noopTelemetry: Telemetry = {
  event: () => {},
  error: () => {},
};

const TelemetryContext = createContext<Telemetry>(noopTelemetry);

/**
 * Provides a telemetry sink to the tree. Defaults to a no-op. A consuming
 * project should pass a **stable** (module-level or memoized) implementation —
 * the value identity is used by {@link useTelemetryRef} dependents.
 */
export function TelemetryProvider({
  telemetry = noopTelemetry,
  children,
}: {
  telemetry?: Telemetry;
  children: ReactNode;
}) {
  return <TelemetryContext.Provider value={telemetry}>{children}</TelemetryContext.Provider>;
}

/** Read the current telemetry sink. */
export function useTelemetry(): Telemetry {
  return useContext(TelemetryContext);
}

/**
 * A ref that always holds the latest telemetry sink, synced in an effect so
 * long-lived effects (channel subscriptions, polling loops, reconcile timers)
 * can read `ref.current` without taking telemetry as a dependency and tearing
 * themselves down on every provider change.
 */
export function useTelemetryRef() {
  const telemetry = useTelemetry();
  const ref = useRef(telemetry);
  useEffect(() => {
    ref.current = telemetry;
  }, [telemetry]);
  return ref;
}

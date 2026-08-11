import { Suspense, lazy, useEffect, useState } from "react";
import type { FarmSceneProps } from "./FarmScene";

const FarmScene = lazy(() => import("./FarmScene"));

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function Fallback2D({ risk }: { risk: FarmSceneProps["risk"] }) {
  const tone =
    risk === "LOW"
      ? "bg-healthy/20"
      : risk === "MODERATE"
        ? "bg-warning/20"
        : risk === "HIGH"
          ? "bg-moderate/25"
          : "bg-danger/25";
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-xl bg-surface"
      role="img"
      aria-label={`Simplified 2D farm map. Current disease risk: ${risk}`}
    >
      <div className={`absolute inset-0 ${tone}`} />
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 gap-px opacity-70">
        {Array.from({ length: 48 }).map((_, i) => (
          <div key={i} className="bg-surface-2/70" />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-md bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
          2D map fallback · 3D not available on this device
        </span>
      </div>
    </div>
  );
}

export function Farm3D(props: FarmSceneProps) {
  const [state, setState] = useState<"loading" | "ok" | "fallback">("loading");

  useEffect(() => {
    setState(supportsWebGL() ? "ok" : "fallback");
  }, []);

  if (state === "fallback") return <Fallback2D risk={props.risk} />;
  if (state === "loading")
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-surface text-xs text-muted-foreground">
        Preparing 3D farm…
      </div>
    );

  return (
    <ErrorBoundary fallback={<Fallback2D risk={props.risk} />}>
      <Suspense
        fallback={
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-surface text-xs text-muted-foreground">
            Loading 3D scene…
          </div>
        }
      >
        <FarmScene {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}

import { Component, type ReactNode } from "react";

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

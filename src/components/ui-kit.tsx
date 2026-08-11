import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/types";

export function Panel({
  title,
  subtitle,
  right,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("glass rounded-2xl p-5", className)}>
      {(title || right) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-wide uppercase">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  unit,
  tone = "default",
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "default" | "healthy" | "warning" | "moderate" | "danger" | "water";
  icon?: ReactNode;
}) {
  const toneClass = {
    default: "text-foreground",
    healthy: "text-healthy",
    warning: "text-warning",
    moderate: "text-moderate",
    danger: "text-danger",
    water: "text-water",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-3">
      <div className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">
        {icon}
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-xl font-semibold", toneClass)}>
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

export function RiskPill({ level, className }: { level: RiskLevel; className?: string }) {
  const map: Record<RiskLevel, string> = {
    LOW: "bg-healthy/15 text-healthy border-healthy/40",
    MODERATE: "bg-warning/15 text-warning border-warning/40",
    HIGH: "bg-moderate/15 text-moderate border-moderate/40",
    CRITICAL: "bg-danger/15 text-danger border-danger/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-semibold",
        map[level],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current pulse-soft" />
      {level}
    </span>
  );
}

export function SourceChip({ label, value, live }: { label: string; value: string; live: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono font-semibold", live ? "text-healthy" : "text-warning")}>
        {live ? "LIVE" : "DEMO"} · {value}
      </span>
    </span>
  );
}

export function ScoreRing({
  score,
  label,
  size = 132,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const tone =
    score >= 75 ? "var(--healthy)" : score >= 50 ? "var(--warning)" : score >= 30 ? "var(--moderate)" : "var(--danger)";
  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${score} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * score) / 100}
          style={{ transition: "stroke-dashoffset 900ms ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono text-3xl font-bold" style={{ color: tone }}>
          {score}
        </div>
        <div className="text-[10px] tracking-wide text-muted-foreground uppercase">/ 100</div>
      </div>
    </div>
  );
}

export function Bar({ label, value, tone = "healthy" }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">{Math.round(value)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: `var(--${tone})` }}
        />
      </div>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/40 p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

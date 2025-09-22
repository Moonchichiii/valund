import type React from "react";
import { clsx } from "clsx";

export interface LoadSpinnerProps {
  label?: string;
  tone?: "primary" | "blue" | "green" | "warm" | "mono";
  sizeRem?: number;
  className?: string;
  fullscreen?: boolean;
}

const toneClassMap: Record<NonNullable<LoadSpinnerProps["tone"]>, string> = {
  primary: "text-accent-primary",
  blue: "text-accent-blue",
  green: "text-accent-green",
  warm: "text-accent-warm",
  mono: "text-text-primary",
};

const DEFAULT_SIZE_REM = 3;

export default function LoadSpinner({
  label = "Loading…",
  tone = "primary",
  sizeRem = DEFAULT_SIZE_REM,
  className,
  fullscreen = true,
}: LoadSpinnerProps): React.JSX.Element {

  // Calculate dimensions using CSS custom properties
  const spinnerStyle = {
    '--spinner-size': `${sizeRem}rem`,
    '--circle-size': `${Math.max(sizeRem * 0.4, 0.75)}rem`,
  } as React.CSSProperties;

  const toneClass = toneClassMap[tone] ?? toneClassMap.primary;

  return (
    <div
      aria-live="polite"
      role="status"
      data-ui-restriction="no-button"
      className={clsx(
        fullscreen
          ? "fixed inset-0 grid place-items-center bg-black/20 backdrop-blur-sm z-50"
          : "relative grid place-items-center p-8",
        className
      )}
      style={spinnerStyle}
    >
      {/* Spinner container */}
      <div className={clsx(
        "relative animate-spin",
        "w-[var(--spinner-size)] h-[var(--spinner-size)]"
      )}>
        {/* Top-left dot */}
        <span className={clsx(
          "absolute rounded-full opacity-90",
          "w-[var(--circle-size)] h-[var(--circle-size)]",
          "top-0 left-0",
          "bg-current",
          toneClass
        )} />

        {/* Top-right dot */}
        <span className={clsx(
          "absolute rounded-full opacity-90",
          "w-[var(--circle-size)] h-[var(--circle-size)]",
          "top-0 right-0",
          "bg-current",
          toneClass
        )} />

        {/* Bottom-left dot */}
        <span className={clsx(
          "absolute rounded-full opacity-90",
          "w-[var(--circle-size)] h-[var(--circle-size)]",
          "bottom-0 left-0",
          "bg-current",
          toneClass
        )} />

        {/* Bottom-right dot */}
        <span className={clsx(
          "absolute rounded-full opacity-90",
          "w-[var(--circle-size)] h-[var(--circle-size)]",
          "bottom-0 right-0",
          "bg-current",
          toneClass
        )} />
      </div>

      {/* Loading label */}
      {label && (
        <p className="mt-4 text-sm text-text-secondary select-none">
          {label}
        </p>
      )}
    </div>
  );
}

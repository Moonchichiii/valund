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

  // Calculate dimensions using inline styles for better TypeScript compatibility
  const spinnerSize = `${sizeRem.toString()}rem`;
  const circleSize = `${Math.max(sizeRem * 0.4, 0.75).toString()}rem`;

  const spinnerStyle: React.CSSProperties = {
    width: spinnerSize,
    height: spinnerSize,
  };

  const circleStyle: React.CSSProperties = {
    width: circleSize,
    height: circleSize,
  };

  const toneClass = toneClassMap[tone];

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
    >
      {/* Spinner container */}
      <div
        className="relative animate-spin"
        style={spinnerStyle}
      >
        {/* Top-left dot */}
        <span
          className={clsx(
            "absolute rounded-full opacity-90 top-0 left-0 bg-current",
            toneClass
          )}
          style={circleStyle}
        />

        {/* Top-right dot */}
        <span
          className={clsx(
            "absolute rounded-full opacity-90 top-0 right-0 bg-current",
            toneClass
          )}
          style={circleStyle}
        />

        {/* Bottom-left dot */}
        <span
          className={clsx(
            "absolute rounded-full opacity-90 bottom-0 left-0 bg-current",
            toneClass
          )}
          style={circleStyle}
        />

        {/* Bottom-right dot */}
        <span
          className={clsx(
            "absolute rounded-full opacity-90 bottom-0 right-0 bg-current",
            toneClass
          )}
          style={circleStyle}
        />
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

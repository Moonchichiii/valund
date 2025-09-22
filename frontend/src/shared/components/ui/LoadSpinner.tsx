import React from "react";
import clsx from "clsx";

export interface LoadSpinnerProps {
  label?: string;
  tone?: "primary" | "blue" | "green" | "warm" | "mono";
  sizeRem?: number;
  className?: string;
  fullscreen?: boolean;
}

const toneVarMap: Record<NonNullable<LoadSpinnerProps["tone"]>, string> = {
  primary: "--color-accent-primary",
  blue: "--color-accent-blue",
  green: "--color-accent-green",
  warm: "--color-accent-warm",
  mono: "--color-text-primary",
};

const DEFAULT_SIZE_REM = 3;

export default function LoadSpinner({
  label = "Loading…",
  tone = "primary",
  sizeRem = DEFAULT_SIZE_REM,
  className,
  fullscreen = true,
}: LoadSpinnerProps): React.JSX.Element {
  const styleVars = React.useMemo(() => {
    const dim = `${sizeRem}rem`;
    const circle = `${Math.max(sizeRem * 0.4, 0.75)}rem`;
    const colorVarName = toneVarMap[tone] ?? toneVarMap.primary;

    return {
      "--ls-dim": dim,
      "--ls-circle": circle,
      "--ls-color": `rgb(var(${colorVarName}))`,
    } as React.CSSProperties;
  }, [sizeRem, tone]);

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
      style={styleVars}
    >
      <div
        className="relative animate-spin"
        style={{
          width: "var(--ls-dim)",
          height: "var(--ls-dim)",
        }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              width: "var(--ls-circle)",
              height: "var(--ls-circle)",
              backgroundColor: "var(--ls-color, #2563eb)",
              opacity: 0.9,
              ...(i === 0
                ? { top: 0, left: 0 }
                : i === 1
                ? { top: 0, right: 0 }
                : i === 2
                ? { bottom: 0, left: 0 }
                : { bottom: 0, right: 0 }),
            }}
          />
        ))}
      </div>

      {label && (
        <p className="mt-4 text-sm text-gray-600 select-none">{label}</p>
      )}
    </div>
  );
}

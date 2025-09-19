import * as React from "react";

export type LoadSpinnerProps = {
    label?: string;
    tone?: "primary" | "blue" | "green" | "warm" | "mono";
    sizeRem?: number;
    className?: string;
    fullscreen?: boolean;
};

const toneVarMap: Record<NonNullable<LoadSpinnerProps["tone"]>, string> = {
    primary: "--color-accent-primary",
    blue: "--color-accent-blue",
    green: "--color-accent-green",
    warm: "--color-accent-warm",
    mono: "--color-text-primary",
};

function cx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

const DEFAULT_SIZE_REM = 3;

export default function LoadSpinner({
    label = "Loading…",
    tone = "primary",
    sizeRem = DEFAULT_SIZE_REM,
    className,
    fullscreen = true,
}: LoadSpinnerProps) {
    const styleVars = React.useMemo<React.CSSProperties>(() => {
        const dim = `${sizeRem}rem`;
        const circle = `${Math.max(sizeRem * 0.4, 0.75)}rem`;
        const colorVarName = toneVarMap[tone] ?? toneVarMap.primary;

        return {
            ["--ls-dim" as any]: dim,
            ["--ls-circle" as any]: circle,
            ["--ls-color" as any]: `rgb(var(${colorVarName}))`,
        } as React.CSSProperties;
    }, [sizeRem, tone]);

    return (
        <div
            aria-live="polite"
            role="status"
            data-ui-restriction="no-button"
            className={cx(
                fullscreen
                    ? "fixed inset-0 grid place-items-center bg-[rgb(var(--color-bg-secondary)/0.65)] backdrop-blur-sm"
                    : "relative grid place-items-center",
                className
            )}
            style={styleVars}
        >
            <div
                className={"relative" + " animate-[ls-rotate_2s_linear_infinite]"}
                style={{
                    width: "var(--ls-dim)",
                    height: "var(--ls-dim)",
                }}
            >
                {Array.from({ length: 4 }).map((_, i) => (
                    <span
                        key={i}
                        className="absolute rounded-full shadow-nordic-sm"
                        style={{
                            width: "var(--ls-circle)",
                            height: "var(--ls-circle)",
                            backgroundColor: "var(--ls-color)",
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
                <span className="sr-only">{label}</span>
            </div>

            {label && (
                <p className="mt-4 text-sm text-text-secondary select-none">{label}</p>
            )}

            <style>{`
                @keyframes ls-rotate {
                    0% { transform: scale(1) rotate(0deg); }
                    20%, 25% { transform: scale(1.3) rotate(90deg); }
                    45%, 50% { transform: scale(1) rotate(180deg); }
                    70%, 75% { transform: scale(1.3) rotate(270deg); }
                    95%, 100% { transform: scale(1) rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
/**
* LoadSpinner
* - Full-screen, accessible loading overlay for route transitions, page/data fetches, and form submits.
* - ❗ Not intended for use inside buttons.
* - Tailored to the Nordic palette defined in tailwind.config and src/index.css CSS variables.
*/

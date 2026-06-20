import { cn } from "@/lib/utils";

/**
 * Branded loading indicator: the RAQIP logo gently pulsing inside a
 * rotating accent ring. Used for both the initial app boot screen and
 * route-level Suspense fallbacks.
 *
 * Props:
 *   fullscreen — center on a full-height background (boot screen)
 *   label      — optional caption shown beneath the mark
 *   size       — logo size in px (default 56)
 */
export default function BrandLoader({ fullscreen = false, label, size = 56 }) {
  const ring = size + 24;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        fullscreen ? "min-h-screen w-full bg-background" : "h-full w-full",
      )}
    >
      <div className="relative grid place-items-center" style={{ height: ring, width: ring }}>
        {/* Rotating accent ring */}
        <span
          className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin"
          style={{ animationDuration: "0.9s" }}
        />
        {/* Pulsing logo mark */}
        <img
          src="/logo-icon.png"
          alt="RAQIP"
          width={size}
          height={size}
          className="brand-loader-pulse select-none"
          style={{ height: size, width: size }}
          draggable={false}
        />
      </div>
      {label && (
        <p className="text-sm text-muted-foreground animate-pulse">{label}</p>
      )}
    </div>
  );
}

import * as React from "react";
import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
};

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    const clamped = Math.min(Math.max(value, 0), 100);

    return (
      <div
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-lg border-2 border-foreground/20 bg-muted shadow-inner",
          className
        )}
        {...props}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-lg bg-primary border-r-2 border-primary/60 shadow-[0_2px_4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
        {clamped > 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {Math.round(clamped)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };


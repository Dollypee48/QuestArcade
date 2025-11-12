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
          "relative h-3 w-full overflow-hidden rounded-full bg-white/10",
          className
        )}
        {...props}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-primary transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };


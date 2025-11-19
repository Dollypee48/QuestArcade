import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-md",
  {
    variants: {
      variant: {
        default: "border-foreground/20 bg-card text-foreground shadow-[0_2px_4px_rgba(0,0,0,0.2)]",
        primary: "border-primary/40 bg-primary text-primary-foreground shadow-[0_3px_6px_rgba(0,0,0,0.3),0_0_8px_rgba(var(--primary),0.4)]",
        success: "border-green-500/50 bg-green-500 text-white shadow-[0_3px_6px_rgba(0,0,0,0.3)]",
        warning: "border-yellow-500/50 bg-yellow-500 text-white shadow-[0_3px_6px_rgba(0,0,0,0.3)]",
        accent: "border-accent/50 bg-accent text-white shadow-[0_3px_6px_rgba(0,0,0,0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}


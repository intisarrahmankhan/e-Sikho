import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-primary-600 text-white",
  secondary: "bg-slate-100 text-slate-700",
  destructive: "bg-red-50 text-red-700",
  outline: "border-slate-200 bg-white text-slate-700",
  ghost: "text-slate-600 hover:bg-slate-100",
  link: "text-primary-600 underline-offset-4 hover:underline",
}

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&>svg]:size-3",
        badgeVariants[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

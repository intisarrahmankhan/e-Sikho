import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-2 aria-invalid:ring-red-200 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700",
        outline:
          "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 aria-expanded:bg-slate-100",
        secondary:
          "bg-slate-100 text-slate-800 hover:bg-slate-200 aria-expanded:bg-slate-200",
        ghost:
          "text-slate-700 hover:bg-slate-100 aria-expanded:bg-slate-100",
        destructive:
          "bg-red-50 text-red-700 hover:bg-red-100 focus-visible:ring-red-500",
        link: "text-blue-700 underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 text-sm",
        xs: "h-7 gap-1 px-2 text-xs",
        sm: "h-8 gap-1.5 px-3 text-xs",
        lg: "h-11 gap-2 px-5 text-sm",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

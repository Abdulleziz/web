import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "~/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-zinc-950 dark:focus-visible:ring-zinc-300",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90",
        destructive:
          "bg-red-500 text-zinc-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/90",
        warning:
          "bg-yellow-500 text-zinc-50 hover:bg-yellow-500/90 dark:bg-yellow-300 dark:text-zinc-900 dark:hover:bg-yellow-300/90",
        outline:
          "border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80",
        ghost:
          "hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        link: "text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50",
        brand:
          "m-1 bg-gradient-to-r from-[#95FFFF] via-[#9C99FF] to-[#FD5DAD] bg-clip-text text-sm normal-case text-transparent hover:bg-clip-padding hover:text-black md:text-xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        "relative-sm": "h-6 sm:h-8 rounded-md px-2 sm:px-3",
        "relative-lg": "h-10 px-4 py-2 md:h-11 md:rounded-md md:px-8",
        "lg-long": "h-11 rounded-md px-32",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      type = "button",
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const loadingIconOnly = isLoading && size == "icon";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        type={type}
        {...props}
      >
        {isLoading && (
          <Loader2
            className={cn("h-4 w-4 animate-spin", !loadingIconOnly && "mr-2")}
          />
        )}
        {!loadingIconOnly && props.children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

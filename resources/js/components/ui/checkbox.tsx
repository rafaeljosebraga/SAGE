import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Base styles
        "peer size-4 shrink-0 rounded-[4px] border-2 shadow-sm transition-all duration-200 outline-none",
        // Focus styles
        "focus-visible:ring-2 focus-visible:ring-[#EF7D4C]/50 focus-visible:ring-offset-2",
        // Light theme
        "border-gray-300 bg-white hover:border-[#EF7D4C]/60",
        // Dark theme
        "dark:border-gray-600 dark:bg-gray-800 dark:hover:border-[#EF7D4C]/60",
        // Checked state - Light theme
        "data-[state=checked]:bg-[#EF7D4C] data-[state=checked]:border-[#EF7D4C] data-[state=checked]:text-white",
        // Checked state - Dark theme
        "dark:data-[state=checked]:bg-[#EF7D4C] dark:data-[state=checked]:border-[#EF7D4C] dark:data-[state=checked]:text-white",
        // Hover when checked
        "data-[state=checked]:hover:bg-[#f0875d] data-[state=checked]:hover:border-[#f0875d]",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300 dark:disabled:hover:border-gray-600",
        // Invalid state
        "aria-invalid:border-red-500 aria-invalid:ring-red-500/20",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={cn(
          "flex items-center justify-center text-current transition-all duration-200",
          // Scale animation
          "data-[state=checked]:scale-100 data-[state=unchecked]:scale-0"
        )}
      >
        <CheckIcon className="size-3 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
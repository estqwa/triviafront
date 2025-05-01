import * as React from "react"
import { cn } from "@/lib/utils"

const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative overflow-auto", className)}
      {...props}
    >
      <div className="h-full w-full">
        {children}
      </div>
    </div>
  )
})
ScrollArea.displayName = "ScrollArea"

// Убираем сложный ScrollBar для упрощения
// и используем только простой ScrollArea

export { ScrollArea }
import * as React from "react"

import { cn } from "@/lib/utils"

const Board = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "board scrollbar-custom",
      className
    )}
    {...props}
  />
))
Board.displayName = "Board"

const BoardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between mb-6", className)}
    {...props}
  />
))
BoardHeader.displayName = "BoardHeader"

const BoardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-2xl font-bold text-ink-strong",
      className
    )}
    {...props}
  />
))
BoardTitle.displayName = "BoardTitle"

export { Board, BoardHeader, BoardTitle }


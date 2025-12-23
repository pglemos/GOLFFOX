import * as React from "react"

import { cn } from "@/lib/utils"

interface MapShellProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string
}

const MapShell = React.forwardRef<HTMLDivElement, MapShellProps>(
  ({ className, height = "calc(100vh - 300px)", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("map-shell", className)}
        style={{ height }}
        {...props}
      >
        {children}
      </div>
    )
  }
)
MapShell.displayName = "MapShell"

export { MapShell }


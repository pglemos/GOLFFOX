"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center justify-start rounded-[var(--radius-lg)] bg-[var(--bg-soft)] p-1.5 text-[var(--ink-muted)]",
      "w-full max-w-full overflow-x-auto gap-1 sm:gap-2",
      "-mx-1 px-1 sm:mx-0 sm:px-1",
      "scroll-smooth",
      "border border-[var(--border)]",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const [isActive, setIsActive] = React.useState(false)
  
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      onMouseEnter={() => !isActive && setIsActive(false)}
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-opacity-20",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-[var(--brand)] data-[state=active]:bg-white dark:data-[state=active]:bg-[var(--bg-elevated)]",
        "data-[state=active]:shadow-md",
        "hover:text-[var(--ink-strong)] hover:bg-[var(--bg-hover)]",
        "min-w-[120px] sm:min-w-[0] flex-shrink-0",
        "group",
        className
      )}
      {...props}
    >
      <span className="relative z-10">{props.children}</span>
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-lg bg-white dark:bg-[var(--bg-elevated)] shadow-md"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
      )}
    </TabsPrimitive.Trigger>
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] focus-visible:ring-opacity-20",
      "animate-fade-in-up",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

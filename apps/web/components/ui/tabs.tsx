"use client"

import * as React from "react"

import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-auto items-center justify-start gap-2 p-2",
      "w-full rounded-2xl bg-white/30 backdrop-blur-xl border-2 border-white/40",
      "shadow-xl shadow-black/10",
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
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap px-6 py-3 text-sm sm:text-base font-semibold rounded-xl",
        "transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "text-gray-800 hover:text-gray-900 hover:bg-white/25 hover:shadow-lg",
        "data-[state=active]:text-gray-950 data-[state=active]:bg-white/40 data-[state=active]:shadow-xl data-[state=active]:border-2 data-[state=active]:border-white/50 data-[state=active]:scale-[1.03]",
        "min-h-[48px] sm:min-h-[56px] touch-manipulation flex-1",
        className
      )}
      {...props}
    />
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
      "mt-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2",
      "rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-8",
      "shadow-lg shadow-black/5",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }


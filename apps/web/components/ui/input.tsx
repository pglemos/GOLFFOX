import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    React.useEffect(() => {
      if (props.value !== undefined) {
        setHasValue(String(props.value).length > 0)
      }
    }, [props.value])

    return (
      <div className="relative">
        <motion.input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-[var(--radius-lg)] border-2 px-4 py-3 text-sm",
            "bg-gradient-to-br from-[var(--bg-soft)] to-[var(--bg)] transition-all duration-300",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-[var(--ink-muted)] placeholder:font-normal",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            // Border states
            error
              ? "border-[var(--error)] focus-visible:ring-[var(--error)] focus-visible:ring-opacity-30 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
              : success
              ? "border-[var(--success)] focus-visible:ring-[var(--success)] focus-visible:ring-opacity-30 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]"
              : isFocused
              ? "border-[var(--brand)] focus-visible:ring-[var(--brand)] focus-visible:ring-opacity-30 shadow-[var(--shadow-brand)]"
              : "border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]",
            // Shadow on focus
            isFocused && "shadow-[var(--shadow-brand)] backdrop-blur-sm",
            className
          )}
          ref={ref}
          onFocus={(e) => {
            setIsFocused(true)
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            setIsFocused(false)
            props.onBlur?.(e)
          }}
          whileFocus={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          {...props}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-5 left-0 text-xs text-[var(--error)] mt-1"
          >
            Campo inválido
          </motion.div>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

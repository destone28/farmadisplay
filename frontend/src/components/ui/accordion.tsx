import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionItemProps {
  value: string
  children: React.ReactNode
}

interface AccordionTriggerProps {
  children: React.ReactNode
  className?: string
}

interface AccordionContentProps {
  children: React.ReactNode
  className?: string
}

interface AccordionContextValue {
  value: string
  onToggle: (value: string) => void
  expandedItems: Set<string>
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

interface AccordionProps {
  type?: "single" | "multiple"
  defaultValue?: string | string[]
  children: React.ReactNode
  className?: string
}

export function Accordion({ type = "multiple", defaultValue = [], children, className }: AccordionProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(() => {
    if (Array.isArray(defaultValue)) {
      return new Set(defaultValue)
    }
    return new Set(defaultValue ? [defaultValue] : [])
  })

  const onToggle = (value: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(value)) {
        next.delete(value)
      } else {
        if (type === "single") {
          next.clear()
        }
        next.add(value)
      }
      return next
    })
  }

  return (
    <AccordionContext.Provider value={{ value: "", onToggle, expandedItems }}>
      <div className={className}>{children}</div>
    </AccordionContext.Provider>
  )
}

export function AccordionItem({ value, children }: AccordionItemProps) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionItem must be used within Accordion")

  const isExpanded = context.expandedItems.has(value)

  return (
    <div className="border-b">
      <AccordionContext.Provider value={{ ...context, value }}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, { isExpanded })
          }
          return child
        })}
      </AccordionContext.Provider>
    </div>
  )
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps & { isExpanded?: boolean }) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionTrigger must be used within AccordionItem")

  const isExpanded = context.expandedItems.has(context.value)

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between py-4 font-medium transition-all hover:underline",
        className
      )}
      onClick={() => context.onToggle(context.value)}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isExpanded && "rotate-180"
        )}
      />
    </button>
  )
}

export function AccordionContent({ children, className }: AccordionContentProps & { isExpanded?: boolean }) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionContent must be used within AccordionItem")

  const isExpanded = context.expandedItems.has(context.value)

  return (
    <div
      className={cn(
        "overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        isExpanded ? "animate-accordion-down" : "animate-accordion-up"
      )}
      data-state={isExpanded ? "open" : "closed"}
      style={{
        maxHeight: isExpanded ? "500px" : "0",
        opacity: isExpanded ? 1 : 0,
      }}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
    </div>
  )
}

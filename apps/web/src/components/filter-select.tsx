import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { cn } from '#/lib/utils'

interface FilterSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: ReadonlyArray<{ value: string; label: string }>
  'aria-label': string
  testid?: string
  className?: string
}

/** Compact single-value dropdown in the design language; for short static
 *  option lists. Long/searchable lists use SearchSelect instead. */
export function FilterSelect({
  value,
  onValueChange,
  options,
  'aria-label': ariaLabel,
  testid,
  className,
}: FilterSelectProps) {
  return (
    <Select
      items={options}
      value={value}
      onValueChange={(v: string | null) => {
        if (v != null) onValueChange(v)
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        data-testid={testid}
        className={cn('gap-1 bg-panel2 px-2 text-xs dark:bg-panel2 dark:hover:bg-hover', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

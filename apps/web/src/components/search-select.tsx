import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '#/components/ui/combobox'
import { cn } from '#/lib/utils'

type Option = { value: string; label: string }

interface SearchSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: ReadonlyArray<Option>
  'aria-label': string
  /** Trigger text when no option matches `value`. */
  placeholder?: string
  searchPlaceholder?: string
  testid?: string
  className?: string
}

/** Select-look trigger that opens a searchable option list (Base UI Combobox);
 *  for long lists — models, orgs — where scanning a plain dropdown fails. */
export function SearchSelect({
  value,
  onValueChange,
  options,
  'aria-label': ariaLabel,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  testid,
  className,
}: SearchSelectProps) {
  const selected = options.find((o) => o.value === value) ?? null
  return (
    <Combobox
      items={options}
      value={selected}
      onValueChange={(item: Option | null) => onValueChange(item ? item.value : '')}
      isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
      autoHighlight
    >
      <ComboboxTrigger
        size="sm"
        aria-label={ariaLabel}
        data-testid={testid}
        className={cn('gap-1 bg-panel2 px-2 text-xs dark:bg-panel2 dark:hover:bg-hover', className)}
      >
        <ComboboxValue placeholder={placeholder} />
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          aria-label={`${ariaLabel} — search`}
          placeholder={searchPlaceholder}
          className="text-xs"
        />
        <ComboboxEmpty className="text-xs">No matches.</ComboboxEmpty>
        <ComboboxList>
          {(item: Option) => (
            <ComboboxItem key={item.value} value={item} className="text-xs">
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

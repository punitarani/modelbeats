import { rankByScore, textMatchScore } from '@modelbeats/shared'
import { useMemo, useState } from 'react'
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

/**
 * Default relevance ranking for SearchSelect lists: every query token must hit the
 * option label (exact > prefix > word-boundary > substring); score ties keep the
 * options' given order so curated ordering (e.g. 'All orgs' first) survives.
 */
function labelRanker(options: ReadonlyArray<Option>, q: string): Option[] {
  return rankByScore(options, (o) => textMatchScore(o.label.toLowerCase(), q))
}

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
  /**
   * Optional relevance ranker: reorder/filter the option list for the typed query
   * (normalized lowercase). Defaults to label matching — pass a model-aware ranker
   * (e.g. `modelOptionRanker`) so pickers order by recency + Elo too.
   */
  rankOptions?: (options: ReadonlyArray<Option>, query: string) => Option[]
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
  rankOptions = labelRanker,
}: SearchSelectProps) {
  const [inputValue, setInputValue] = useState('')
  const selected = options.find((o) => o.value === value) ?? null
  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase()
    return q ? rankOptions(options, q) : [...options]
  }, [options, inputValue, rankOptions])
  return (
    <Combobox
      items={options}
      filteredItems={filtered}
      inputValue={inputValue}
      onInputValueChange={(v: string) => setInputValue(v)}
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

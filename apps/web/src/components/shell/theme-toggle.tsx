import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { getTheme, toggleTheme } from '#/lib/theme'
import { cn } from '#/lib/utils'

// Theme as an external store: identical 'dark' on server + first client render, real value after
// subscription — no hydration mismatch, no flash (the class is set pre-paint). The store lives here
// so the desktop topbar toggle and the mobile sidebar-footer toggle stay in sync off one source.
let themeListeners: (() => void)[] = []
const subscribeTheme = (cb: () => void) => {
  themeListeners.push(cb)
  return () => {
    themeListeners = themeListeners.filter((l) => l !== cb)
  }
}

/**
 * Light/dark toggle. `variant="pill"` is the bordered topbar control (desktop); `variant="nav"`
 * renders a full-width row that matches the sidebar's nav items (used in the mobile drawer footer).
 */
export function ThemeToggle({
  variant = 'pill',
  className,
  testId,
}: {
  variant?: 'pill' | 'nav'
  className?: string
  testId?: string
}) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'dark' as const)

  return (
    <button
      type="button"
      onClick={() => {
        toggleTheme()
        for (const l of themeListeners) l()
      }}
      className={cn(
        'cursor-pointer items-center gap-1 whitespace-nowrap text-mut hover:text-text',
        variant === 'nav'
          ? 'flex w-full gap-2 rounded-md px-2.5 py-[7px] text-[13px] hover:bg-hover'
          : 'inline-flex rounded-[7px] border border-border bg-panel2 px-[11px] py-1.5 text-[11.5px] hover:border-border2',
        className,
      )}
      data-testid={testId}
    >
      {theme === 'dark' ? (
        <>
          <Moon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} /> Light
        </>
      ) : (
        <>
          <Sun aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.75} /> Dark
        </>
      )}
    </button>
  )
}

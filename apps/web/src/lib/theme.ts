export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'modelbeats.theme'

/**
 * Pre-hydration theme script (D12): runs inline in <head> before first paint. Dark is
 * the default preference (design parity); the class flip is purely client-side so SSR
 * HTML stays identical for every user (edge-cacheable, no cookies).
 */
export const THEME_INIT_SCRIPT = `(()=>{try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.classList.toggle('dark',t!=='light')}catch(e){document.documentElement.classList.add('dark')}})()`

export function getTheme(): Theme {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function setTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // private-mode storage failures are non-fatal
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

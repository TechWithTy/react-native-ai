import { createContext, useContext } from 'react'

export type CLThemeTokens = {
  background: string
  card: string
  border: string
  text: {
    primary: string
    secondary: string
    muted: string
    accent: string
    inverse: string
  }
  status: {
    success: string
    warning: string
    danger: string
    info: string
  }
  accent: string
  cardShadow: string
}

const LIGHT_THEME_NAMES = new Set(['light', 'hackerNews'])

const ACCENT_BY_THEME: Record<string, string> = {
  light: '#0281ff',
  dark: '#0281ff',
  hackerNews: '#ed702d',
  miami: '#f7b5cd',
  vercel: '#f8fafc',
  cyberpunk: '#00f0ff',
  matrix: '#00ff41',
}

function getRuntimeThemeName() {
  const globalTheme = (globalThis as any).__RNAI_THEME_NAME
  if (typeof globalTheme === 'string' && globalTheme.trim().length > 0) return globalTheme
  return 'dark'
}

export function resolveCLTheme(themeNameInput?: string): CLThemeTokens {
  const themeName = (themeNameInput || getRuntimeThemeName()).trim()
  const isLight = LIGHT_THEME_NAMES.has(themeName)
  const accent = ACCENT_BY_THEME[themeName] || '#0d6cf2'

  if (isLight) {
    return {
      background: '#f5f7f8',
      card: '#ffffff',
      border: '#dbe3ee',
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        muted: '#64748b',
        accent,
        inverse: '#ffffff',
      },
      status: {
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626',
        info: '#2563eb',
      },
      accent,
      cardShadow: 'rgba(15, 23, 42, 0.12)',
    }
  }

  return {
    background: '#101722',
    card: '#18212f',
    border: '#243244',
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
      accent,
      inverse: '#0f172a',
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#3b82f6',
    },
    accent,
    cardShadow: 'rgba(0, 0, 0, 0.3)',
  }
}

/**
 * CLTheme is a **Proxy** that lazily resolves theme tokens at access time.
 * 
 * Every property access (e.g. `CLTheme.text.primary`) reads the current
 * runtime theme name from `globalThis.__RNAI_THEME_NAME`, so even static
 * `StyleSheet.create(...)` blocks produce correct colours — **provided**
 * the stylesheet is created *after* the theme name has been set.
 *
 * For components that need fully reactive styles (created at render time),
 * use the `useCLTheme()` hook instead.
 */
function createLazyCLTheme(): CLThemeTokens {
  const handler: ProxyHandler<CLThemeTokens> = {
    get(_target, prop, receiver) {
      // Resolve a fresh theme each time a top-level key is accessed
      const resolved = resolveCLTheme()
      const value = (resolved as any)[prop]
      // If the value is an object (e.g. `text`, `status`), also wrap it
      if (value && typeof value === 'object') {
        return new Proxy(value, {
          get(innerTarget, innerProp) {
            // Re-resolve to ensure absolute freshness
            const freshResolved = resolveCLTheme()
            return (freshResolved as any)[prop]?.[innerProp]
          },
        })
      }
      return value
    },
  }
  return new Proxy({} as CLThemeTokens, handler)
}

export const CLTheme: CLThemeTokens = createLazyCLTheme()

// ── React hook – use this in components for reactive light/dark support ──

/**
 * Returns a CLThemeTokens object that responds to the current app theme.
 * This causes a re-render whenever the React context's theme changes.
 *
 * Prefer this over the raw `CLTheme` import when your component
 * creates styles at render time or needs inline colour values.
 */
let _ThemeContext: React.Context<any> | null = null
const FALLBACK_THEME_CONTEXT = createContext<any>(null)

export function _injectThemeContext(ctx: React.Context<any>) {
  _ThemeContext = ctx
}

export function useCLTheme(): CLThemeTokens {
  const ctx = useContext(_ThemeContext ?? FALLBACK_THEME_CONTEXT)
  const themeName: string = ctx?.themeName || ctx?.theme?.label || 'dark'
  return resolveCLTheme(themeName)
}

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

export const CLTheme = resolveCLTheme()

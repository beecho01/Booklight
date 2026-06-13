import { Theme, webDarkTheme, webLightTheme } from '@fluentui/react-components'
import { invoke } from '@tauri-apps/api/core'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

// Booklight theme overrides — WinUI 3-style Mica layering
// In WinUI 3, elevated surfaces (cards, sidebars) are LIGHTER than the base in dark mode
// and slightly darker in light mode. This matches the CardBackgroundFillColorDefault pattern.
export const booklightTheme: Theme = {
    ...webLightTheme,
    colorBrandForeground1: '#0E7A6E',
    colorBrandForeground2: '#0F9B8C',
    colorBrandBackground: '#0E7A6E',
    colorBrandStroke1: '#0E7A6E',
    colorPaletteGreenBackground1: '#0E7A6E',
    colorPaletteGreenForeground1: '#0E7A6E',
    // Mica-compatible semi-transparent backgrounds
    colorNeutralBackground1: 'transparent',
    colorNeutralBackground2: 'rgba(245, 245, 245, 0.70)', // Sidebar
    colorNeutralBackground3: 'rgba(235, 235, 235, 0.70)', // Toolbar
    colorNeutralBackgroundAlpha: 'rgba(255, 255, 255, 0.85)', // Frosted glass (now-playing bar)
    colorNeutralCardBackground: 'rgba(255, 255, 255, 0.70)', // Cards — matching WinUI 3 CardBackgroundFillColorDefault
    colorNeutralCardBackgroundHover: 'rgba(255, 255, 255, 0.80)',
    colorNeutralCardBackgroundPressed: 'rgba(255, 255, 255, 0.50)',
    colorNeutralCardBackgroundSelected: 'rgba(245, 245, 245, 0.70)',
    // Solid opaque backgrounds for popup surfaces (dialogs, menus, dropdowns, tooltips)
    colorNeutralBackground8: '#ffffff',
    colorNeutralBackgroundStatic: '#fafafa',
}

export const booklightDarkTheme: Theme = {
    ...webDarkTheme,
    colorBrandForeground1: '#4FD1C5',
    colorBrandForeground2: '#6EE7D8',
    colorBrandBackground: '#0E7A6E',
    colorBrandStroke1: '#4FD1C5',
    // ── WinUI 3-style Mica layering ──────────────────────────────────────────
    // In WinUI 3 dark mode, elevated surfaces are LIGHTER than the base.
    // The base layer (window background) is transparent to show Mica through.
    // Cards, sidebars, and interactive elements use semi-transparent white overlays
    // matching the CardBackgroundFillColorDefault / SubtleFillColor* pattern.
    //
    // Background hierarchy (lighter = more elevated):
    //   Background5 > Background4 > Background3 > Background2 > Background1 (transparent)
    //   CardBackground is the lightest (most elevated surface)
    //
    // Neutral backgrounds — Mica-compatible semi-transparent white overlays
    colorNeutralBackground1: 'transparent',
    colorNeutralBackground1Hover: 'rgba(255, 255, 255, 0.06)',
    colorNeutralBackground1Pressed: 'rgba(255, 255, 255, 0.03)',
    colorNeutralBackground1Selected: 'rgba(255, 255, 255, 0.05)',
    colorNeutralBackground2: 'rgba(255, 255, 255, 0.035)', // Sidebar
    colorNeutralBackground2Hover: 'rgba(255, 255, 255, 0.065)',
    colorNeutralBackground2Pressed: 'rgba(255, 255, 255, 0.04)',
    colorNeutralBackground2Selected: 'rgba(255, 255, 255, 0.055)',
    colorNeutralBackground3: 'rgba(255, 255, 255, 0.059)', // Toolbar, search results
    colorNeutralBackground3Hover: 'rgba(255, 255, 255, 0.08)',
    colorNeutralBackground3Pressed: 'rgba(255, 255, 255, 0.045)',
    colorNeutralBackground3Selected: 'rgba(255, 255, 255, 0.065)',
    colorNeutralBackground4: 'rgba(255, 255, 255, 0.018)', // Nav item, chapter hover
    colorNeutralBackground4Hover: 'rgba(255, 255, 255, 0.05)',
    colorNeutralBackground4Pressed: 'rgba(255, 255, 255, 0.03)',
    colorNeutralBackground4Selected: 'rgba(255, 255, 255, 0.04)',
    colorNeutralBackground5: 'rgba(255, 255, 255, 0.012)', // Deepest layer
    colorNeutralBackground6: 'rgba(255, 255, 255, 0.008)', // Deepest layer (rarely used)
    colorNeutralBackgroundAlpha: 'rgba(30, 30, 30, 0.85)', // Frosted glass (now-playing bar)
    // Card backgrounds — most elevated surface, lightest tinge
    colorNeutralCardBackground: 'rgba(255, 255, 255, 0.070)',
    colorNeutralCardBackgroundHover: 'rgba(255, 255, 255, 0.082)',
    colorNeutralCardBackgroundPressed: 'rgba(255, 255, 255, 0.047)',
    colorNeutralCardBackgroundSelected: 'rgba(255, 255, 255, 0.059)',
    // Subtle backgrounds — Nav items, buttons, interactive elements
    // WinUI 3 SubtleFillColor* pattern: semi-transparent white overlays
    colorSubtleBackground: 'transparent',
    colorSubtleBackgroundHover: 'rgba(255, 255, 255, 0.06)', // SubtleFillColorSecondary
    colorSubtleBackgroundPressed: 'rgba(255, 255, 255, 0.04)', // SubtleFillColorTertiary
    colorSubtleBackgroundSelected: 'rgba(255, 255, 255, 0.05)', // SubtleFillColorTertiary
    // Subtle backgrounds with alpha (for hover on transparent surfaces)
    colorSubtleBackgroundLightAlphaHover: 'rgba(255, 255, 255, 0.04)',
    colorSubtleBackgroundLightAlphaPressed: 'rgba(255, 255, 255, 0.02)',
    colorSubtleBackgroundLightAlphaSelected: 'rgba(255, 255, 255, 0.03)',
    // Solid opaque backgrounds for popup surfaces (dialogs, menus, dropdowns, tooltips)
    colorNeutralBackground8: '#292929',
    colorNeutralBackgroundStatic: '#1f1f1f',
}

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
    mode: ThemeMode
    theme: Theme
    isDark: boolean
    setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

/** Parse a hex color string (#RRGGBB) into RGB components */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
        ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
          }
        : { r: 14, g: 122, b: 110 } // fallback teal
}

/** Lighten a hex color by mixing with white */
function lightenColor(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex)
    const nr = Math.round(r + (255 - r) * amount)
    const ng = Math.round(g + (255 - g) * amount)
    const nb = Math.round(b + (255 - b) * amount)
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
}

/** Build a theme with the given accent color applied */
function buildTheme(baseTheme: Theme, accent: string, isDark: boolean): Theme {
    const accentLight = lightenColor(accent, 0.15)
    return {
        ...baseTheme,
        colorBrandForeground1: isDark ? accentLight : accent,
        colorBrandForeground2: isDark ? lightenColor(accent, 0.3) : accentLight,
        colorBrandBackground: accent,
        colorBrandStroke1: isDark ? accentLight : accent,
        colorPaletteGreenBackground1: accent,
        colorPaletteGreenForeground1: isDark ? accentLight : accent,
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<ThemeMode>(
        () => (localStorage.getItem('booklight_theme') as ThemeMode) || 'system'
    )
    const [accentColor, setAccentColor] = useState<string | null>(null)

    const getSystemDark = useCallback(
        () => window.matchMedia('(prefers-color-scheme: dark)').matches,
        []
    )

    const isDark = mode === 'dark' || (mode === 'system' && getSystemDark())

    // Fetch system accent color on mount
    useEffect(() => {
        invoke<string>('get_system_accent_color')
            .then((color) => {
                setAccentColor(color)
            })
            .catch(() => {
                // Fallback to default teal accent
                setAccentColor(null)
            })
    }, [])

    // Sync Mica effect with theme (MicaDark / MicaLight)
    useEffect(() => {
        invoke('set_mica_effect', { isDark }).catch(() => {
            // Non-Windows or unsupported — ignore
        })
    }, [isDark])

    const theme = useMemo(() => {
        const baseTheme = isDark ? booklightDarkTheme : booklightTheme
        if (accentColor) {
            return buildTheme(baseTheme, accentColor, isDark)
        }
        return baseTheme
    }, [isDark, accentColor])

    const handleSetMode = useCallback((newMode: ThemeMode) => {
        setMode(newMode)
        localStorage.setItem('booklight_theme', newMode)
    }, [])

    useEffect(() => {
        if (mode !== 'system') return undefined
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = () => setMode('system') // trigger re-render
        mediaQuery.addEventListener('change', handler)
        return () => {
            mediaQuery.removeEventListener('change', handler)
        }
    }, [mode])

    const contextValue = useMemo(
        () => ({ mode, theme, isDark, setMode: handleSetMode }),
        [mode, theme, isDark, handleSetMode]
    )

    return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

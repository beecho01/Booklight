import type { Theme } from '@fluentui/react-components'
import { invoke } from '@tauri-apps/api/core'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { booklightDarkTheme, booklightTheme } from './PlaybackContext'

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

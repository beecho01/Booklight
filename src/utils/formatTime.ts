/**
 * Format seconds to mm:ss or h:mm:ss
 */
export function formatTime(seconds: number): string {
    if (!seconds || !Number.isFinite(seconds)) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Format total duration in seconds to a human-readable string like "8h 42m"
 */
export function formatDuration(seconds: number): string {
    if (!seconds || !Number.isFinite(seconds)) return '0m'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0 && m > 0) return `${h}h ${m}m`
    if (h > 0) return `${h}h`
    return `${m}m`
}

/**
 * Format a progress value (0-1) as a percentage string
 */
export function formatProgress(progress: number): string {
    if (!progress || !Number.isFinite(progress)) return '0%'
    return `${Math.round(progress * 100)}%`
}

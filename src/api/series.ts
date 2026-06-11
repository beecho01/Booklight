import { invoke } from '@tauri-apps/api/core'
import type { Series } from '../types/series'

export default async function getSeriesById(
    serverUrl: string,
    token: string,
    seriesId: string
): Promise<Series> {
    return invoke('get_series_by_id', { serverUrl, token, seriesId })
}

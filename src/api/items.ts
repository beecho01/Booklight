import { invoke } from '@tauri-apps/api/core'
import type { LibraryItemExpanded } from '../types/audiobook'
import type { PlaybackSession } from '../types/session'

export async function getItem(
    serverUrl: string,
    token: string,
    itemId: string
): Promise<LibraryItemExpanded> {
    return invoke('get_item', { serverUrl, token, itemId })
}

export function getItemCoverUrl(serverUrl: string, itemId: string): string {
    return `${serverUrl}/api/items/${itemId}/cover`
}

export async function startPlayback(
    serverUrl: string,
    token: string,
    itemId: string,
    episodeId?: string
): Promise<PlaybackSession> {
    return invoke('start_playback', { serverUrl, token, itemId, episodeId: episodeId || null })
}

export async function updateItemMedia(
    serverUrl: string,
    token: string,
    itemId: string,
    metadata: Record<string, unknown>
): Promise<void> {
    return invoke('update_item_media', { serverUrl, token, itemId, metadata })
}

export async function matchItem(
    serverUrl: string,
    token: string,
    itemId: string,
    provider: string,
    query?: string
): Promise<unknown> {
    return invoke('match_item', { serverUrl, token, itemId, provider, query: query || null })
}

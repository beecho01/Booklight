import { invoke } from '@tauri-apps/api/core'
import type { MediaProgress } from '../types/audiobook'
import type { ListeningSession, ListeningStats } from '../types/stats'
import type { User } from '../types/user'

export async function getCurrentUser(serverUrl: string, token: string): Promise<User> {
    return invoke('get_current_user', { serverUrl, token })
}

export async function getProgress(
    serverUrl: string,
    token: string,
    libraryItemId: string,
    episodeId?: string
): Promise<MediaProgress | null> {
    return invoke('get_media_progress', {
        serverUrl,
        token,
        libraryItemId,
        episodeId: episodeId || null,
    })
}

export async function updateProgress(
    serverUrl: string,
    token: string,
    libraryItemId: string,
    currentTime: number,
    duration?: number,
    isFinished?: boolean,
    episodeId?: string
): Promise<void> {
    return invoke('update_progress', {
        serverUrl,
        token,
        libraryItemId,
        currentTime,
        duration: duration || 0,
        isFinished: isFinished || false,
        episodeId: episodeId || null,
    })
}

export async function getItemsInProgress(serverUrl: string, token: string): Promise<unknown[]> {
    return invoke('get_items_in_progress', { serverUrl, token })
}

export async function getListeningSessions(
    serverUrl: string,
    token: string
): Promise<ListeningSession[]> {
    return invoke('get_listening_sessions', { serverUrl, token })
}

export async function getListeningStats(serverUrl: string, token: string): Promise<ListeningStats> {
    return invoke('get_listening_stats', { serverUrl, token })
}

export async function createBookmark(
    serverUrl: string,
    token: string,
    libraryItemId: string,
    time: number,
    title: string
): Promise<void> {
    return invoke('create_bookmark', { serverUrl, token, libraryItemId, time, title })
}

export async function deleteBookmark(
    serverUrl: string,
    token: string,
    libraryItemId: string,
    time: number
): Promise<void> {
    return invoke('delete_bookmark', { serverUrl, token, libraryItemId, time })
}

import { invoke } from '@tauri-apps/api/core'
import type { PlaybackSession } from '../types/session'

export async function syncLocalSession(
    serverUrl: string,
    token: string,
    session: unknown
): Promise<PlaybackSession> {
    return invoke('sync_local_session', { serverUrl, token, session })
}

export async function syncSession(
    serverUrl: string,
    token: string,
    sessionId: string,
    currentTime: number,
    duration: number
): Promise<void> {
    return invoke('sync_session', { serverUrl, token, sessionId, currentTime, duration })
}

export async function closeSession(
    serverUrl: string,
    token: string,
    sessionId: string,
    currentTime: number,
    duration: number
): Promise<void> {
    return invoke('close_session', { serverUrl, token, sessionId, currentTime, duration })
}

export async function getOpenSessions(
    serverUrl: string,
    token: string
): Promise<PlaybackSession[]> {
    return invoke('get_open_sessions', { serverUrl, token })
}

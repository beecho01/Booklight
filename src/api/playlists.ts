import { invoke } from '@tauri-apps/api/core'
import type { Playlist, PlaylistItem } from '../types/collection'

export async function getPlaylists(serverUrl: string, token: string): Promise<Playlist[]> {
    return invoke('get_playlists', { serverUrl, token })
}

export async function getPlaylist(
    serverUrl: string,
    token: string,
    playlistId: string
): Promise<Playlist> {
    return invoke('get_playlist', { serverUrl, token, playlistId })
}

export async function createPlaylist(
    serverUrl: string,
    token: string,
    libraryId: string,
    name: string,
    items: PlaylistItem[],
    description?: string
): Promise<Playlist> {
    return invoke('create_playlist', {
        serverUrl,
        token,
        libraryId,
        name,
        items,
        description: description || null,
    })
}

export async function deletePlaylist(
    serverUrl: string,
    token: string,
    playlistId: string
): Promise<void> {
    return invoke('delete_playlist', { serverUrl, token, playlistId })
}

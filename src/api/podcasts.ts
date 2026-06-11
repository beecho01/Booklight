import { invoke } from '@tauri-apps/api/core'

export async function checkPodcastNewEpisodes(
    serverUrl: string,
    token: string,
    podcastId: string
): Promise<unknown> {
    return invoke('check_podcast_new_episodes', { serverUrl, token, podcastId })
}

export async function downloadPodcastEpisodes(
    serverUrl: string,
    token: string,
    podcastId: string,
    episodes: Record<string, unknown>[]
): Promise<void> {
    return invoke('download_podcast_episodes', { serverUrl, token, podcastId, episodes })
}
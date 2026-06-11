export interface PodcastEpisode {
    id: string
    libraryItemId?: string | null
    podcastId?: string | null
    title: string
    subtitle?: string | null
    description?: string | null
    pubDate?: string | null
    duration?: number | null
    episode?: string | null
    season?: string | null
    audioFile?: Record<string, unknown> | null
}

export interface PodcastEpisodeDownload {
    id: string
    podcastEpisode: PodcastEpisode
    isDownloading: boolean
    finishedAt?: number | null
}

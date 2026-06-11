export interface AudioTrack {
    index: number
    startOffset: number
    duration: number
    title?: string
    contentUrl?: string
    mimeType?: string
    metadata?: Record<string, unknown>
}

export interface PlaybackSession {
    id: string
    userId: string
    libraryItemId: string
    episodeId?: string | null
    mediaType: string
    mediaPlayer: string
    duration: number
    playMethod: number
    startedAt: number
    updatedAt: number
    currentTime: number
    coverPath?: string | null
    displayTitle: string
    displayAuthor?: string | null
    audioTracks: AudioTrack[]
}

export interface SyncLocalSessionRequest {
    session: {
        id: string
        libraryItemId: string
        episodeId?: string | null
        duration: number
        currentTime: number
        isFinished: boolean
        startedAt: number
        updatedAt: number
        mediaType: string
        mediaPlayer: string
        playMethod: number
    }
}

export interface SyncSessionRequest {
    currentTime: number
    duration: number
}

export interface CloseSessionRequest {
    currentTime: number
    duration: number
    mediaProgress?: {
        isFinished?: boolean
    }
}

export interface StartPlaybackRequest {
    mediaPlayer: string
    forceDirectPlay?: boolean
}

export interface StartPlaybackResponse {
    id: string
    userId: string
    libraryItemId: string
    episodeId?: string | null
    mediaType: string
    mediaPlayer: string
    duration: number
    playMethod: number
    startedAt: number
    updatedAt: number
    currentTime: number
    coverPath?: string | null
    displayTitle: string
    displayAuthor?: string | null
}

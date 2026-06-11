export interface Collection {
    id: string
    libraryId: string
    name: string
    description?: string | null
    coverAspectRatio?: number | null
    books: string[]
    lastUpdate?: number | null
    createdAt?: number | null
}

export interface Playlist {
    id: string
    libraryId: string
    userId?: string | null
    name: string
    description?: string | null
    items: PlaylistItem[]
    lastUpdate?: number | null
    createdAt?: number | null
}

export interface PlaylistItem {
    libraryItemId: string
    episodeId?: string | null
    title?: string | null
}

export interface Series {
    id: string
    name: string
    description?: string | null
    coverPath?: string | null
    books?: SeriesBook[]
}

export interface SeriesBook {
    id: string
    title: string
    sequence?: string | number | null
    libraryId: string
    addedAt: number
    updatedAt?: number | null
    media: {
        metadata: {
            title: string
            authorName?: string
        }
        coverPath?: string | null
        duration?: number
    }
}

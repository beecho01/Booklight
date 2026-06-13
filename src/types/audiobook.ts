export interface Author {
    id: string
    name: string
    coverPath?: string | null
    description?: string | null
}

export interface SeriesInfo {
    id: string
    name: string
    sequence?: string | number | null
}

export interface BookMetadata {
    title: string
    titleIgnorePrefix?: string
    subtitle?: string | null
    authors: Author[]
    /** Flat author name string from minified API responses (e.g. "Andy Weir") */
    authorName?: string
    authorNameLF?: string
    narrators: string[]
    /** Flat narrator name string from minified API responses */
    narratorName?: string
    /** Flat series name string from minified API responses */
    seriesName?: string
    publishedYear?: string | null
    publishedDate?: string | null
    description?: string | null
    genres: string[]
    series: SeriesInfo[]
    publisher?: string | null
    language?: string | null
    tags?: string[]
    asin?: string
    isbn?: string
    explicit?: boolean
    abridged?: boolean
}

export interface Chapter {
    id: number
    start: number
    end: number
    title: string
}

export interface Media {
    metadata: BookMetadata
    coverPath: string | null
    numTracks?: number
    numAudioFiles?: number
    duration?: number
    chapters?: Chapter[]
    authorName?: string
    narratorName?: string
    seriesName?: string
}

export interface LibraryItem {
    id: string
    media: Media
    mediaType: string
    libraryId: string
    folderId?: string
    path?: string
    addedAt: number
    updatedAt?: number | null
    isMissing?: boolean
    isInvalid?: boolean
    size?: number | null
}

export interface MediaProgress {
    id: string
    libraryItemId: string | null
    episodeId?: string | null
    duration: number
    progress: number // 0-1
    currentTime: number
    isFinished: boolean
    lastUpdate: number
    startedAt?: number | null
    finishedAt?: number | null
}

export interface LibraryItemExpanded extends LibraryItem {
    userMediaProgress?: MediaProgress | null
}

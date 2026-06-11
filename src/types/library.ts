export interface Library {
    id: string
    name: string
    mediaType: string // 'book' or 'podcast'
    folders?: LibraryFolder[]
    displayOrder?: number | null
    icon?: string | null
    provider?: string | null
    lastScan?: number | null
    lastScanVersion?: string | null
}

export interface LibraryFolder {
    id: string
    fullPath: string
    libraryId: string
}

export interface LibraryFilterData {
    authors: AuthorFilter[]
    genres: string[]
    tags: string[]
    series: SeriesFilter[]
    narrators: string[]
    publishers: string[]
    languages: string[]
}

export interface AuthorFilter {
    id: string
    name: string
}

export interface SeriesFilter {
    id: string
    name: string
}

export interface PersonalizedShelf {
    id: string
    label: string
    type: string
    entities: LibraryItemMinified[]
}

export interface LibraryItemMinified {
    id: string
    title: string
    mediaType: string
    addedAt: number
    updatedAt: number
    media: {
        metadata: {
            title: string
            authorName?: string
            narratorName?: string
        }
        coverPath?: string | null
        duration?: number
    }
    recentEpisode?: unknown
    size?: number
}

export interface LibraryItemsResponse {
    results: import('./audiobook').LibraryItemExpanded[]
    total: number
    limit: number
    page: number
    sortBy: string
    sortDesc: boolean
    filterBy: string
}

export type { LibraryItemExpanded as LibraryItem } from './audiobook'

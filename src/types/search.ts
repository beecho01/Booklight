export interface SearchResult {
    id: string
    libraryId?: string | null
    mediaType?: string | null
    title?: string | null
    author?: string | null
    series?: string | null
    description?: string | null
    coverPath?: string | null
}

export interface SearchResults {
    books?: SearchResult[]
    podcasts?: SearchResult[]
    authors?: SearchResult[]
    series?: SearchResult[]
    chapters?: SearchResult[]
    covers?: SearchResult[]
}

export interface LibrarySearchResult {
    book?: SearchResult[]
    podcast?: SearchResult[]
    authors?: SearchResult[]
    series?: SearchResult[]
    tags?: SearchResult[]
}

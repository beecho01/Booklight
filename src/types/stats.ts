export interface ListeningStats {
    totalTime: number
    items?: Record<string, number>
    days?: Record<string, number>
    dayOfWeek?: Record<string, number>
}

export interface ListeningSession {
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
    timeListening: number
    date: string
    dayOfWeek: string
}

export interface YearStats {
    totalListeningTime: number
    books: number
    days: number
    averageListeningTimePerDay: number
}

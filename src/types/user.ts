export interface User {
    id: string
    username: string
    email?: string | null
    type?: string // 'root', 'admin', 'user', 'guest'
    token?: string
    mediaProgress?: import('./audiobook').MediaProgress[]
    librariesAccessible?: string[]
    itemBookmarks?: UserBookmark[]
    permissions?: UserPermissions
    isActive?: boolean
    createdAt?: number
}

export interface UserPermissions {
    download: boolean
    upload: boolean
    accessAllLibraries: boolean
    accessAllTags: boolean
    accessExplicitContent: boolean
    delete: boolean
    update: boolean
    create: boolean
}

export interface UserBookmark {
    libraryItemId: string
    title: string
    time: number
    createdAt: number
}

export interface LoginRequest {
    username: string
    password: string
}

export interface LoginResponse {
    user: User
    serverVersion?: string
    serverSettings?: ServerSettings
}

export interface ServerSettings {
    id: string
    language: string
    metadataProvider: string
    coverAspectRatio: number
    sortingPrefixes: string[]
    scannerDisableSsdp: boolean
    scannerFindCovers: boolean
    scannerPreferMatchedMetadata: boolean
    scannerParseSubtitle: boolean
}

export interface ServerStatus {
    app: string
    serverVersion: string
    isInit: boolean
    language: string
    authMethods: string[]
}

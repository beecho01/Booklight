import { invoke } from '@tauri-apps/api/core'
import type {
    Library,
    LibraryFilterData,
    LibraryItemsResponse,
    PersonalizedShelf,
} from '../types/library'
import type { Series } from '../types/series'

export async function getLibraries(serverUrl: string, token: string): Promise<Library[]> {
    return invoke('get_libraries', { serverUrl, token })
}

export async function getLibrary(
    serverUrl: string,
    token: string,
    libraryId: string
): Promise<Library> {
    return invoke('get_library', { serverUrl, token, libraryId })
}

export async function getLibraryItems(
    serverUrl: string,
    token: string,
    libraryId: string,
    options?: {
        limit?: number
        page?: number
        sortBy?: string
        sortDesc?: boolean
        filterBy?: string
    }
): Promise<LibraryItemsResponse> {
    return invoke('get_library_items', { serverUrl, token, libraryId, ...options })
}

export async function getPersonalized(
    serverUrl: string,
    token: string,
    libraryId: string
): Promise<PersonalizedShelf[]> {
    return invoke('get_personalized', { serverUrl, token, libraryId })
}

export async function getFilterData(
    serverUrl: string,
    token: string,
    libraryId: string
): Promise<LibraryFilterData> {
    return invoke('get_filter_data', { serverUrl, token, libraryId })
}

export async function scanLibrary(
    serverUrl: string,
    token: string,
    libraryId: string
): Promise<void> {
    return invoke('scan_library', { serverUrl, token, libraryId })
}

export async function searchLibrary(
    serverUrl: string,
    token: string,
    libraryId: string,
    query: string
): Promise<unknown> {
    return invoke('search_library', { serverUrl, token, libraryId, query })
}

export async function getSeries(
    serverUrl: string,
    token: string,
    libraryId: string
): Promise<Series[]> {
    return invoke('get_series', { serverUrl, token, libraryId })
}

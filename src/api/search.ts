import { invoke } from '@tauri-apps/api/core'
import type { SearchResults } from '../types/search'

export default async function search(
    serverUrl: string,
    token: string,
    query: string
): Promise<SearchResults> {
    return invoke('search', { serverUrl, token, query })
}

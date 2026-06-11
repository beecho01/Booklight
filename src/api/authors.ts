import { invoke } from '@tauri-apps/api/core'
import type { Author } from '../types/audiobook'

export async function getAuthors(serverUrl: string, token: string): Promise<Author[]> {
    return invoke('get_authors', { serverUrl, token })
}

export async function getAuthor(
    serverUrl: string,
    token: string,
    authorId: string
): Promise<Author> {
    return invoke('get_author', { serverUrl, token, authorId })
}

export async function updateAuthor(
    serverUrl: string,
    token: string,
    authorId: string,
    options?: {
        name?: string
        description?: string
        asin?: string
    }
): Promise<Author> {
    return invoke('update_author', {
        serverUrl,
        token,
        authorId,
        name: options?.name || null,
        description: options?.description || null,
        asin: options?.asin || null,
    })
}

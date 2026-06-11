import { invoke } from '@tauri-apps/api/core'
import type { Collection } from '../types/collection'

export async function getCollections(
    serverUrl: string,
    token: string
): Promise<Collection[]> {
    return invoke('get_collections', { serverUrl, token })
}

export async function getCollection(
    serverUrl: string,
    token: string,
    collectionId: string
): Promise<Collection> {
    return invoke('get_collection', { serverUrl, token, collectionId })
}

export async function createCollection(
    serverUrl: string,
    token: string,
    libraryId: string,
    name: string,
    books: string[],
    description?: string
): Promise<Collection> {
    return invoke('create_collection', {
        serverUrl,
        token,
        libraryId,
        name,
        books,
        description: description || null,
    })
}

export async function updateCollection(
    serverUrl: string,
    token: string,
    collectionId: string,
    options?: {
        name?: string
        description?: string
        books?: string[]
    }
): Promise<Collection> {
    return invoke('update_collection', {
        serverUrl,
        token,
        collectionId,
        name: options?.name || null,
        description: options?.description || null,
        books: options?.books || null,
    })
}

export async function deleteCollection(
    serverUrl: string,
    token: string,
    collectionId: string
): Promise<void> {
    return invoke('delete_collection', { serverUrl, token, collectionId })
}
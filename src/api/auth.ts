import { invoke } from '@tauri-apps/api/core'
import type { LoginResponse, ServerStatus } from '../types/user'

export async function login(
    serverUrl: string,
    username: string,
    password: string
): Promise<LoginResponse> {
    return invoke('login', { serverUrl, username, password })
}

export async function authorize(serverUrl: string, token: string): Promise<LoginResponse> {
    return invoke('authorize', { serverUrl, token })
}

export async function loginWithToken(serverUrl: string, token: string): Promise<LoginResponse> {
    return invoke('login_with_token', { serverUrl, token })
}

export async function getServerStatus(serverUrl: string): Promise<ServerStatus> {
    return invoke('get_server_status', { serverUrl })
}

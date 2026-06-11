import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth'
import type { User } from '../types/user'

interface AuthState {
    user: User | null
    token: string | null
    serverUrl: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

interface AuthContextType extends AuthState {
    login: (serverUrl: string, username: string, password: string) => Promise<void>
    loginWithToken: (serverUrl: string, token: string) => Promise<void>
    logout: () => void
    restoreSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        token: null,
        serverUrl: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
    })

    const login = useCallback(async (serverUrl: string, username: string, password: string) => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        try {
            const response = await authApi.login(serverUrl, username, password)
            const token = response.user.token || ''
            setState({
                user: response.user,
                token,
                serverUrl,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            })
            localStorage.setItem('booklight_token', token)
            localStorage.setItem('booklight_server_url', serverUrl)
            localStorage.setItem('booklight_user', JSON.stringify(response.user))
        } catch (err) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : 'Login failed',
            }))
            throw err
        }
    }, [])

    const loginWithToken = useCallback(async (serverUrl: string, token: string) => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }))
        try {
            const response = await authApi.loginWithToken(serverUrl, token)
            setState({
                user: response.user,
                token,
                serverUrl,
                isAuthenticated: true,
                isLoading: false,
                error: null,
            })
            localStorage.setItem('booklight_token', token)
            localStorage.setItem('booklight_server_url', serverUrl)
            localStorage.setItem('booklight_user', JSON.stringify(response.user))
        } catch (err) {
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: err instanceof Error ? err.message : 'Token login failed',
            }))
            throw err
        }
    }, [])

    const logout = useCallback(() => {
        setState({
            user: null,
            token: null,
            serverUrl: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
        })
        localStorage.removeItem('booklight_token')
        localStorage.removeItem('booklight_server_url')
        localStorage.removeItem('booklight_user')
    }, [])

    const restoreSession = useCallback(async () => {
        const token = localStorage.getItem('booklight_token')
        const serverUrl = localStorage.getItem('booklight_server_url')

        if (token && serverUrl) {
            try {
                const response = await authApi.authorize(serverUrl, token)
                const restoredToken = response.user.token || token
                setState({
                    user: response.user,
                    token: restoredToken,
                    serverUrl,
                    isAuthenticated: true,
                    isLoading: false,
                    error: null,
                })
            } catch {
                localStorage.removeItem('booklight_token')
                localStorage.removeItem('booklight_server_url')
                localStorage.removeItem('booklight_user')
            }
        }
    }, [])

    useEffect(() => {
        restoreSession()
    }, [restoreSession])

    const contextValue = useMemo(
        () => ({ ...state, login, loginWithToken, logout, restoreSession }),
        [state, login, loginWithToken, logout, restoreSession]
    )

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

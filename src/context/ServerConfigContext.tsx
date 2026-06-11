import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface ServerConfigState {
    serverUrl: string
    isConnected: boolean
    isChecking: boolean
    error: string | null
}

interface ServerConfigContextType extends ServerConfigState {
    setServerUrl: (url: string) => void
    checkConnection: (url: string) => Promise<boolean>
}

const ServerConfigContext = createContext<ServerConfigContextType | null>(null)

export function ServerConfigProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ServerConfigState>(() => {
        const saved = localStorage.getItem('booklight_server_url')
        return {
            serverUrl: saved || '',
            isConnected: false,
            isChecking: false,
            error: null,
        }
    })

    const setServerUrl = useCallback((url: string) => {
        setState((prev) => ({ ...prev, serverUrl: url, error: null }))
        localStorage.setItem('booklight_server_url', url)
    }, [])

    const checkConnection = useCallback(async (url: string): Promise<boolean> => {
        setState((prev) => ({ ...prev, isChecking: true, error: null }))
        try {
            const { invoke } = await import('@tauri-apps/api/core')
            await invoke('get_server_status', { serverUrl: url })
            setState((prev) => ({ ...prev, isConnected: true, isChecking: false, error: null }))
            return true
        } catch (err) {
            setState((prev) => ({
                ...prev,
                isConnected: false,
                isChecking: false,
                error: err instanceof Error ? err.message : 'Connection failed',
            }))
            return false
        }
    }, [])

    const contextValue = useMemo(
        () => ({ ...state, setServerUrl, checkConnection }),
        [state, setServerUrl, checkConnection]
    )

    return (
        <ServerConfigContext.Provider value={contextValue}>{children}</ServerConfigContext.Provider>
    )
}

export function useServerConfig(): ServerConfigContextType {
    const context = useContext(ServerConfigContext)
    if (!context) {
        throw new Error('useServerConfig must be used within a ServerConfigProvider')
    }
    return context
}

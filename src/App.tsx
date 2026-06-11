import { FluentProvider } from '@fluentui/react-components'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { AuthProvider } from './context/AuthContext'
import { PlaybackProvider } from './context/PlaybackContext'
import { ServerConfigProvider } from './context/ServerConfigContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import CollectionsPage from './pages/CollectionsPage'
import LibraryPage from './pages/LibraryPage'
import NowPlayingPage from './pages/NowPlayingPage'
import SettingsPage from './pages/SettingsPage'

function ThemedApp() {
    const { theme } = useTheme()

    return (
        <FluentProvider theme={theme}>
            <BrowserRouter>
                <AppShell>
                    <Routes>
                        <Route path="/" element={<Navigate to="/library" replace />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/collections" element={<CollectionsPage />} />
                        <Route path="/now-playing" element={<NowPlayingPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Routes>
                </AppShell>
            </BrowserRouter>
        </FluentProvider>
    )
}

function App() {
    return (
        <ThemeProvider>
            <ServerConfigProvider>
                <AuthProvider>
                    <PlaybackProvider>
                        <ThemedApp />
                    </PlaybackProvider>
                </AuthProvider>
            </ServerConfigProvider>
        </ThemeProvider>
    )
}

export default App

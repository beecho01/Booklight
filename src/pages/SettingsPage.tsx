import {
    Button,
    Field,
    Input,
    makeStyles,
    MessageBar,
    MessageBarBody,
    MessageBarTitle,
    Spinner,
    Tab,
    TabList,
    Text,
    tokens,
} from '@fluentui/react-components'
import { Clock20Regular, Headphones20Regular } from '@fluentui/react-icons'
import { useCallback, useEffect, useState } from 'react'
import * as meApi from '../api/me'
import { useAuth } from '../context/AuthContext'
import { useServerConfig } from '../context/ServerConfigContext'
import { useTheme } from '../context/ThemeContext'
import { ListeningSession, ListeningStats } from '../types'

const useStyles = makeStyles({
    page: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalL,
        maxWidth: '600px',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
        padding: tokens.spacingHorizontalL,
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    formField: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
    },
    buttonRow: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
    },
    tabContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
        marginTop: tokens.spacingVerticalM,
    },
    helperText: {
        color: tokens.colorNeutralForeground3,
        fontSize: '12px',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: tokens.spacingHorizontalM,
    },
    statCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: tokens.spacingVerticalM,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: '8px',
        gap: tokens.spacingVerticalXS,
    },
    statValue: {
        fontSize: '24px',
        fontWeight: '600',
        color: tokens.colorBrandForeground1,
    },
    statLabel: {
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: tokens.colorNeutralForeground3,
    },
    sessionList: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
        maxHeight: '240px',
        overflowY: 'auto',
    },
    sessionItem: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        borderRadius: '4px',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground2,
        },
    },
    sessionInfo: {
        flex: 1,
        minWidth: 0,
    },
    sessionTitle: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    sessionMeta: {
        color: tokens.colorNeutralForeground3,
        fontSize: '12px',
    },
})

export default function SettingsPage() {
    const styles = useStyles()
    const { user, login, loginWithToken, logout, isAuthenticated, token } = useAuth()
    const { serverUrl, checkConnection, isConnected } = useServerConfig()
    const { mode, setMode } = useTheme()

    const [urlInput, setUrlInput] = useState(serverUrl || '')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [accessToken, setAccessToken] = useState('')
    const [authTab, setAuthTab] = useState<'credentials' | 'token'>('credentials')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [connectionStatus, setConnectionStatus] = useState<
        'idle' | 'checking' | 'connected' | 'error'
    >(isConnected ? 'connected' : 'idle')
    const [listeningStats, setListeningStats] = useState<ListeningStats | null>(null)
    const [recentSessions, setRecentSessions] = useState<ListeningSession[]>([])
    const [statsLoading, setStatsLoading] = useState(false)

    const loadStats = useCallback(async () => {
        if (!serverUrl || !token) return
        setStatsLoading(true)
        try {
            const [stats, sessions] = await Promise.all([
                meApi.getListeningStats(serverUrl, token).catch(() => null),
                meApi.getListeningSessions(serverUrl, token).catch(() => []),
            ])
            setListeningStats(stats)
            setRecentSessions(sessions.slice(0, 10))
        } catch {
            // silently fail
        } finally {
            setStatsLoading(false)
        }
    }, [serverUrl, token])

    useEffect(() => {
        if (isAuthenticated) {
            loadStats()
        }
    }, [isAuthenticated, loadStats])

    const handleCheckConnection = async () => {
        setConnectionStatus('checking')
        try {
            const success = await checkConnection(urlInput.replace(/\/$/, ''))
            if (success) {
                setConnectionStatus('connected')
                setError(null)
            } else {
                setConnectionStatus('error')
                setError('Could not reach server')
            }
        } catch {
            setConnectionStatus('error')
            setError('Could not reach server')
        }
    }

    const handleLogin = async () => {
        if (!urlInput) {
            setError('Please enter a server URL first')
            return
        }
        setLoading(true)
        setError(null)
        try {
            await login(urlInput.replace(/\/$/, ''), username, password)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    const handleTokenLogin = async () => {
        if (!urlInput) {
            setError('Please enter a server URL first')
            return
        }
        setLoading(true)
        setError(null)
        try {
            await loginWithToken(urlInput.replace(/\/$/, ''), accessToken)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Token login failed')
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        setUsername('')
        setPassword('')
        setAccessToken('')
    }

    return (
        <div className={styles.page}>
            <Text size={600} weight="semibold">
                Settings
            </Text>

            {/* Server Connection */}
            <div className={styles.section}>
                <Text size={500} weight="semibold">
                    Server Connection
                </Text>
                <Field label="Audiobookshelf Server URL">
                    <Input
                        value={urlInput}
                        onChange={(_, data) => setUrlInput(data.value)}
                        placeholder="https://audiobookshelf.example.com"
                    />
                </Field>
                <div className={styles.buttonRow}>
                    <Button
                        appearance="primary"
                        onClick={handleCheckConnection}
                        disabled={!urlInput || connectionStatus === 'checking'}
                    >
                        {connectionStatus === 'checking' ? 'Checking...' : 'Check Connection'}
                    </Button>
                    {connectionStatus === 'connected' && (
                        <Text style={{ color: tokens.colorPaletteGreenForeground1 }}>
                            ✓ Connected
                        </Text>
                    )}
                    {connectionStatus === 'error' && (
                        <Text style={{ color: tokens.colorPaletteRedForeground1 }}>
                            ✗ Could not connect
                        </Text>
                    )}
                </div>
            </div>

            {/* Login */}
            <div className={styles.section}>
                <Text size={500} weight="semibold">
                    Authentication
                </Text>
                {isAuthenticated ? (
                    <>
                        <Text>
                            Logged in as <strong>{user?.username || 'Unknown'}</strong>
                        </Text>
                        <Button appearance="secondary" onClick={handleLogout}>
                            Log Out
                        </Button>
                    </>
                ) : (
                    <>
                        {error && (
                            <MessageBar intent="error">
                                <MessageBarBody>
                                    <MessageBarTitle>Error</MessageBarTitle>
                                    {error}
                                </MessageBarBody>
                            </MessageBar>
                        )}
                        <TabList
                            selectedValue={authTab}
                            onTabSelect={(_, data) =>
                                setAuthTab(data.value as 'credentials' | 'token')
                            }
                        >
                            <Tab value="credentials">Username & Password</Tab>
                            <Tab value="token">Access Token</Tab>
                        </TabList>
                        {authTab === 'credentials' ? (
                            <div className={styles.tabContent}>
                                <Field label="Username">
                                    <Input
                                        value={username}
                                        onChange={(_, data) => setUsername(data.value)}
                                    />
                                </Field>
                                <Field label="Password">
                                    <Input
                                        type="password"
                                        value={password}
                                        onChange={(_, data) => setPassword(data.value)}
                                    />
                                </Field>
                                <Button
                                    appearance="primary"
                                    onClick={handleLogin}
                                    disabled={loading || !username || !password}
                                >
                                    {loading ? <Spinner size="small" /> : 'Log In'}
                                </Button>
                            </div>
                        ) : (
                            <div className={styles.tabContent}>
                                <Field label="Access Token">
                                    <Input
                                        type="password"
                                        value={accessToken}
                                        onChange={(_, data) => setAccessToken(data.value)}
                                        placeholder="Paste your API token here"
                                    />
                                </Field>
                                <Text className={styles.helperText}>
                                    You can generate an access token from your Audiobookshelf
                                    server&apos;s Settings → Users page.
                                </Text>
                                <Button
                                    appearance="primary"
                                    onClick={handleTokenLogin}
                                    disabled={loading || !accessToken}
                                >
                                    {loading ? <Spinner size="small" /> : 'Connect with Token'}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Theme */}
            <div className={styles.section}>
                <Text size={500} weight="semibold">
                    Appearance
                </Text>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        appearance={mode === 'light' ? 'primary' : 'secondary'}
                        onClick={() => setMode('light')}
                    >
                        Light
                    </Button>
                    <Button
                        appearance={mode === 'dark' ? 'primary' : 'secondary'}
                        onClick={() => setMode('dark')}
                    >
                        Dark
                    </Button>
                    <Button
                        appearance={mode === 'system' ? 'primary' : 'secondary'}
                        onClick={() => setMode('system')}
                    >
                        System
                    </Button>
                </div>
            </div>

            {/* Listening Statistics */}
            {isAuthenticated && (
                <div className={styles.section}>
                    <Text size={500} weight="semibold">
                        <Headphones20Regular /> Listening Statistics
                    </Text>
                    {(() => {
                        if (statsLoading) {
                            return <Spinner size="small" label="Loading stats..." />
                        }
                        if (!listeningStats) {
                            return (
                                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                    No listening statistics available.
                                </Text>
                            )
                        }
                        return (
                            <>
                                <div className={styles.statsGrid}>
                                    <div className={styles.statCard}>
                                        <Text className={styles.statValue}>
                                            {Math.floor(listeningStats.totalTime / 3600)}h
                                        </Text>
                                        <Text className={styles.statLabel}>Total Listening</Text>
                                    </div>
                                    <div className={styles.statCard}>
                                        <Text className={styles.statValue}>
                                            {listeningStats.items
                                                ? Object.keys(listeningStats.items).length
                                                : 0}
                                        </Text>
                                        <Text className={styles.statLabel}>Items Listened</Text>
                                    </div>
                                    <div className={styles.statCard}>
                                        <Text className={styles.statValue}>
                                            {listeningStats.days
                                                ? Object.keys(listeningStats.days).length
                                                : 0}
                                        </Text>
                                        <Text className={styles.statLabel}>Days Active</Text>
                                    </div>
                                </div>
                                {recentSessions.length > 0 && (
                                    <>
                                        <Text
                                            size={300}
                                            weight="semibold"
                                            style={{ marginTop: tokens.spacingVerticalM }}
                                        >
                                            Recent Sessions
                                        </Text>
                                        <div className={styles.sessionList}>
                                            {recentSessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className={styles.sessionItem}
                                                >
                                                    <Clock20Regular
                                                        style={{
                                                            color: tokens.colorNeutralForeground3,
                                                            fontSize: '16px',
                                                        }}
                                                    />
                                                    <div className={styles.sessionInfo}>
                                                        <Text
                                                            className={styles.sessionTitle}
                                                            size={200}
                                                            weight="semibold"
                                                            block
                                                        >
                                                            {session.displayTitle}
                                                        </Text>
                                                        <Text
                                                            className={styles.sessionMeta}
                                                            size={100}
                                                            block
                                                        >
                                                            {session.displayAuthor || 'Unknown'} ·{' '}
                                                            {Math.round(session.timeListening / 60)}{' '}
                                                            min
                                                        </Text>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}

import { Button, Input, makeStyles, Nav, NavItem, Text, tokens } from '@fluentui/react-components'
import {
    Dismiss20Regular,
    Folder20Regular,
    Library20Regular,
    MusicNote220Regular,
    Navigation20Regular,
    Open20Regular,
    Search20Regular,
    Settings20Regular,
} from '@fluentui/react-icons'
import { useCallback, useState } from 'react'
import searchApi from '../api/search'
import { useAuth } from '../context/AuthContext'
import { sidebarShadow } from '../theme'
import type { SearchResult } from '../types/search'

const useStyles = makeStyles({
    sidebar: {
        gridRow: '2 / 4',
        backgroundColor: 'transparent',
        boxShadow: sidebarShadow,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
    },
    sidebarExpanded: {
        width: '240px',
        padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    },
    sidebarCollapsed: {
        width: '56px',
        padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalS}`,
    },
    sidebarTop: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        marginBottom: tokens.spacingVerticalM,
    },
    sidebarNav: {
        flex: 1,
    },
    sidebarBottom: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
        paddingTop: tokens.spacingVerticalM,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    bottomButton: {
        justifyContent: 'flex-start',
        width: '100%',
    },
    searchBox: {
        marginBottom: tokens.spacingVerticalM,
    },
    searchResults: {
        maxHeight: '240px',
        overflowY: 'auto',
        marginBottom: tokens.spacingVerticalS,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    searchResultItem: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        borderRadius: '4px',
        cursor: 'pointer',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground3,
        },
    },
    searchResultCover: {
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        objectFit: 'cover',
        flexShrink: 0,
        backgroundColor: tokens.colorNeutralBackground3,
    },
    searchResultInfo: {
        flex: 1,
        minWidth: 0,
    },
    searchResultTitle: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    searchResultAuthor: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: tokens.colorNeutralForeground3,
    },
    toggleButton: {
        minWidth: '32px',
        minHeight: '32px',
        padding: '0',
    },
})

interface SidebarProps {
    currentPage: string
    onNavigate: (page: string) => void
    onSearchSelect?: (item: SearchResult) => void
    collapsed?: boolean
    onCollapsedChange?: (collapsed: boolean) => void
}

export default function Sidebar({
    currentPage,
    onNavigate,
    onSearchSelect,
    collapsed = false,
    onCollapsedChange,
}: SidebarProps) {
    const styles = useStyles()
    const { serverUrl, token } = useAuth()
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])

    const handleSearch = useCallback(
        async (query: string) => {
            setSearchQuery(query)
            if (!query.trim() || !serverUrl || !token) {
                setSearchResults([])
                return
            }
            try {
                const results = await searchApi(serverUrl, token, query)
                const allResults: SearchResult[] = []
                if (results.books) allResults.push(...results.books)
                if (results.podcasts) allResults.push(...results.podcasts)
                if (results.authors) allResults.push(...results.authors)
                setSearchResults(allResults.slice(0, 10))
            } catch {
                setSearchResults([])
            }
        },
        [serverUrl, token]
    )

    const handleNavItemSelect = (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _event: any,
        data: { value: string }
    ) => {
        onNavigate(data.value)
    }

    return (
        <div
            className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}
        >
            <div className={styles.sidebarTop}>
                <Button
                    appearance="subtle"
                    className={styles.toggleButton}
                    icon={<Navigation20Regular />}
                    onClick={() => onCollapsedChange?.(!collapsed)}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                />
            </div>

            {!collapsed && (
                <div className={styles.searchBox}>
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.currentTarget.value)}
                        contentBefore={<Search20Regular />}
                        contentAfter={
                            searchQuery ? (
                                <Button
                                    appearance="subtle"
                                    size="small"
                                    icon={<Dismiss20Regular />}
                                    onClick={() => {
                                        setSearchQuery('')
                                        setSearchResults([])
                                    }}
                                />
                            ) : undefined
                        }
                        style={{ width: '100%' }}
                    />
                    {searchResults.length > 0 && (
                        <div className={styles.searchResults}>
                            {searchResults.map((result) => (
                                <div
                                    key={result.id}
                                    className={styles.searchResultItem}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        onSearchSelect?.(result)
                                        setSearchQuery('')
                                        setSearchResults([])
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            onSearchSelect?.(result)
                                            setSearchQuery('')
                                            setSearchResults([])
                                        }
                                    }}
                                >
                                    {result.coverPath && serverUrl && (
                                        <img
                                            className={styles.searchResultCover}
                                            src={`${serverUrl}/api/items/${result.id}/cover`}
                                            alt=""
                                        />
                                    )}
                                    <div className={styles.searchResultInfo}>
                                        <Text
                                            className={styles.searchResultTitle}
                                            size={200}
                                            weight="semibold"
                                            block
                                        >
                                            {result.title || 'Unknown'}
                                        </Text>
                                        <Text
                                            className={styles.searchResultAuthor}
                                            size={100}
                                            block
                                        >
                                            {result.author || result.series || ''}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <Nav
                className={styles.sidebarNav}
                selectedValue={currentPage}
                onNavItemSelect={handleNavItemSelect}
            >
                <NavItem icon={<Library20Regular />} value="library">
                    {!collapsed && 'Library'}
                </NavItem>
                <NavItem icon={<Folder20Regular />} value="collections">
                    {!collapsed && 'Collections'}
                </NavItem>
                <NavItem icon={<MusicNote220Regular />} value="now-playing">
                    {!collapsed && 'Now Playing'}
                </NavItem>
            </Nav>

            <div className={styles.sidebarBottom}>
                <Button
                    appearance="subtle"
                    className={styles.bottomButton}
                    icon={<Settings20Regular />}
                    onClick={() => onNavigate('settings')}
                >
                    {!collapsed && 'Settings'}
                </Button>
                {!collapsed && (
                    <Button
                        appearance="subtle"
                        className={styles.bottomButton}
                        icon={<Open20Regular />}
                        onClick={() =>
                            window.open('https://github.com/advplyr/audiobookshelf', '_blank')
                        }
                    >
                        View Repository
                    </Button>
                )}
            </div>
        </div>
    )
}

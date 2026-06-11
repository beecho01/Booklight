import { makeStyles, shorthands, tokens } from '@fluentui/react-components'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePlayback } from '../context/PlaybackContext'
import type { SearchResult } from '../types/search'
import NowPlayingBar from './NowPlayingBar'
import Sidebar from './Sidebar'
import TitleBar from './TitleBar'

const useStyles = makeStyles({
    root: {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gridTemplateRows: 'auto 1fr',
        height: '100vh',
        ...shorthands.overflow('hidden'),
        // Semi-transparent background so Mica shows through
        backgroundColor: tokens.colorNeutralBackground1,
    },
    titlebar: {
        gridColumn: '1 / 3',
    },
    main: {
        overflowY: 'auto' as const,
        ...shorthands.padding(tokens.spacingHorizontalXXL),
        // Bottom padding is added dynamically when now-playing bar is visible
        // Semi-transparent so Mica material is visible
        backgroundColor: tokens.colorNeutralBackground1,
    },
    nowPlayingOverlay: {
        position: 'fixed',
        bottom: tokens.spacingVerticalM,
        right: tokens.spacingHorizontalM,
        zIndex: 10,
        transition: 'left 0.2s ease',
    },
})

export default function AppShell({ children }: { children: React.ReactNode }) {
    const styles = useStyles()
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const { currentItem } = usePlayback()

    const currentPage = location.pathname.replace('/', '') || 'library'

    const handleNavigate = (page: string) => {
        navigate(`/${page}`)
    }

    const handleSearchSelect = (result: SearchResult) => {
        // Navigate to library and let it open the item detail
        navigate(`/library?itemId=${result.id}`)
    }

    return (
        <div className={styles.root}>
            <div className={styles.titlebar}>
                <TitleBar />
            </div>
            <Sidebar
                currentPage={currentPage}
                onNavigate={handleNavigate}
                onSearchSelect={handleSearchSelect}
                collapsed={sidebarCollapsed}
                onCollapsedChange={setSidebarCollapsed}
            />
            <div
                className={styles.main}
                style={{ paddingBottom: currentItem ? '90px' : undefined }}
            >
                {children}
            </div>
            <div
                className={styles.nowPlayingOverlay}
                style={{ left: sidebarCollapsed ? '68px' : '252px' }}
            >
                <NowPlayingBar />
            </div>
        </div>
    )
}

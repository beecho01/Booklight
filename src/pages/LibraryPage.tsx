import {
    Button,
    makeStyles,
    Menu,
    MenuGroup,
    MenuGroupHeader,
    MenuItemCheckbox,
    MenuList,
    MenuPopover,
    MenuTrigger,
    Text,
    tokens,
    Tooltip,
} from '@fluentui/react-components'
import {
    ArrowDownload20Regular,
    ArrowSync20Regular,
    Filter20Regular,
    Share20Regular,
    ZoomIn20Regular,
} from '@fluentui/react-icons'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as itemsApi from '../api/items'
import * as librariesApi from '../api/libraries'
import AudiobookDetailModal from '../components/AudiobookDetailModal'
import BookCardGrid from '../components/BookCardGrid'
import ZoomControl from '../components/ZoomControl'
import { useAuth } from '../context/AuthContext'
import type { LibraryItemExpanded } from '../types/audiobook'
import type { Library, LibraryFilterData } from '../types/library'

const useStyles = makeStyles({
    page: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    grid: {
        flex: 1,
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: tokens.colorNeutralForeground3,
    },
    error: {
        color: tokens.colorPaletteRedForeground1,
        padding: tokens.spacingHorizontalM,
    },
})

export default function LibraryPage() {
    const styles = useStyles()
    const { serverUrl, token, isAuthenticated } = useAuth()
    const [searchParams] = useSearchParams()
    const [libraries, setLibraries] = useState<Library[]>([])
    const [items, setItems] = useState<LibraryItemExpanded[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [zoomLevel, setZoomLevel] = useState<'small' | 'medium' | 'large'>('medium')
    const [showZoom, setShowZoom] = useState(false)
    const [selectedItem, setSelectedItem] = useState<LibraryItemExpanded | null>(null)
    const [scanning, setScanning] = useState(false)
    const [filterData, setFilterData] = useState<LibraryFilterData | null>(null)
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
    const [selectedNarrators, setSelectedNarrators] = useState<string[]>([])

    // Filter items based on selected genres, authors, and narrators
    const filteredItems = useMemo(() => {
        if (
            selectedGenres.length === 0 &&
            selectedAuthors.length === 0 &&
            selectedNarrators.length === 0
        ) {
            return items
        }

        return items.filter((item) => {
            const metadata = item.media?.metadata
            if (!metadata) return false

            const matchesGenre =
                selectedGenres.length === 0 ||
                metadata.genres?.some((g) => selectedGenres.includes(g))

            const matchesAuthor =
                selectedAuthors.length === 0 ||
                metadata.authors?.some((a) => selectedAuthors.includes(a.id)) ||
                (metadata.authorName && selectedAuthors.includes(metadata.authorName))

            const matchesNarrator =
                selectedNarrators.length === 0 ||
                metadata.narrators?.some((n) => selectedNarrators.includes(n)) ||
                (metadata.narratorName && selectedNarrators.includes(metadata.narratorName))

            return matchesGenre && matchesAuthor && matchesNarrator
        })
    }, [items, selectedGenres, selectedAuthors, selectedNarrators])

    const loadLibraries = useCallback(async () => {
        if (!serverUrl || !token) return
        setLoading(true)
        setError(null)
        try {
            const libs = await librariesApi.getLibraries(serverUrl, token)
            setLibraries(libs)
            if (libs.length > 0) {
                const bookLib = libs.find((l) => l.mediaType === 'book') || libs[0]
                const [response, filters] = await Promise.all([
                    librariesApi.getLibraryItems(serverUrl, token, bookLib.id),
                    librariesApi.getFilterData(serverUrl, token, bookLib.id).catch(() => null),
                ])
                setItems(response.results)
                if (filters) setFilterData(filters)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load libraries')
        } finally {
            setLoading(false)
        }
    }, [serverUrl, token])

    useEffect(() => {
        if (isAuthenticated) {
            loadLibraries()
        }
    }, [isAuthenticated, loadLibraries])

    // Handle search selection via query param
    useEffect(() => {
        const itemId = searchParams.get('itemId')
        if (itemId && serverUrl && token && !loading) {
            itemsApi
                .getItem(serverUrl, token, itemId)
                .then((item) => setSelectedItem(item))
                .catch(() => {})
        }
    }, [searchParams, serverUrl, token, loading])

    const handleScan = async () => {
        if (!serverUrl || !token || libraries.length === 0) return
        setScanning(true)
        try {
            const bookLib = libraries.find((l) => l.mediaType === 'book') || libraries[0]
            await librariesApi.scanLibrary(serverUrl, token, bookLib.id)
        } catch {
            // silently fail
        } finally {
            setScanning(false)
        }
    }

    const handleItemClick = async (item: LibraryItemExpanded) => {
        if (!serverUrl || !token) return
        try {
            const fullItem = await itemsApi.getItem(serverUrl, token, item.id)
            setSelectedItem(fullItem)
        } catch {
            setSelectedItem(item)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.page}>
                <Text size={600} weight="semibold">
                    Audiobook Library
                </Text>
                <Text>Please connect to your Audiobookshelf server in Settings.</Text>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <Text size={600} weight="semibold">
                Audiobook Library
            </Text>

            <div className={styles.toolbar}>
                <Menu
                    hasCheckmarks
                    positioning={{ autoSize: true }}
                    checkedValues={{
                        genres: selectedGenres,
                        authors: selectedAuthors,
                        narrators: selectedNarrators,
                    }}
                    onCheckedValueChange={(_, data) => {
                        const { name, checkedItems } = data
                        if (name === 'genres') setSelectedGenres(checkedItems)
                        else if (name === 'authors') setSelectedAuthors(checkedItems)
                        else if (name === 'narrators') setSelectedNarrators(checkedItems)
                    }}
                >
                    <MenuTrigger disableButtonEnhancement>
                        <Tooltip content="Filter" relationship="label">
                            <Button
                                appearance="subtle"
                                icon={<Filter20Regular />}
                                style={
                                    selectedGenres.length > 0 ||
                                    selectedAuthors.length > 0 ||
                                    selectedNarrators.length > 0
                                        ? { color: tokens.colorBrandForeground1 }
                                        : undefined
                                }
                            />
                        </Tooltip>
                    </MenuTrigger>
                    <MenuPopover>
                        <MenuList style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {filterData?.genres && filterData.genres.length > 0 && (
                                <MenuGroup>
                                    <MenuGroupHeader>Genres</MenuGroupHeader>
                                    {filterData.genres.slice(0, 15).map((genre) => (
                                        <MenuItemCheckbox key={genre} name="genres" value={genre}>
                                            {genre}
                                        </MenuItemCheckbox>
                                    ))}
                                </MenuGroup>
                            )}
                            {filterData?.authors && filterData.authors.length > 0 && (
                                <MenuGroup>
                                    <MenuGroupHeader>Authors</MenuGroupHeader>
                                    {filterData.authors.slice(0, 15).map((a) => (
                                        <MenuItemCheckbox key={a.id} name="authors" value={a.id}>
                                            {a.name}
                                        </MenuItemCheckbox>
                                    ))}
                                </MenuGroup>
                            )}
                            {filterData?.narrators && filterData.narrators.length > 0 && (
                                <MenuGroup>
                                    <MenuGroupHeader>Narrators</MenuGroupHeader>
                                    {filterData.narrators.slice(0, 15).map((n) => (
                                        <MenuItemCheckbox key={n} name="narrators" value={n}>
                                            {n}
                                        </MenuItemCheckbox>
                                    ))}
                                </MenuGroup>
                            )}
                        </MenuList>
                    </MenuPopover>
                </Menu>
                <Tooltip content="Refresh" relationship="label">
                    <Button
                        appearance="subtle"
                        icon={<ArrowSync20Regular />}
                        onClick={loadLibraries}
                    />
                </Tooltip>
                <Tooltip content="Scan Library" relationship="label">
                    <Button
                        appearance="subtle"
                        icon={<ArrowDownload20Regular />}
                        onClick={handleScan}
                        disabled={scanning}
                    />
                </Tooltip>
                <Tooltip content="Export" relationship="label">
                    <Button appearance="subtle" icon={<Share20Regular />} />
                </Tooltip>
                <Tooltip content="Zoom" relationship="label">
                    <Button
                        appearance="subtle"
                        icon={<ZoomIn20Regular />}
                        onClick={() => setShowZoom(!showZoom)}
                    />
                </Tooltip>
                {showZoom && <ZoomControl level={zoomLevel} onLevelChange={setZoomLevel} />}
            </div>

            {error && (
                <div className={styles.error}>
                    <Text>{error}</Text>
                </div>
            )}

            {loading ? (
                <div className={styles.loading}>
                    <Text>Loading library...</Text>
                </div>
            ) : (
                <div className={styles.grid}>
                    <BookCardGrid
                        items={filteredItems}
                        onItemClick={handleItemClick}
                        zoomLevel={zoomLevel}
                    />
                </div>
            )}

            {selectedItem && (
                <AudiobookDetailModal
                    item={selectedItem}
                    open={!!selectedItem}
                    onOpenChange={(_, data) => {
                        if (!data.open) setSelectedItem(null)
                    }}
                />
            )}
        </div>
    )
}

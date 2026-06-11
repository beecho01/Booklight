import {
    Button,
    Dialog,
    DialogActions,
    DialogBody,
    DialogSurface,
    makeStyles,
    Spinner,
    Text,
    tokens,
} from '@fluentui/react-components'
import {
    Bookmark20Regular,
    BookNumber20Regular,
    Calendar20Regular,
    Clock20Regular,
    Dismiss20Regular,
    Document20Regular,
    Play20Filled,
    Search20Regular,
} from '@fluentui/react-icons'
import { useCallback, useEffect, useState } from 'react'
import * as itemsApi from '../api/items'
import * as meApi from '../api/me'
import { useAuth } from '../context/AuthContext'
import { usePlayback } from '../context/PlaybackContext'
import { borderRadiusLarge, borderRadiusMedium, borderRadiusSmall } from '../theme'
import type { LibraryItemExpanded } from '../types/audiobook'
import type { UserBookmark } from '../types/user'
import { formatDuration, formatTime } from '../utils/formatTime'

const useStyles = makeStyles({
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    dialogSurface: {
        borderRadius: borderRadiusLarge,
        maxWidth: '720px',
        width: '100%',
        // background: tokens.colorNeutralBackground2,
    },
    dialogBody: {
        // Override Fluent UI's default DialogBody grid to use our two-column layout
        display: 'flex',
        gap: tokens.spacingHorizontalXL,
        flexDirection: 'column',
        paddingBottom: '36px',
    },
    coverColumn: {
        display: 'flex',
        flexShrink: 0,
        width: '200px',
        alignItems: 'center',
    },
    coverImage: {
        width: '100%',
        aspectRatio: '1 / 1',
        objectFit: 'cover' as const,
        borderRadius: borderRadiusMedium,
        // backgroundColor: tokens.colorNeutralBackground3,
    },
    coverPlaceholder: {
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: borderRadiusMedium,
        // backgroundColor: tokens.colorNeutralBackground3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '64px',
    },
    metadataColumn: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        minWidth: 0,
    },
    description: {
        maxHeight: '200px',
        overflowY: 'auto' as const,
        color: tokens.colorNeutralForeground2,
        fontSize: '12px',
        lineHeight: '1.5',
        wordBreak: 'break-word' as const,
        '& p': {
            margin: '0 0 8px 0',
        },
        '& p:last-child': {
            marginBottom: '0',
        },
        '& b, & strong': {
            fontWeight: '600',
        },
        '& i, & em': {
            fontStyle: 'italic',
        },
        '& br': {
            display: 'block',
            content: "''",
            marginTop: '4px',
        },
    },
    detailsContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: '36px',
    },
    metaRow: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    metaIcon: {
        color: tokens.colorNeutralForeground3,
    },
    metaText: {
        color: tokens.colorNeutralForeground2,
    },
    closeButton: {
        position: 'absolute' as const,
        top: tokens.spacingVerticalM,
        right: tokens.spacingHorizontalM,
    },
    bookmarksSection: {
        marginTop: tokens.spacingVerticalS,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        paddingTop: tokens.spacingVerticalS,
    },
    bookmarkItem: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        borderRadius: borderRadiusSmall,
        cursor: 'pointer',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground3,
        },
    },
    bookmarkTime: {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: tokens.colorBrandForeground1,
        flexShrink: 0,
        minWidth: '48px',
    },
    bookmarkTitle: {
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    bookmarkDelete: {
        minWidth: '24px',
        minHeight: '24px',
        padding: '0',
        flexShrink: 0,
    },
    matchButton: {
        flexShrink: 0,
    },
    matchingSpinner: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
})

interface AudiobookDetailModalProps {
    item: LibraryItemExpanded
    open: boolean
    onOpenChange: (event: any, data: { open: boolean }) => void
}

export default function AudiobookDetailModal({
    item,
    open,
    onOpenChange,
}: AudiobookDetailModalProps) {
    const styles = useStyles()
    const playback = usePlayback()
    const { serverUrl, token } = useAuth()
    const [bookmarks, setBookmarks] = useState<UserBookmark[]>([])
    const [matching, setMatching] = useState(false)

    const title = item.media?.metadata?.title || 'Unknown'
    const author =
        item.media?.metadata?.authors?.map((a) => a.name).join(', ') ||
        item.media?.metadata?.authorName ||
        item.media?.authorName ||
        'Unknown'
    const narrators =
        item.media?.metadata?.narrators?.join(', ') ||
        item.media?.metadata?.narratorName ||
        item.media?.narratorName ||
        undefined
    const description = item.media?.metadata?.description
    const numTracks = item.media?.numTracks
    const numChapters = item.media?.chapters?.length
    const duration = item.media?.duration
    const publishedYear = item.media?.metadata?.publishedYear
    const coverUrl = item.media?.coverPath ? `${serverUrl}/api/items/${item.id}/cover` : null

    // Load bookmarks when modal opens
    useEffect(() => {
        if (open && serverUrl && token) {
            meApi
                .getCurrentUser(serverUrl, token)
                .then((user) => {
                    const itemBookmarks = (user.itemBookmarks || []).filter(
                        (b: UserBookmark) => b.libraryItemId === item.id
                    )
                    setBookmarks(itemBookmarks)
                })
                .catch(() => setBookmarks([]))
        }
    }, [open, serverUrl, token, item.id])

    const handleDeleteBookmark = useCallback(
        async (time: number) => {
            if (!serverUrl || !token) return
            try {
                await meApi.deleteBookmark(serverUrl, token, item.id, time)
                setBookmarks((prev) => prev.filter((b) => b.time !== time))
            } catch {
                // silently fail
            }
        },
        [serverUrl, token, item.id]
    )

    const handleMatch = useCallback(async () => {
        if (!serverUrl || !token) return
        setMatching(true)
        try {
            await itemsApi.matchItem(serverUrl, token, item.id, 'google')
        } catch {
            // silently fail
        } finally {
            setMatching(false)
        }
    }, [serverUrl, token, item.id])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogSurface className={styles.dialogSurface}>
                <DialogBody className={styles.dialogBody}>
                    <div className={styles.detailsContainer}>
                        <div className={styles.coverColumn}>
                            {coverUrl ? (
                                <img className={styles.coverImage} src={coverUrl} alt={title} />
                            ) : (
                                <div className={styles.coverPlaceholder}>📖</div>
                            )}
                        </div>
                        <div className={styles.metadataColumn}>
                            <Text size={500} weight="semibold">
                                {title}
                            </Text>
                            <Text size={300} style={{ color: tokens.colorNeutralForeground2 }}>
                                by {author}
                            </Text>

                            {narrators && (
                                <Text size={200} style={{ color: tokens.colorNeutralForeground2 }}>
                                    Narrated by {narrators}
                                </Text>
                            )}

                            {numTracks !== undefined && numTracks > 0 && (
                                <div className={styles.metaRow}>
                                    <Document20Regular className={styles.metaIcon} />
                                    <Text size={200} className={styles.metaText}>
                                        {numTracks} file{numTracks !== 1 ? 's' : ''}
                                    </Text>
                                </div>
                            )}

                            {numChapters !== undefined && numChapters > 0 && (
                                <div className={styles.metaRow}>
                                    <BookNumber20Regular className={styles.metaIcon} />
                                    <Text size={200} className={styles.metaText}>
                                        {numChapters} chapter{numChapters !== 1 ? 's' : ''}
                                    </Text>
                                </div>
                            )}

                            {duration !== undefined && duration > 0 && (
                                <div className={styles.metaRow}>
                                    <Clock20Regular className={styles.metaIcon} />
                                    <Text size={200} className={styles.metaText}>
                                        {formatDuration(duration)}
                                    </Text>
                                </div>
                            )}

                            {publishedYear && (
                                <div className={styles.metaRow}>
                                    <Calendar20Regular className={styles.metaIcon} />
                                    <Text size={200} className={styles.metaText}>
                                        {publishedYear}
                                    </Text>
                                </div>
                            )}

                            {description && (
                                <div
                                    className={styles.description}
                                    // eslint-disable-next-line react/no-danger
                                    dangerouslySetInnerHTML={{ __html: description }}
                                />
                            )}

                            {bookmarks.length > 0 && (
                                <div className={styles.bookmarksSection}>
                                    <Text
                                        size={200}
                                        weight="semibold"
                                        block
                                        style={{ marginBottom: '4px' }}
                                    >
                                        <Bookmark20Regular /> Bookmarks
                                    </Text>
                                    {bookmarks.map((bm) => (
                                        <div
                                            key={`${bm.time}-${bm.createdAt}`}
                                            className={styles.bookmarkItem}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => {
                                                playback.seekTo(bm.time)
                                                onOpenChange({} as any, { open: false })
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    playback.seekTo(bm.time)
                                                    onOpenChange({} as any, { open: false })
                                                }
                                            }}
                                        >
                                            <Text className={styles.bookmarkTime}>
                                                {formatTime(bm.time)}
                                            </Text>
                                            <Text
                                                className={styles.bookmarkTitle}
                                                size={200}
                                                truncate
                                            >
                                                {bm.title}
                                            </Text>
                                            <Button
                                                appearance="subtle"
                                                className={styles.bookmarkDelete}
                                                icon={<Dismiss20Regular />}
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteBookmark(bm.time)
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogBody>
                <DialogActions>
                    <Button
                        appearance="primary"
                        icon={<Play20Filled />}
                        onClick={() => {
                            playback.playItem(item)
                            onOpenChange({} as any, { open: false })
                        }}
                    >
                        Play
                    </Button>
                    <Button
                        appearance="secondary"
                        className={styles.matchButton}
                        icon={matching ? <Spinner size="tiny" /> : <Search20Regular />}
                        disabled={matching}
                        onClick={handleMatch}
                    >
                        {matching ? 'Matching...' : 'Match Metadata'}
                    </Button>
                    <Button
                        appearance="secondary"
                        onClick={() => onOpenChange({} as any, { open: false })}
                    >
                        Close
                    </Button>
                </DialogActions>
            </DialogSurface>
        </Dialog>
    )
}

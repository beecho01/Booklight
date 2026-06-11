import { Badge, makeStyles, Tab, TabList, Text, tokens } from '@fluentui/react-components'
import {
    BookNumber20Regular,
    Calendar20Regular,
    Clock20Regular,
    Document20Regular,
    LocalLanguage20Filled,
    MusicNote220Regular as MusicNoteIcon,
} from '@fluentui/react-icons'
import { useState } from 'react'
import { usePlayback } from '../context/PlaybackContext'
import { borderRadiusLarge, borderRadiusMedium } from '../theme'
import { formatDuration, formatTime } from '../utils/formatTime'

const useStyles = makeStyles({
    page: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: tokens.spacingHorizontalXL,
        padding: tokens.spacingHorizontalXXL,
        height: '100%',
        overflow: 'hidden',
    },
    noPlayback: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: tokens.spacingVerticalM,
        color: tokens.colorNeutralForeground3,
        gridColumn: '1 / 3',
    },

    // ── Left Column: Player ──
    playerColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacingVerticalL,
        padding: tokens.spacingVerticalXL,
    },
    coverArt: {
        width: '280px',
        height: '280px',
        objectFit: 'cover',
        borderRadius: borderRadiusLarge,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
    },
    coverPlaceholder: {
        width: '280px',
        height: '280px',
        borderRadius: borderRadiusLarge,
        backgroundColor: tokens.colorNeutralBackground3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '80px',
    },
    trackInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: tokens.spacingVerticalXS,
        maxWidth: '320px',
        textAlign: 'center',
    },
    title: {
        lineHeight: '1.2',
    },
    author: {
        color: tokens.colorNeutralForeground2,
    },
    narrator: {
        color: tokens.colorNeutralForeground3,
        fontSize: '12px',
    },

    // Progress
    progressSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
        width: '100%',
        maxWidth: '320px',
    },
    timeRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: tokens.colorNeutralForeground3,
    },

    // Transport controls
    transportRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacingHorizontalS,
    },
    transportButton: {
        minWidth: '44px',
        minHeight: '44px',
        borderRadius: '44px',
    },
    playButton: {
        minWidth: '52px',
        minHeight: '52px',
        borderRadius: '52px',
    },

    // ── Right Column: Queue / Details ──
    rightColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        overflow: 'hidden',
        minHeight: 0,
    },
    tabContent: {
        flex: 1,
        overflowY: 'auto',
        minHeight: 0,
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: borderRadiusMedium,
        padding: tokens.spacingHorizontalS,
    },

    // Chapter list items
    chapterItem: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        borderRadius: '4px',
        cursor: 'pointer',
        border: 'none',
        background: 'none',
        font: 'inherit',
        textAlign: 'left',
        width: '100%',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground3,
        },
    },
    chapterItemActive: {
        backgroundColor: tokens.colorNeutralBackground3,
        borderLeft: `3px solid ${tokens.colorBrandForeground1}`,
        paddingLeft: tokens.spacingHorizontalS,
    },
    chapterTitle: {
        fontSize: '13px',
        color: tokens.colorNeutralForeground1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    chapterDuration: {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: tokens.colorNeutralForeground3,
        flexShrink: 0,
    },

    // Details tab
    detailRow: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        fontSize: '13px',
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    },
    metaIcon: {
        fontSize: '14px',
        color: tokens.colorNeutralForeground3,
    },
    detailLabel: {
        color: tokens.colorNeutralForeground3,
        minWidth: '80px',
    },
    detailValue: {
        color: tokens.colorNeutralForeground1,
    },
    tagsRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
    },
    description: {
        color: tokens.colorNeutralForeground2,
        fontSize: '13px',
        lineHeight: '1.5',
        padding: tokens.spacingHorizontalS,
        maxHeight: '300px',
        overflowY: 'auto',
    },
})

type RightTab = 'chapters' | 'details'

export default function NowPlayingPage() {
    const styles = useStyles()
    const playback = usePlayback()
    const [activeTab, setActiveTab] = useState<RightTab>('chapters')

    if (!playback.currentItem) {
        return (
            <div className={styles.noPlayback}>
                <Text size={600} weight="semibold">
                    Now Playing
                </Text>
                <Text>No audiobook playing</Text>
            </div>
        )
    }

    const { currentItem, currentChapter, chapters, duration } = playback
    const serverUrl = localStorage.getItem('booklight_server_url') || ''
    const metadata = currentItem.media?.metadata
    const title = metadata?.title || 'Unknown'
    const author = metadata?.authors?.map((a) => a.name).join(', ') || 'Unknown'
    const narrators = metadata?.narrators?.join(', ')
    const coverUrl = currentItem.media?.coverPath
        ? `${serverUrl}/api/items/${currentItem.id}/cover`
        : null
    const currentChapterIndex = chapters.findIndex((ch) => ch.id === currentChapter?.id)
    const totalDuration = currentItem.media?.duration ?? duration

    return (
        <div className={styles.page}>
            {/* ── Left Column: Player ── */}
            <div className={styles.playerColumn}>
                {coverUrl ? (
                    <img className={styles.coverArt} src={coverUrl} alt={title} />
                ) : (
                    <div className={styles.coverPlaceholder}>📖</div>
                )}

                <div className={styles.trackInfo}>
                    <Text size={600} weight="semibold" className={styles.title}>
                        {title}
                    </Text>
                    <Text size={300} className={styles.author}>
                        by {author}
                    </Text>
                    {narrators && <Text className={styles.narrator}>Narrated by {narrators}</Text>}
                </div>
            </div>

            {/* ── Right Column: Chapters / Details tabs ── */}
            <div className={styles.rightColumn}>
                <TabList
                    selectedValue={activeTab}
                    onTabSelect={(_, data) => setActiveTab(data.value as RightTab)}
                >
                    <Tab value="chapters" icon={<MusicNoteIcon />}>
                        Chapters
                    </Tab>
                    <Tab value="details" icon={<Document20Regular />}>
                        Details
                    </Tab>
                </TabList>

                <div className={styles.tabContent}>
                    {activeTab === 'chapters' && (
                        <div>
                            {chapters.length > 0 ? (
                                chapters.map((chapter, index) => {
                                    const chapterDuration = chapter.end - chapter.start
                                    const isActive = index === currentChapterIndex
                                    return (
                                        <button
                                            type="button"
                                            key={chapter.id}
                                            className={`${styles.chapterItem} ${isActive ? styles.chapterItemActive : ''}`}
                                            onClick={() => playback.seekToChapter(chapter)}
                                        >
                                            <Text className={styles.chapterTitle}>
                                                {chapter.title}
                                            </Text>
                                            <Text className={styles.chapterDuration}>
                                                {formatTime(chapterDuration)}
                                            </Text>
                                        </button>
                                    )
                                })
                            ) : (
                                <Text>No chapters available</Text>
                            )}
                        </div>
                    )}

                    {activeTab === 'details' && (
                        <>
                            {metadata?.publishedYear && (
                                <div className={styles.detailRow}>
                                    <Calendar20Regular className={styles.metaIcon} />
                                    <Text className={styles.detailLabel}>Published</Text>
                                    <Text className={styles.detailValue}>
                                        {metadata.publishedYear}
                                    </Text>
                                </div>
                            )}
                            {metadata?.publisher && (
                                <div className={styles.detailRow}>
                                    <Document20Regular className={styles.metaIcon} />
                                    <Text className={styles.detailLabel}>Publisher</Text>
                                    <Text className={styles.detailValue}>{metadata.publisher}</Text>
                                </div>
                            )}
                            <div className={styles.detailRow}>
                                <Clock20Regular className={styles.metaIcon} />
                                <Text className={styles.detailLabel}>Duration</Text>
                                <Text className={styles.detailValue}>
                                    {formatDuration(totalDuration)}
                                </Text>
                            </div>
                            <div className={styles.detailRow}>
                                <BookNumber20Regular className={styles.metaIcon} />
                                <Text className={styles.detailLabel}>Chapters</Text>
                                <Text className={styles.detailValue}>{chapters.length}</Text>
                            </div>
                            {currentItem.media?.numAudioFiles && (
                                <div className={styles.detailRow}>
                                    <Document20Regular className={styles.metaIcon} />
                                    <Text className={styles.detailLabel}>Files</Text>
                                    <Text className={styles.detailValue}>
                                        {currentItem.media.numAudioFiles} audio file
                                        {currentItem.media.numAudioFiles !== 1 ? 's' : ''}
                                    </Text>
                                </div>
                            )}
                            {metadata?.language && (
                                <div className={styles.detailRow}>
                                    <LocalLanguage20Filled className={styles.metaIcon} />
                                    <Text className={styles.detailLabel}>Language</Text>
                                    <Text className={styles.detailValue}>{metadata.language}</Text>
                                </div>
                            )}

                            {(metadata?.genres?.length || 0) + (metadata?.tags?.length || 0) >
                                0 && (
                                <div className={styles.tagsRow}>
                                    {metadata?.genres?.map((genre) => (
                                        <Badge
                                            key={genre}
                                            appearance="filled"
                                            color="informative"
                                            size="small"
                                        >
                                            {genre}
                                        </Badge>
                                    ))}
                                    {metadata?.tags?.map((tag) => (
                                        <Badge key={tag} appearance="ghost" size="small">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {metadata?.description && (
                                <div>
                                    <Text
                                        size={300}
                                        weight="semibold"
                                        style={{ padding: tokens.spacingHorizontalS }}
                                    >
                                        Description
                                    </Text>
                                    <div
                                        className={styles.description}
                                        // eslint-disable-next-line react/no-danger
                                        dangerouslySetInnerHTML={{ __html: metadata.description }}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

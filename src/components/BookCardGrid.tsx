import { Button, Card, makeStyles, Text, tokens } from '@fluentui/react-components'
import { Checkmark20Filled, Play20Filled } from '@fluentui/react-icons'
import { usePlayback } from '../context/PlaybackContext'
import { borderRadiusMedium, cardHoverShadow, cardShadow, transitions } from '../theme'
import type { LibraryItemExpanded } from '../types/audiobook'
import { formatDuration } from '../utils/formatTime'

const useStyles = makeStyles({
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: tokens.spacingHorizontalXL,
    },
    bookCard: {
        borderRadius: borderRadiusMedium,
        boxShadow: cardShadow,
        transition: transitions.cardHover,
        cursor: 'pointer',
        ':hover': {
            boxShadow: cardHoverShadow,
            transform: 'translateY(-2px)',
        },
    },
    coverWrapper: {
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        overflow: 'hidden',
        borderRadius: `${borderRadiusMedium}`,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    coverPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: tokens.colorNeutralBackground3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
    },
    progressRingContainer: {
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressRingSvg: {
        position: 'absolute',
        inset: '0',
        width: '40px',
        height: '40px',
        transform: 'rotate(-90deg)',
    },
    progressRingTrack: {
        fill: 'none',
        stroke: 'rgba(255, 255, 255, 0.3)',
        strokeWidth: '3',
    },
    progressRingFill: {
        fill: 'none',
        stroke: tokens.colorBrandBackground,
        strokeWidth: '3',
        strokeLinecap: 'round',
        transition: 'stroke-dashoffset 0.3s ease',
    },
    progressRingBg: {
        position: 'absolute',
        inset: '0',
        borderRadius: '50%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    progressRingLabel: {
        position: 'relative',
        zIndex: 1,
        color: '#FFFFFF',
        fontSize: '9px',
        fontWeight: '600',
        lineHeight: '1',
        fontFamily: 'system-ui',
    },
    finishedBadge: {
        position: 'absolute',
        bottom: '8px',
        right: '8px',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: tokens.colorPaletteGreenBackground1,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '600',
    },
    playOverlay: {
        position: 'absolute',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        opacity: '0',
        transition: 'opacity 0.2s ease',
        selectors: {
            '.bookCard:hover &': {
                opacity: '1',
            },
        },
    },
    playButton: {
        borderRadius: '50%',
        minWidth: '44px',
        height: '44px',
        backgroundColor: tokens.colorBrandBackground,
        color: '#FFFFFF',
        selectors: {
            ':hover': {
                backgroundColor: tokens.colorBrandBackground2,
            },
        },
    },
    cardBody: {
        padding: tokens.spacingHorizontalS,
    },
    title: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
    author: {
        color: tokens.colorNeutralForeground2,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },
})

interface BookCardGridProps {
    items: LibraryItemExpanded[]
    onItemClick: (item: LibraryItemExpanded) => void
    zoomLevel?: 'small' | 'medium' | 'large'
}

interface BookCardProps {
    item: LibraryItemExpanded
    onClick: () => void
}

function BookCard({ item, onClick }: BookCardProps) {
    const styles = useStyles()
    const playback = usePlayback()
    const serverUrl = localStorage.getItem('booklight_server_url') || ''
    const title = item.media?.metadata?.title || 'Unknown'
    const author =
        item.media?.metadata?.authors?.map((a) => a.name).join(', ') ||
        item.media?.metadata?.authorName ||
        item.media?.authorName ||
        'Unknown'
    const progress = item.userMediaProgress
    const coverUrl = item.media?.coverPath ? `${serverUrl}/api/items/${item.id}/cover` : null

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation()
        playback.playItem(item)
    }

    // Circular progress ring calculations
    const radius = 15
    const circumference = 2 * Math.PI * radius
    const dashOffset = progress ? circumference * (1 - progress.progress) : circumference
    const progressPercent = progress ? Math.round(progress.progress * 100) : 0

    return (
        <Card
            className={styles.bookCard}
            onClick={onClick}
            appearance="filled-alternative"
            size="small"
        >
            <div className={styles.coverWrapper}>
                {coverUrl ? (
                    <img className={styles.coverImage} src={coverUrl} alt={title} loading="lazy" />
                ) : (
                    <div className={styles.coverPlaceholder}>📖</div>
                )}
                <div className={styles.playOverlay}>
                    <Button
                        className={styles.playButton}
                        shape="circular"
                        appearance="primary"
                        size="large"
                        icon={<Play20Filled />}
                        onClick={handlePlay}
                    />
                </div>
                {progress && !progress.isFinished && progress.progress > 0 && (
                    <div className={styles.progressRingContainer}>
                        <div className={styles.progressRingBg} />
                        <svg className={styles.progressRingSvg} viewBox="0 0 40 40">
                            <circle
                                className={styles.progressRingTrack}
                                cx="20"
                                cy="20"
                                r={radius}
                            />
                            <circle
                                className={styles.progressRingFill}
                                cx="20"
                                cy="20"
                                r={radius}
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                            />
                        </svg>
                        <span className={styles.progressRingLabel}>{progressPercent}%</span>
                    </div>
                )}
                {progress?.isFinished && (
                    <div className={styles.finishedBadge}>
                        <Checkmark20Filled />
                    </div>
                )}
            </div>
            <div className={styles.cardBody}>
                <Text className={styles.title} size={300} weight="semibold" block>
                    {title}
                </Text>
                <Text className={styles.author} size={200} block>
                    {author}
                </Text>
                {item.media?.duration ? (
                    <Text size={100} block style={{ color: tokens.colorNeutralForeground3 }}>
                        {formatDuration(item.media.duration)}
                    </Text>
                ) : null}
            </div>
        </Card>
    )
}

export default function BookCardGrid({
    items,
    onItemClick,
    zoomLevel = 'medium',
}: BookCardGridProps) {
    const styles = useStyles()

    const sizeMap = { small: '120px', medium: '160px', large: '220px' }
    const gridSize = sizeMap[zoomLevel]

    return (
        <div
            className={styles.grid}
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${gridSize}, 1fr))` }}
        >
            {items.map((item) => (
                <BookCard key={item.id} item={item} onClick={() => onItemClick(item)} />
            ))}
        </div>
    )
}

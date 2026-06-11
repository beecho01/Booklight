import {
    Badge,
    Button,
    Card,
    CounterBadge,
    makeStyles,
    Text,
    tokens,
} from '@fluentui/react-components'
import { Play20Filled } from '@fluentui/react-icons'
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
        borderRadius: borderRadiusMedium,
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
    progressBadge: {
        position: 'absolute',
        bottom: tokens.spacingHorizontalS,
        right: tokens.spacingHorizontalS,
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

    return (
        <Card className={styles.bookCard} onClick={onClick} appearance="filled" size="small">
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
                    <div className={styles.progressBadge}>
                        <CounterBadge
                            count={Math.round(progress.progress * 100)}
                            size="small"
                            color="informative"
                        />
                    </div>
                )}
                {progress?.isFinished && (
                    <div className={styles.progressBadge}>
                        <Badge appearance="filled" color="success" size="small">
                            ✓
                        </Badge>
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

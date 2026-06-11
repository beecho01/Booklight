import {
    Button,
    makeStyles,
    Popover,
    PopoverSurface,
    PopoverTrigger,
    Slider,
    Text,
    tokens,
    Tooltip,
    useId,
} from '@fluentui/react-components'
import {
    Bookmark20Regular,
    MusicNote220Regular as MusicNoteIcon,
    Next20Regular,
    Pause20Filled,
    Play20Filled,
    Previous20Regular,
    SkipBack1520Regular,
    SkipForward3020Regular,
    Speaker220Regular,
    SpeakerMute20Regular,
} from '@fluentui/react-icons'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import * as meApi from '../api/me'
import { useAuth } from '../context/AuthContext'
import { usePlayback } from '../context/PlaybackContext'
import { borderRadiusLarge, nowPlayingShadow } from '../theme'
import { formatTime } from '../utils/formatTime'

const useStyles = makeStyles({
    nowPlayingBar: {
        backdropFilter: 'blur(20px) saturate(180%)',
        backgroundColor: tokens.colorNeutralBackgroundAlpha,
        borderRadius: borderRadiusLarge,
        boxShadow: nowPlayingShadow,
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalL}`,
        minHeight: '64px',
    },
    coverArt: {
        width: '48px',
        height: '48px',
        borderRadius: '6px',
        objectFit: 'cover',
        flexShrink: 0,
        backgroundColor: tokens.colorNeutralBackground3,
    },
    placeholder: {
        width: '48px',
        height: '48px',
        borderRadius: '6px',
        backgroundColor: tokens.colorNeutralBackground3,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        flex: '0 0 140px',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    controls: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        flexShrink: 0,
    },
    controlButton: {
        minWidth: '32px',
        minHeight: '32px',
        padding: '0',
        borderRadius: '32px',
    },
    playButton: {
        minWidth: '36px',
        minHeight: '36px',
        padding: '0',
        borderRadius: '36px',
    },
    progressArea: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        minWidth: 0,
    },
    timeLabel: {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: tokens.colorNeutralForeground3,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        minWidth: '36px',
    },
    utilityIcons: {
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        flexShrink: 0,
    },
    utilityButton: {
        minWidth: '28px',
        minHeight: '28px',
        padding: '0',
        borderRadius: '28px',
    },
    volumePopover: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: tokens.spacingVerticalXS,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    },
    volumeSlider: {
        writingMode: 'vertical-lr' as const,
        direction: 'rtl' as const,
        appearance: 'none' as const,
        width: '20px',
        height: '100px',
        background: tokens.colorNeutralBackground3,
        borderRadius: '4px',
        outline: 'none',
        cursor: 'pointer',
        // Track styling
        selectors: {
            '&::-webkit-slider-runnable-track': {
                background: 'transparent',
            },
            '&::-webkit-slider-thumb': {
                appearance: 'none' as const,
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: tokens.colorBrandForeground1,
                border: 'none',
                marginLeft: '-5px',
                cursor: 'pointer',
            },
            '&::-moz-range-track': {
                background: 'transparent',
            },
            '&::-moz-range-thumb': {
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: tokens.colorBrandForeground1,
                border: 'none',
                cursor: 'pointer',
            },
        },
    },
    volumeLabel: {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: tokens.colorNeutralForeground3,
    },
    noPlayback: {
        color: tokens.colorNeutralForeground3,
        textAlign: 'center' as const,
        width: '100%',
    },
    clickableBar: {
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground3,
        },
    },
})

export default function NowPlayingBar() {
    const styles = useStyles()
    const playback = usePlayback()
    const { serverUrl, token } = useAuth()
    const navigate = useNavigate()
    const id = useId()

    const handleBarClick = useCallback(
        (e: React.MouseEvent) => {
            // Only navigate if the click wasn't on a button, slider, or popover
            const target = e.target as HTMLElement
            if (
                target.closest('button') ||
                target.closest('[role="slider"]') ||
                target.closest('.fui-PopoverSurface')
            ) {
                return
            }
            navigate('/now-playing')
        },
        [navigate]
    )

    const handleBarKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate('/now-playing')
            }
        },
        [navigate]
    )

    const handleBookmark = useCallback(async () => {
        if (!serverUrl || !token || !playback.currentItem) return
        const title = `${formatTime(playback.currentTime)} - ${playback.currentItem.media?.metadata?.title || 'Bookmark'}`
        try {
            await meApi.createBookmark(
                serverUrl,
                token,
                playback.currentItem.id,
                playback.currentTime,
                title
            )
        } catch {
            // silently fail
        }
    }, [serverUrl, token, playback.currentItem, playback.currentTime])

    if (!playback.currentItem) {
        return null
    }

    const { currentItem, isPlaying, currentTime, duration } = playback
    const coverUrl = currentItem.media?.coverPath
        ? `${localStorage.getItem('booklight_server_url') || ''}/api/items/${currentItem.id}/cover`
        : undefined
    const title = currentItem.media?.metadata?.title || 'Unknown'
    const author =
        currentItem.media?.metadata?.authors?.map((a) => a.name).join(', ') ||
        currentItem.media?.metadata?.authorName ||
        currentItem.media?.authorName ||
        'Unknown'

    return (
        <div
            className={`${styles.nowPlayingBar} ${styles.clickableBar}`}
            onClick={handleBarClick}
            onKeyDown={handleBarKeyDown}
            role="button"
            tabIndex={0}
            aria-label="Open now playing view"
        >
            {coverUrl ? (
                <img className={styles.coverArt} src={coverUrl} alt={title} />
            ) : (
                <div className={styles.placeholder}>
                    <MusicNoteIcon />
                </div>
            )}

            <div className={styles.info}>
                <Text size={300} weight="semibold" truncate>
                    {title}
                </Text>
                <Text size={100} truncate style={{ color: tokens.colorNeutralForeground3 }}>
                    {author}
                </Text>
            </div>

            <div className={styles.controls}>
                <Button
                    appearance="subtle"
                    className={styles.controlButton}
                    icon={<Previous20Regular />}
                    onClick={playback.previousChapter}
                />
                <Button
                    appearance="primary"
                    className={styles.playButton}
                    icon={isPlaying ? <Pause20Filled /> : <Play20Filled />}
                    onClick={isPlaying ? playback.pause : playback.resume}
                />
                <Button
                    appearance="subtle"
                    className={styles.controlButton}
                    icon={<Next20Regular />}
                    onClick={playback.nextChapter}
                />
            </div>

            <div className={styles.progressArea}>
                <Text className={styles.timeLabel}>{formatTime(currentTime)}</Text>
                <Slider
                    size="small"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(_, data) => playback.seekTo(data.value)}
                    style={{ flex: 1 }}
                />
                <Text className={styles.timeLabel}>{formatTime(duration)}</Text>
            </div>

            <div className={styles.utilityIcons}>
                <Tooltip content="Bookmark" relationship="label">
                    <Button
                        appearance="subtle"
                        className={styles.utilityButton}
                        icon={<Bookmark20Regular />}
                        onClick={handleBookmark}
                    />
                </Tooltip>
                <Button
                    appearance="subtle"
                    className={styles.utilityButton}
                    icon={<SkipBack1520Regular />}
                    onClick={() => playback.skipBackward(15)}
                />
                <Button
                    appearance="subtle"
                    className={styles.utilityButton}
                    icon={<SkipForward3020Regular />}
                    onClick={() => playback.skipForward(30)}
                />
                <Popover>
                    <PopoverTrigger>
                        <Button
                            appearance="subtle"
                            className={styles.utilityButton}
                            icon={
                                playback.volume === 0 ? (
                                    <SpeakerMute20Regular />
                                ) : (
                                    <Speaker220Regular />
                                )
                            }
                        />
                    </PopoverTrigger>
                    <PopoverSurface>
                        <div className={styles.volumePopover}>
                            <Slider
                                size="small"
                                vertical
                                step={0.01}
                                min={0}
                                max={1}
                                id={id}
                                value={playback.volume}
                                onChange={(e) =>
                                    playback.setVolume(parseFloat(e.currentTarget.value))
                                }
                            />
                            <Text className={styles.volumeLabel}>
                                {Math.round(playback.volume * 100)}%
                            </Text>
                        </div>
                    </PopoverSurface>
                </Popover>
            </div>
        </div>
    )
}

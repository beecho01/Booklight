import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import * as itemsApi from '../api/items'
import * as sessionsApi from '../api/sessions'
import type { Chapter, LibraryItemExpanded, MediaProgress } from '../types'

interface PlaybackState {
    currentItem: LibraryItemExpanded | null
    currentChapter: Chapter | null
    chapters: Chapter[]
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    playbackSpeed: number
    progress: MediaProgress | null
}

interface PlaybackContextType extends PlaybackState {
    playItem: (item: LibraryItemExpanded) => void
    pause: () => void
    resume: () => void
    stop: () => void
    seekTo: (time: number) => void
    seekToChapter: (chapter: Chapter) => void
    skipForward: (seconds?: number) => void
    skipBackward: (seconds?: number) => void
    setVolume: (volume: number) => void
    setPlaybackSpeed: (speed: number) => void
    nextChapter: () => void
    previousChapter: () => void
}

const initialPlaybackState: PlaybackState = {
    currentItem: null,
    currentChapter: null,
    chapters: [],
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: parseFloat(localStorage.getItem('booklight_volume') || '1'),
    playbackSpeed: parseFloat(localStorage.getItem('booklight_playback_speed') || '1'),
    progress: null,
}

const PlaybackContext = createContext<PlaybackContextType | null>(null)

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<PlaybackState>(initialPlaybackState)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const sessionIdRef = useRef<string | null>(null)
    const pendingSeekRef = useRef<number | null>(null)

    // Helper: close the current session and sync final progress
    const closeCurrentSession = useCallback((currentTime?: number, duration?: number) => {
        const sid = sessionIdRef.current
        if (!sid) return
        const serverUrl = localStorage.getItem('booklight_server_url') || ''
        const token = localStorage.getItem('booklight_token') || ''
        const audio = audioRef.current
        const ct = currentTime ?? audio?.currentTime ?? 0
        const dur = duration ?? audio?.duration ?? 0
        sessionsApi.closeSession(serverUrl, token, sid, ct, dur).catch(() => {})
        sessionIdRef.current = null
        if (syncIntervalRef.current) {
            clearInterval(syncIntervalRef.current)
            syncIntervalRef.current = null
        }
    }, [])

    // Create audio element once
    useEffect(() => {
        const audio = new Audio()
        audioRef.current = audio

        // Apply saved volume and playback speed
        const savedVolume = parseFloat(localStorage.getItem('booklight_volume') || '1')
        const savedSpeed = parseFloat(localStorage.getItem('booklight_playback_speed') || '1')
        audio.volume = savedVolume
        audio.playbackRate = savedSpeed

        audio.addEventListener('timeupdate', () => {
            setState((prev) => {
                const newChapter =
                    prev.chapters.find(
                        (ch) => audio.currentTime >= ch.start && audio.currentTime < ch.end
                    ) || prev.currentChapter
                return { ...prev, currentTime: audio.currentTime, currentChapter: newChapter }
            })
        })

        audio.addEventListener('loadedmetadata', () => {
            setState((prev) => ({ ...prev, duration: audio.duration || prev.duration }))
            // Seek to the desired start time once the audio is loaded
            if (pendingSeekRef.current !== null && pendingSeekRef.current > 0) {
                audio.currentTime = pendingSeekRef.current
                pendingSeekRef.current = null
            }
        })

        audio.addEventListener('ended', () => {
            // Close session and sync final progress when playback ends
            const sid = sessionIdRef.current
            if (sid) {
                const serverUrl = localStorage.getItem('booklight_server_url') || ''
                const token = localStorage.getItem('booklight_token') || ''
                sessionsApi
                    .closeSession(serverUrl, token, sid, audio.duration || 0, audio.duration || 0)
                    .catch(() => {})
                sessionIdRef.current = null
                if (syncIntervalRef.current) {
                    clearInterval(syncIntervalRef.current)
                    syncIntervalRef.current = null
                }
            }
            setState((prev) => ({ ...prev, isPlaying: false }))
        })

        audio.addEventListener('play', () => {
            setState((prev) => ({ ...prev, isPlaying: true }))
        })

        audio.addEventListener('pause', () => {
            setState((prev) => ({ ...prev, isPlaying: false }))
        })

        // Close session on window unload to sync final progress
        const handleBeforeUnload = () => {
            const sid = sessionIdRef.current
            if (sid) {
                const serverUrl = localStorage.getItem('booklight_server_url') || ''
                const token = localStorage.getItem('booklight_token') || ''
                const ct = audio.currentTime || 0
                const dur = audio.duration || 0
                // Use sendBeacon for synchronous send on unload
                const body = JSON.stringify({ currentTime: ct, duration: dur })
                navigator.sendBeacon(`${serverUrl}/api/sessions/${sid}/close?token=${token}`, body)
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload)
            audio.pause()
            audio.src = ''
            if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
        }
    }, [])

    // Sync progress to server periodically while playing
    const startSyncInterval = useCallback((serverUrl: string, token: string) => {
        if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
        syncIntervalRef.current = setInterval(() => {
            const audio = audioRef.current
            if (!audio || audio.paused) return
            const sid = sessionIdRef.current
            if (sid) {
                sessionsApi
                    .syncSession(serverUrl, token, sid, audio.currentTime, audio.duration || 0)
                    .catch(() => {})
            }
        }, 10000) // sync every 10s
    }, [])

    const playItem = useCallback(
        (item: LibraryItemExpanded) => {
            const audio = audioRef.current
            if (!audio) return

            const serverUrl = localStorage.getItem('booklight_server_url') || ''
            const token = localStorage.getItem('booklight_token') || ''
            const chapters = item.media?.chapters || []
            const currentChapter = chapters[0] || null

            // Close any existing session before starting a new one
            closeCurrentSession()

            // First, start a playback session on the server to get audioTracks with stream URLs
            itemsApi
                .startPlayback(serverUrl, token, item.id)
                .then((session) => {
                    sessionIdRef.current = session.id
                    startSyncInterval(serverUrl, token)

                    // Use the session's currentTime as the resume position
                    // The server knows where the user left off
                    const startTime =
                        session.currentTime || item.userMediaProgress?.currentTime || 0

                    // Set the pending seek so loadedmetadata handler can apply it
                    pendingSeekRef.current = startTime > 0 ? startTime : null

                    // Determine the streaming URL from the session's audioTracks
                    // For direct play: contentUrl is /api/items/{id}/file/{index} which needs auth headers
                    // The HTML5 Audio element can't set headers, so we use the public session track endpoint
                    // For transcode (HLS): contentUrl starts with /hls/... which is already public
                    const firstTrack = session.audioTracks?.[0]
                    let streamUrl: string

                    if (firstTrack?.contentUrl && firstTrack.contentUrl.startsWith('/hls')) {
                        // HLS transcode stream — already a public URL
                        streamUrl = `${serverUrl}${firstTrack.contentUrl}`
                    } else {
                        // Direct play — use the public session track endpoint
                        // This is a public route that works while the session is open (no auth needed)
                        const trackIndex = firstTrack?.index ?? 0
                        streamUrl = `${serverUrl}/public/session/${session.id}/track/${trackIndex}`
                    }

                    audio.src = streamUrl
                    audio.play().catch(() => {
                        /* playback failed */
                    })

                    // Find the chapter matching the start time
                    const resumeChapter =
                        chapters.find((ch) => startTime >= ch.start && startTime < ch.end) ||
                        currentChapter

                    setState((prev) => ({
                        ...prev,
                        currentItem: item,
                        chapters,
                        currentChapter: resumeChapter,
                        isPlaying: true,
                        currentTime: startTime,
                        duration: session.duration || item.media?.duration || 0,
                        progress: item.userMediaProgress || null,
                    }))
                })
                .catch(() => {
                    // Failed to start playback session
                })
        },
        [startSyncInterval, closeCurrentSession]
    )

    const pause = useCallback(() => {
        const audio = audioRef.current
        if (audio) {
            audio.pause()
            // Sync progress when pausing
            const sid = sessionIdRef.current
            if (sid) {
                const serverUrl = localStorage.getItem('booklight_server_url') || ''
                const token = localStorage.getItem('booklight_token') || ''
                sessionsApi
                    .syncSession(serverUrl, token, sid, audio.currentTime, audio.duration || 0)
                    .catch(() => {})
            }
        }
    }, [])

    const resume = useCallback(() => {
        const audio = audioRef.current
        if (audio)
            audio.play().catch(() => {
                /* resume failed */
            })
    }, [])

    const stop = useCallback(() => {
        const audio = audioRef.current
        if (audio) {
            audio.pause()
            audio.src = ''
        }
        closeCurrentSession()
        setState(initialPlaybackState)
    }, [closeCurrentSession])

    const seekTo = useCallback((time: number) => {
        const audio = audioRef.current
        if (audio) {
            audio.currentTime = time
            setState((prev) => {
                const newChapter =
                    prev.chapters.find((ch) => time >= ch.start && time < ch.end) ||
                    prev.currentChapter
                return { ...prev, currentTime: time, currentChapter: newChapter }
            })
        }
    }, [])

    const seekToChapter = useCallback((chapter: Chapter) => {
        const audio = audioRef.current
        if (audio) {
            audio.currentTime = chapter.start
            setState((prev) => ({ ...prev, currentChapter: chapter, currentTime: chapter.start }))
        }
    }, [])

    const skipForward = useCallback((seconds = 30) => {
        const audio = audioRef.current
        if (audio) {
            audio.currentTime = Math.min(audio.currentTime + seconds, audio.duration || 0)
        }
    }, [])

    const skipBackward = useCallback((seconds = 30) => {
        const audio = audioRef.current
        if (audio) {
            audio.currentTime = Math.max(audio.currentTime - seconds, 0)
        }
    }, [])

    const setVolume = useCallback((volume: number) => {
        const audio = audioRef.current
        if (audio) audio.volume = volume
        localStorage.setItem('booklight_volume', String(volume))
        setState((prev) => ({ ...prev, volume }))
    }, [])

    const setPlaybackSpeed = useCallback((speed: number) => {
        const audio = audioRef.current
        if (audio) audio.playbackRate = speed
        localStorage.setItem('booklight_playback_speed', String(speed))
        setState((prev) => ({ ...prev, playbackSpeed: speed }))
    }, [])

    const nextChapter = useCallback(() => {
        setState((prev) => {
            if (!prev.currentChapter || !prev.chapters.length) return prev
            const idx = prev.chapters.findIndex((ch) => ch.id === prev.currentChapter!.id)
            if (idx < prev.chapters.length - 1) {
                const next = prev.chapters[idx + 1]
                const audio = audioRef.current
                if (audio) audio.currentTime = next.start
                return { ...prev, currentChapter: next, currentTime: next.start }
            }
            return prev
        })
    }, [])

    const previousChapter = useCallback(() => {
        setState((prev) => {
            if (!prev.currentChapter || !prev.chapters.length) return prev
            const idx = prev.chapters.findIndex((ch) => ch.id === prev.currentChapter!.id)
            if (idx > 0) {
                const prevCh = prev.chapters[idx - 1]
                const audio = audioRef.current
                if (audio) audio.currentTime = prevCh.start
                return { ...prev, currentChapter: prevCh, currentTime: prevCh.start }
            }
            const audio = audioRef.current
            if (audio) audio.currentTime = 0
            return { ...prev, currentTime: 0 }
        })
    }, [])

    const contextValue = useMemo(
        () => ({
            ...state,
            playItem,
            pause,
            resume,
            stop,
            seekTo,
            seekToChapter,
            skipForward,
            skipBackward,
            setVolume,
            setPlaybackSpeed,
            nextChapter,
            previousChapter,
        }),
        [
            state,
            playItem,
            pause,
            resume,
            stop,
            seekTo,
            seekToChapter,
            skipForward,
            skipBackward,
            setVolume,
            setPlaybackSpeed,
            nextChapter,
            previousChapter,
        ]
    )

    return <PlaybackContext.Provider value={contextValue}>{children}</PlaybackContext.Provider>
}

export function usePlayback(): PlaybackContextType {
    const context = useContext(PlaybackContext)
    if (!context) {
        throw new Error('usePlayback must be used within a PlaybackProvider')
    }
    return context
}

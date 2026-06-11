import {
    Button,
    Card,
    CardHeader,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    Field,
    Input,
    makeStyles,
    Text,
    tokens,
    Tooltip,
} from '@fluentui/react-components'
import {
    Add20Regular,
    Delete20Regular,
    Folder20Regular,
    MusicNote220Regular,
} from '@fluentui/react-icons'
import { useCallback, useEffect, useState } from 'react'
import * as collectionsApi from '../api/collections'
import * as playlistsApi from '../api/playlists'
import { useAuth } from '../context/AuthContext'

import { borderRadiusMedium, cardHoverShadow, cardShadow } from '../theme'
import type { Collection, Playlist } from '../types/collection'

const useStyles = makeStyles({
    page: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: tokens.spacingHorizontalXL,
    },
    card: {
        borderRadius: borderRadiusMedium,
        boxShadow: cardShadow,
        transition: 'box-shadow 0.2s ease, transform 0.15s ease',
        cursor: 'pointer',
        ':hover': {
            boxShadow: cardHoverShadow,
            transform: 'translateY(-2px)',
        },
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    cardIcon: {
        color: tokens.colorBrandForeground1,
        fontSize: '20px',
    },
    cardCount: {
        color: tokens.colorNeutralForeground3,
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: tokens.spacingVerticalS,
        padding: tokens.spacingVerticalXXL,
        color: tokens.colorNeutralForeground3,
    },
    dialogField: {
        marginBottom: tokens.spacingVerticalM,
    },
    error: {
        color: tokens.colorPaletteRedForeground1,
        padding: tokens.spacingHorizontalM,
    },
})

export default function CollectionsPage() {
    const styles = useStyles()
    const { serverUrl, token, isAuthenticated } = useAuth()
    const [collections, setCollections] = useState<Collection[]>([])
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createType, setCreateType] = useState<'collection' | 'playlist'>('collection')
    const [newName, setNewName] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [creating, setCreating] = useState(false)

    const loadData = useCallback(async () => {
        if (!serverUrl || !token) return
        setLoading(true)
        setError(null)
        try {
            const [cols, pls] = await Promise.all([
                collectionsApi.getCollections(serverUrl, token).catch(() => []),
                playlistsApi.getPlaylists(serverUrl, token).catch(() => []),
            ])
            setCollections(cols)
            setPlaylists(pls)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load collections')
        } finally {
            setLoading(false)
        }
    }, [serverUrl, token])

    useEffect(() => {
        if (isAuthenticated) {
            loadData()
        }
    }, [isAuthenticated, loadData])

    const handleCreate = async () => {
        if (!serverUrl || !token || !newName.trim()) return
        setCreating(true)
        try {
            if (createType === 'collection') {
                await collectionsApi.createCollection(
                    serverUrl,
                    token,
                    'default',
                    newName.trim(),
                    [],
                    newDescription.trim() || undefined
                )
            } else {
                await playlistsApi.createPlaylist(
                    serverUrl,
                    token,
                    'default',
                    newName.trim(),
                    [],
                    newDescription.trim() || undefined
                )
            }
            setShowCreateDialog(false)
            setNewName('')
            setNewDescription('')
            await loadData()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create')
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteCollection = async (id: string) => {
        if (!serverUrl || !token) return
        try {
            await collectionsApi.deleteCollection(serverUrl, token, id)
            setCollections((prev) => prev.filter((c) => c.id !== id))
        } catch {
            // silently fail
        }
    }

    const handleDeletePlaylist = async (id: string) => {
        if (!serverUrl || !token) return
        try {
            await playlistsApi.deletePlaylist(serverUrl, token, id)
            setPlaylists((prev) => prev.filter((p) => p.id !== id))
        } catch {
            // silently fail
        }
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.page}>
                <Text size={600} weight="semibold">
                    Collections
                </Text>
                <Text>Please connect to your Audiobookshelf server in Settings.</Text>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.sectionHeader}>
                <Text size={600} weight="semibold">
                    Collections
                </Text>
                <Tooltip content="New Collection" relationship="label">
                    <Button
                        appearance="subtle"
                        icon={<Add20Regular />}
                        onClick={() => {
                            setCreateType('collection')
                            setShowCreateDialog(true)
                        }}
                    >
                        New Collection
                    </Button>
                </Tooltip>
            </div>

            {error && (
                <div className={styles.error}>
                    <Text>{error}</Text>
                </div>
            )}

            {(() => {
                if (loading) return <Text>Loading collections...</Text>
                if (collections.length === 0) {
                    return (
                        <div className={styles.emptyState}>
                            <Folder20Regular style={{ fontSize: '32px' }} />
                            <Text>No collections yet</Text>
                            <Text size={200}>Create a collection to organize your audiobooks.</Text>
                        </div>
                    )
                }
                return (
                    <div className={styles.grid}>
                        {collections.map((col) => (
                            <Card key={col.id} className={styles.card}>
                                <CardHeader
                                    image={<Folder20Regular className={styles.cardIcon} />}
                                    header={
                                        <Text size={300} weight="semibold" truncate>
                                            {col.name}
                                        </Text>
                                    }
                                    description={
                                        <Text className={styles.cardCount} size={200}>
                                            {col.books.length} book
                                            {col.books.length !== 1 ? 's' : ''}
                                        </Text>
                                    }
                                    action={
                                        <Tooltip content="Delete" relationship="label">
                                            <Button
                                                appearance="subtle"
                                                size="small"
                                                icon={<Delete20Regular />}
                                                onClick={() => handleDeleteCollection(col.id)}
                                            />
                                        </Tooltip>
                                    }
                                />
                            </Card>
                        ))}
                    </div>
                )
            })()}

            <div className={styles.sectionHeader} style={{ marginTop: tokens.spacingVerticalL }}>
                <Text size={500} weight="semibold">
                    Playlists
                </Text>
                <Tooltip content="New Playlist" relationship="label">
                    <Button
                        appearance="subtle"
                        icon={<Add20Regular />}
                        onClick={() => {
                            setCreateType('playlist')
                            setShowCreateDialog(true)
                        }}
                    >
                        New Playlist
                    </Button>
                </Tooltip>
            </div>

            {(() => {
                if (loading) return <Text>Loading playlists...</Text>
                if (playlists.length === 0) {
                    return (
                        <div className={styles.emptyState}>
                            <MusicNote220Regular style={{ fontSize: '32px' }} />
                            <Text>No playlists yet</Text>
                            <Text size={200}>Create a playlist to queue up your listening.</Text>
                        </div>
                    )
                }
                return (
                    <div className={styles.grid}>
                        {playlists.map((pl) => (
                            <Card key={pl.id} className={styles.card}>
                                <CardHeader
                                    image={<MusicNote220Regular className={styles.cardIcon} />}
                                    header={
                                        <Text size={300} weight="semibold" truncate>
                                            {pl.name}
                                        </Text>
                                    }
                                    description={
                                        <Text className={styles.cardCount} size={200}>
                                            {pl.items.length} item{pl.items.length !== 1 ? 's' : ''}
                                        </Text>
                                    }
                                    action={
                                        <Tooltip content="Delete" relationship="label">
                                            <Button
                                                appearance="subtle"
                                                size="small"
                                                icon={<Delete20Regular />}
                                                onClick={() => handleDeletePlaylist(pl.id)}
                                            />
                                        </Tooltip>
                                    }
                                />
                            </Card>
                        ))}
                    </div>
                )
            })()}

            {/* Create Dialog */}
            <Dialog
                open={showCreateDialog}
                onOpenChange={(_, data) => setShowCreateDialog(data.open)}
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>
                            New {createType === 'collection' ? 'Collection' : 'Playlist'}
                        </DialogTitle>
                        <DialogContent>
                            <Field label="Name" className={styles.dialogField}>
                                <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.currentTarget.value)}
                                    placeholder={`Enter ${createType} name...`}
                                />
                            </Field>
                            <Field label="Description (optional)" className={styles.dialogField}>
                                <Input
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.currentTarget.value)}
                                    placeholder="Enter description..."
                                />
                            </Field>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                appearance="primary"
                                disabled={!newName.trim() || creating}
                                onClick={handleCreate}
                            >
                                {creating ? 'Creating...' : 'Create'}
                            </Button>
                            <Button
                                appearance="secondary"
                                onClick={() => setShowCreateDialog(false)}
                            >
                                Cancel
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    )
}

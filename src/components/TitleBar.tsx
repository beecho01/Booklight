import { Button, makeStyles, Text, tokens } from '@fluentui/react-components'
import { ArrowMinimize20Regular, Dismiss20Regular, Square20Regular } from '@fluentui/react-icons'
import { getCurrentWindow } from '@tauri-apps/api/window'

const useStyles = makeStyles({
    titlebar: {
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: tokens.spacingHorizontalL,
        paddingRight: tokens.spacingHorizontalS,
        backgroundColor: tokens.colorNeutralBackground2,
        userSelect: 'none',
        WebkitAppRegion: 'drag' as const,
    },
    titleText: {
        fontSize: '12px',
        fontWeight: 600,
        color: tokens.colorNeutralForeground2,
    },
    controls: {
        display: 'flex',
        WebkitAppRegion: 'no-drag' as const,
    },
    controlButton: {
        minWidth: '46px',
        minHeight: '32px',
        padding: '0',
        borderRadius: '0',
        backgroundColor: 'transparent',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground4,
        },
    },
    closeButton: {
        minWidth: '46px',
        minHeight: '32px',
        padding: '0',
        borderRadius: '0',
        backgroundColor: 'transparent',
        ':hover': {
            backgroundColor: '#c42b1c',
        },
        ':hover .dismissIcon': {
            color: '#ffffff',
        },
    },
})

export default function TitleBar() {
    const styles = useStyles()

    const handleMinimize = () => {
        getCurrentWindow().minimize()
    }

    const handleMaximize = () => {
        getCurrentWindow().toggleMaximize()
    }

    const handleClose = () => {
        getCurrentWindow().close()
    }

    return (
        <div className={styles.titlebar} data-tauri-drag-region>
            <Text className={styles.titleText}>Booklight</Text>
            <div className={styles.controls}>
                <Button
                    appearance="subtle"
                    className={styles.controlButton}
                    icon={<ArrowMinimize20Regular />}
                    onClick={handleMinimize}
                    aria-label="Minimize"
                />
                <Button
                    appearance="subtle"
                    className={styles.controlButton}
                    icon={<Square20Regular />}
                    onClick={handleMaximize}
                    aria-label="Maximize"
                />
                <Button
                    appearance="subtle"
                    className={styles.closeButton}
                    icon={<Dismiss20Regular />}
                    onClick={handleClose}
                    aria-label="Close"
                />
            </div>
        </div>
    )
}

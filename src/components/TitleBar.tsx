import { Button, makeStyles, Text, tokens } from '@fluentui/react-components'
import { ArrowMinimize16Regular, Dismiss16Regular, Square16Regular } from '@fluentui/react-icons'
import { getCurrentWindow } from '@tauri-apps/api/window'

const useStyles = makeStyles({
    titlebar: {
        height: '48px',
        display: 'flex',
        alignItems: 'start',
        justifyContent: 'space-between',
        paddingLeft: tokens.spacingHorizontalL,
        paddingRight: 'none',
        // backgroundColor: tokens.colorNeutralBackground2,
        backgroundColor: 'transparent',
        userSelect: 'none',
        WebkitAppRegion: 'drag' as const,
    },
    titleText: {
        fontSize: '12px',
        fontWeight: 600,
        color: tokens.colorNeutralForeground2,
    },
    titleLogo: {
        width: '16px',
        height: '16px',
        objectFit: 'contain',
        flexShrink: 0,
    },
    titleLeft: {
        display: 'flex',
        alignItems: 'center',
        alignSelf: 'center',
        gap: tokens.spacingHorizontalM,
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
            backgroundColor: tokens.colorBrandForeground1,
            color: '#ffffff',
            '& svg': {
                color: '#ffffff',
                fill: 'currentColor',
            },
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
            color: '#ffffff',
            '& svg': {
                color: '#ffffff',
                fill: 'currentColor',
            },
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
            <div className={styles.titleLeft}>
                <img src="/Logo.png" alt="Booklight" className={styles.titleLogo} />
                <Text className={styles.titleText}>Booklight</Text>
            </div>
            <div className={styles.controls}>
                <Button
                    appearance="subtle"
                    className={styles.controlButton}
                    icon={<ArrowMinimize16Regular />}
                    onClick={handleMinimize}
                    aria-label="Minimize"
                />
                <Button
                    appearance="subtle"
                    className={styles.controlButton}
                    icon={<Square16Regular />}
                    onClick={handleMaximize}
                    aria-label="Maximize"
                />
                <Button
                    appearance="subtle"
                    className={styles.closeButton}
                    icon={<Dismiss16Regular />}
                    onClick={handleClose}
                    aria-label="Close"
                />
            </div>
        </div>
    )
}

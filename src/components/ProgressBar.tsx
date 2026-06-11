import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
    progressTrack: {
        width: '100%',
        height: '4px',
        borderRadius: '2px',
        backgroundColor: tokens.colorNeutralBackground3,
        overflow: 'hidden',
        position: 'relative' as const,
    },
    progressFill: {
        height: '100%',
        borderRadius: '2px',
        backgroundColor: tokens.colorBrandBackground,
        transition: 'width 0.3s ease',
    },
})

interface ProgressBarProps {
    value: number // 0 to 1
    className?: string
}

export default function ProgressBar({ value, className }: ProgressBarProps) {
    const styles = useStyles()
    const clampedValue = Math.max(0, Math.min(1, value))

    return (
        <div className={`${styles.progressTrack} ${className || ''}`}>
            <div className={styles.progressFill} style={{ width: `${clampedValue * 100}%` }} />
        </div>
    )
}

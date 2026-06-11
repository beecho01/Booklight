import { Button, makeStyles, Text, tokens } from '@fluentui/react-components'
import { Add20Regular, Subtract20Regular } from '@fluentui/react-icons'
import { borderRadiusMedium, cardHoverShadow } from '../theme'

const useStyles = makeStyles({
    zoomPanel: {
        borderRadius: borderRadiusMedium,
        boxShadow: cardHoverShadow,
        backgroundColor: tokens.colorNeutralBackground1,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
    },
    zoomLabel: {
        minWidth: '40px',
        textAlign: 'center' as const,
        fontFamily: 'monospace',
    },
})

interface ZoomControlProps {
    level: 'small' | 'medium' | 'large'
    onLevelChange: (level: 'small' | 'medium' | 'large') => void
}

const levels: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large']
const levelLabels = { small: '75%', medium: '100%', large: '150%' }

export default function ZoomControl({ level, onLevelChange }: ZoomControlProps) {
    const styles = useStyles()
    const currentIndex = levels.indexOf(level)

    return (
        <div className={styles.zoomPanel}>
            <Button
                appearance="subtle"
                icon={<Subtract20Regular />}
                disabled={currentIndex === 0}
                onClick={() => onLevelChange(levels[Math.max(0, currentIndex - 1)])}
                size="small"
            />
            <Text className={styles.zoomLabel} size={200} weight="medium">
                {levelLabels[level]}
            </Text>
            <Button
                appearance="subtle"
                icon={<Add20Regular />}
                disabled={currentIndex === levels.length - 1}
                onClick={() => onLevelChange(levels[Math.min(levels.length - 1, currentIndex + 1)])}
                size="small"
            />
        </div>
    )
}

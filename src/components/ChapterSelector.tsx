import { Dropdown, makeStyles, Option, tokens } from '@fluentui/react-components'
import React, { useMemo } from 'react'
import { borderRadiusMedium, borderRadiusSmall } from '../theme'
import type { Chapter } from '../types/chapter'
import { formatChapterTime, inferSections } from '../types/chapter'

const useStyles = makeStyles({
    chapterDropdown: {
        backgroundColor: tokens.colorNeutralBackground2,
        borderRadius: borderRadiusMedium,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        maxHeight: '320px',
        overflowY: 'auto' as const,
    },
    sectionHeader: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
        color: tokens.colorNeutralForeground3,
        fontWeight: 600,
        fontSize: '11px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    },
    chapterItem: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
        cursor: 'pointer',
        borderRadius: borderRadiusSmall,
        transition: 'background-color 0.1s ease',
        ':hover': {
            backgroundColor: tokens.colorNeutralBackground4,
        },
    },
    chapterItemSelected: {
        backgroundColor: tokens.colorNeutralBackground3,
        borderLeft: `3px solid ${tokens.colorBrandBackground}`,
        paddingLeft: tokens.spacingHorizontalM,
    },
    chapterDuration: {
        color: tokens.colorNeutralForeground3,
        fontSize: '11px',
        fontFamily: 'monospace',
    },
})

interface ChapterSelectorProps {
    chapters: Chapter[]
    currentIndex: number
    onChapterSelect: (index: number) => void
}

export default function ChapterSelector({ chapters, currentIndex, onChapterSelect }: ChapterSelectorProps) {
    const styles = useStyles()
    const sections = useMemo(() => inferSections(chapters), [chapters])

    const currentChapter = chapters[currentIndex]

    return (
        <Dropdown
            value={currentChapter?.title || 'Select chapter'}
            selectedOptions={[String(currentIndex)]}
            onOptionSelect={(_, data) => {
                const idx = parseInt(data.optionValue || '0', 10)
                onChapterSelect(idx)
            }}
            appearance="underline"
            size="small"
            style={{ minWidth: '200px' }}
        >
            {sections.length > 1
                ? sections.map((section) => (
                      <React.Fragment key={section.title}>
                          <Option disabled text={section.title} value={`section-${section.title}`}>
                              {section.title}
                          </Option>
                          {section.chapters.map((chapter) => {
                              const globalIndex = chapters.indexOf(chapter)
                              return (
                                  <Option
                                      key={chapter.id}
                                      value={String(globalIndex)}
                                      text={chapter.title}
                                  >
                                      <span
                                          style={{
                                              color: tokens.colorNeutralForeground2,
                                              marginRight: '8px',
                                          }}
                                      >
                                          {globalIndex + 1}.
                                      </span>
                                      {chapter.title}
                                      <span
                                          className={styles.chapterDuration}
                                          style={{ marginLeft: 'auto' }}
                                      >
                                          {formatChapterTime(chapter.end - chapter.start)}
                                      </span>
                                  </Option>
                              )
                          })}
                      </React.Fragment>
                  ))
                : chapters.map((chapter, idx) => (
                      <Option key={chapter.id} value={String(idx)} text={chapter.title}>
                          <span
                              style={{ color: tokens.colorNeutralForeground2, marginRight: '8px' }}
                          >
                              {idx + 1}.
                          </span>
                          {chapter.title}
                          <span className={styles.chapterDuration} style={{ marginLeft: 'auto' }}>
                              {formatChapterTime(chapter.end - chapter.start)}
                          </span>
                      </Option>
                  ))}
        </Dropdown>
    )
}

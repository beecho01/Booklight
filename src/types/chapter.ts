export interface Chapter {
    id: number
    start: number
    end: number
    title: string
}

export interface Section {
    title: string
    chapters: Chapter[]
}

/**
 * Infer sections from chapter titles.
 * Chapters like "Part 1: Chapter 1" get grouped into "Part 1" sections.
 * Chapters without a section prefix go into a default section.
 */
export function inferSections(chapters: Chapter[]): Section[] {
    if (!chapters || chapters.length === 0) return []

    const sectionPattern = /^(Part\s+\d+|Book\s+\d+|Section\s+\d+)\s*[:.-]\s*/i
    const sections: Section[] = []
    let currentSection: Section | null = null

    chapters.forEach((chapter) => {
        const match = chapter.title.match(sectionPattern)
        if (match) {
            const sectionTitle = match[1]
            if (!currentSection || currentSection.title !== sectionTitle) {
                currentSection = { title: sectionTitle, chapters: [] }
                sections.push(currentSection)
            }
            currentSection.chapters.push(chapter)
        } else {
            if (!currentSection) {
                currentSection = { title: '', chapters: [] }
                sections.push(currentSection)
            }
            currentSection.chapters.push(chapter)
        }
    })

    return sections
}

export function formatChapterTime(seconds: number): string {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
}

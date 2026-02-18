import { create } from 'zustand'

export type AtsFix = {
  id: string
  level: 'P0' | 'P1' | 'P2'
  title: string
  description: string
  tag: string // e.g., CRITICAL, RELEVANCE, STYLE
}

interface AtsScanState {
  score: number
  keywordsFound: string[]
  keywordsMissing: string[]
  fixes: AtsFix[]
}

export const useAtsScanStore = create<AtsScanState>((set) => ({
  score: 78,
  keywordsFound: ['Project Management', 'Budgeting', 'Stakeholder', 'JIRA'],
  keywordsMissing: ['SQL', 'Agile', 'Scrum'],
  fixes: [
    {
      id: '1',
      level: 'P0',
      title: 'Format Error',
      description: 'Your header text is inside an image layer. ATS bots cannot read your contact info.',
      tag: 'CRITICAL',
    },
    {
      id: '2',
      level: 'P1',
      title: 'Content Gap',
      description: "Missing 'Data Analysis' in work experience. This is a top requirement for this role.",
      tag: 'RELEVANCE',
    },
    {
      id: '3',
      level: 'P2',
      title: 'Weak Verbs',
      description: 'Used "Responsible for" 4 times. Try stronger action verbs like "Spearheaded" or "Managed".',
      tag: 'STYLE',
    },
  ],
}))

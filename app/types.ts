import { SetStateAction, Dispatch } from 'react'

export interface IIconProps {
  type: string
  props: any
}

export interface IThemeContext {
  theme: any
  setTheme: Dispatch<SetStateAction<string>>
  themeName: string
}

export interface Model {
  name: string;
  label: string;
  icon: any
}

export interface CareerSetupState {
  roleTrack: string
  seniority: string
  workingStyle: string
  targetRole: string
  desiredSalaryRange: string
  targetSeniority: string
  locationPreference: string
  selectedGoals: string[]
  selectedSkills: string[]
  sourceResumeName: string | null
  baselineResumeName: string | null
}

export interface CustomInterviewPrepPayload {
  inferredRole: string
  roleTrack: string
  companyName: string | null
  sourceType: 'url' | 'text'
  sourcePreview: string
  focusAreas: string[]
  generatedAt: string
}

export interface CustomInterviewPrepRecord extends CustomInterviewPrepPayload {
  id: string
  savedAt: string
}

export interface IAppContext {
  chatType: Model
  setChatType: Dispatch<SetStateAction<Model>>
  handlePresentModalPress: () => void
  setImageModel: Dispatch<SetStateAction<string>>
  imageModel: string,
  closeModal: () => void,
}

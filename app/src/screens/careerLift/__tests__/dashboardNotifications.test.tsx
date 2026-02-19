import React from 'react'
import { act, fireEvent, render } from '@testing-library/react-native'
import { DashboardScreen } from '../dashboard'
import { useUserProfileStore } from '../../../store/userProfileStore'
import { useCareerSetupStore } from '../../../store/careerSetup'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'
import { useCreditsStore } from '../../../store/creditsStore'
import * as DocumentPicker from 'expo-document-picker'

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}))

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}))

describe('DashboardScreen — Notifications and Scan UI', () => {
  const navigation = {
    navigate: jest.fn(),
  }
  const mockGetDocumentAsync = DocumentPicker.getDocumentAsync as jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    useUserProfileStore.getState().resetProfile()
    useCareerSetupStore.getState().resetCareerSetup()
    useJobTrackerStore.getState().resetJobTrackerStore()
    useCreditsStore.getState().resetCredits()
    mockGetDocumentAsync.mockResolvedValue({
      canceled: true,
      assets: [],
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders New Scan sonar label text', () => {
    const { getByText } = render(<DashboardScreen navigation={navigation} />)
    expect(getByText('New Scan')).toBeTruthy()
    expect(getByText('Ready to scan jobs')).toBeTruthy()
  })

  it('starts new scan flow and completes with jobs found summary', () => {
    jest.useFakeTimers()
    const { getByLabelText, getByText, getAllByText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByLabelText('Start new scan'))
    expect(getByText('Running market scan')).toBeTruthy()
    expect(getAllByText('Starting scan').length).toBeGreaterThan(0)

    for (let step = 0; step < 6; step += 1) {
      act(() => {
        jest.advanceTimersByTime(900)
      })
    }

    expect(getByText(/jobs found/i)).toBeTruthy()
    expect(getAllByText(/Top match/i).length).toBeGreaterThan(0)
    expect(getByLabelText('View scanned jobs')).toBeTruthy()
  })

  it('uses saved recommended preset in scan flow copy', () => {
    jest.useFakeTimers()
    useJobTrackerStore.getState().saveRecommendedScanPreset({
      screenFilter: 'Remote',
      sortBy: 'matchDesc',
      remoteOnly: true,
      fullTimeOnly: false,
      hybridOnly: false,
      locationQuery: 'Seattle, WA',
      name: 'Remote Focus',
    })
    const { getByLabelText, getByText, getAllByText } = render(<DashboardScreen navigation={navigation} />)

    expect(getByText('Preset: Remote Focus')).toBeTruthy()
    fireEvent.press(getByLabelText('Start new scan'))
    expect(getAllByText('Syncing preset: Remote Focus').length).toBeGreaterThan(0)
  })

  it('auto-starts scan when opened from Use in Scan flow', () => {
    useJobTrackerStore.getState().saveRecommendedScanPreset({
      screenFilter: 'Remote',
      sortBy: 'matchDesc',
      remoteOnly: true,
      fullTimeOnly: false,
      hybridOnly: false,
      locationQuery: '',
    })
    const navWithSetParams = {
      navigate: jest.fn(),
      setParams: jest.fn(),
    }
    const { getByText } = render(
      <DashboardScreen navigation={navWithSetParams} route={{ params: { startScanFromSavedFilters: true } }} />
    )

    expect(getByText('Running market scan')).toBeTruthy()
    expect(navWithSetParams.setParams).toHaveBeenCalledWith({ startScanFromSavedFilters: undefined })
  })

  it('opens reusable notifications panel from bell button and can close it', () => {
    const { getByLabelText, getByText, queryByText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByLabelText('Open notifications'))
    expect(getByText('Notifications')).toBeTruthy()
    expect(getByText('Urgent')).toBeTruthy()
    expect(getByText('Non-Emergent')).toBeTruthy()
    expect(getByText('System')).toBeTruthy()
    expect(getByText('Interview starts in 45 min')).toBeTruthy()
    expect(getByText('Weekly scan completed')).toBeTruthy()

    fireEvent.press(getByLabelText('Close notifications'))
    expect(queryByText('Notifications')).toBeNull()
  })

  it('can clear individual notifications and clear all notifications', () => {
    const { getByLabelText, getByText, queryByText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByLabelText('Open notifications'))
    expect(getByText('Interview starts in 45 min')).toBeTruthy()

    fireEvent.press(getByLabelText('Clear notification Interview starts in 45 min'))
    expect(queryByText('Interview starts in 45 min')).toBeNull()

    fireEvent.press(getByLabelText('Clear all notifications'))
    expect(getByText('No notifications right now.')).toBeTruthy()
  })

  it('navigates from a notification tap when a target screen is provided', () => {
    const { getByLabelText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByLabelText('Open notifications'))
    fireEvent.press(getByLabelText('Open notification Interview starts in 45 min'))

    expect(navigation.navigate).toHaveBeenCalledWith('InterviewPrep', undefined)
  })

  it('routes avatar press to profile screen', () => {
    const { getByLabelText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByLabelText('Open profile'))
    expect(navigation.navigate).toHaveBeenCalledWith('SettingsProfile', undefined)
  })

  it('opens in-place import modal from dashboard plus FAB', () => {
    const { getByTestId, getByText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByTestId('dashboard-add-job-fab'))
    expect(getByText('Import Job Description')).toBeTruthy()
    expect(getByText('Public URL')).toBeTruthy()
    expect(getByText('Paste JD')).toBeTruthy()
    expect(navigation.navigate).not.toHaveBeenCalledWith('JobTracker', { openAddJobModal: true })
  })

  it('imports a job from dashboard add-job modal using JD URL', () => {
    const { getByTestId, getByPlaceholderText, getByText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByTestId('dashboard-add-job-fab'))
    fireEvent.changeText(
      getByPlaceholderText('https://company.com/jobs/senior-pm'),
      'https://acme.com/careers/senior-product-designer-remote'
    )
    fireEvent.press(getByText('Extract & Add'))

    const added = useJobTrackerStore.getState().thisWeek[0]
    expect(added.company).toBe('Acme')
    expect(added.role).toBe('Senior Product Designer')
    expect(added.location).toBe('Remote')
    expect(added.status).toBe('Target')
  })

  it('shows quick actions section and opens modal from View All', () => {
    const { getByText, getAllByText } = render(<DashboardScreen navigation={navigation} />)
    expect(getByText('QUICK ACTIONS')).toBeTruthy()

    fireEvent.press(getByText('View All'))
    expect(getByText('Quick Actions')).toBeTruthy()
    expect(getAllByText('Applied (12)').length).toBeGreaterThan(0)
    expect(getAllByText('Custom Job Practice').length).toBeGreaterThan(0)
    expect(getAllByText('Resume Scan').length).toBeGreaterThan(0)
    expect(getAllByText('Optimize LinkedIn').length).toBeGreaterThan(0)
  })

  it('quick actions modal routes each action correctly', () => {
    const { getByText, getAllByText, getByLabelText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByText('View All'))
    const trackerAction = getAllByText('Open tracker pipeline')
    fireEvent.press(trackerAction[trackerAction.length - 1])
    expect(navigation.navigate).toHaveBeenCalledWith('JobTracker', { initialStatus: 'Applied' })

    fireEvent.press(getByText('View All'))
    const customPracticeAction = getAllByText('Start custom interview prep')
    fireEvent.press(customPracticeAction[customPracticeAction.length - 1])
    expect(getByText('Custom Interview Prep')).toBeTruthy()
    expect(getByText('Add a job URL or paste the job description to build a custom prep flow.')).toBeTruthy()
    fireEvent.press(getByLabelText('Close custom prep modal'))

    fireEvent.press(getByText('View All'))
    const resumeScanAction = getAllByText('Run ATS fit scan')
    fireEvent.press(resumeScanAction[resumeScanAction.length - 1])
    expect(getByText('Upload a resume or choose one already saved to your profile.')).toBeTruthy()
    fireEvent.press(getByLabelText('Close resume scan setup'))

    fireEvent.press(getByText('View All'))
    const linkedInAction = getAllByText('Open LinkedIn Kit')
    fireEvent.press(linkedInAction[linkedInAction.length - 1])
    expect(navigation.navigate).toHaveBeenCalledWith('LinkedInKit', undefined)
  })

  it('resume scan uses saved resume then opens ATS results after processing animation', () => {
    jest.useFakeTimers()
    useCareerSetupStore.getState().setCareerSetup({ sourceResumeName: 'Alex_Resume.pdf' })
    const { getByText, getAllByText, getByLabelText } = render(<DashboardScreen navigation={navigation} />)

    act(() => {
      fireEvent.press(getByText('View All'))
    })
    const resumeScanAction = getAllByText('Run ATS fit scan')
    act(() => {
      fireEvent.press(resumeScanAction[resumeScanAction.length - 1])
    })

    expect(getByText('Saved Resumes')).toBeTruthy()
    act(() => {
      fireEvent.press(getByLabelText('Use resume Alex_Resume.pdf'))
    })
    expect(getByText('Scanning your resume')).toBeTruthy()

    for (let step = 0; step < 7; step += 1) {
      act(() => {
        jest.advanceTimersByTime(800)
      })
    }

    expect(navigation.navigate).toHaveBeenCalledWith('ATSResults', { resumeName: 'Alex_Resume.pdf' })
  })

  it('resume scan can upload a resume and navigate to ATS results', async () => {
    jest.useFakeTimers()
    mockGetDocumentAsync.mockResolvedValue({
      canceled: false,
      assets: [{ name: 'Tailored_Resume.docx' }],
    })
    const { getByText, getByLabelText } = render(<DashboardScreen navigation={navigation} />)

    act(() => {
      fireEvent.press(getByText('Resume Scan'))
    })
    await act(async () => {
      fireEvent.press(getByLabelText('Upload resume for scan'))
      await Promise.resolve()
    })

    expect(mockGetDocumentAsync).toHaveBeenCalled()
    expect(useCareerSetupStore.getState().sourceResumeName).toBe('Tailored_Resume.docx')

    for (let step = 0; step < 7; step += 1) {
      act(() => {
        jest.advanceTimersByTime(800)
      })
    }

    expect(navigation.navigate).toHaveBeenCalledWith('ATSResults', { resumeName: 'Tailored_Resume.docx' })
  })

  it('uses shared task-check flow for next actions on home', () => {
    const { getByLabelText, getByText, queryByText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByLabelText('Mark action Submit Application done'))
    expect(getByText('Confirm Submission')).toBeTruthy()
    fireEvent.press(getByText('Yes, submitted'))

    const updated = useJobTrackerStore.getState().nextUp.find(job => job.id === '3')
    expect(updated?.status).toBe('Applied')
    expect(updated?.nextAction).toBe('Follow up')
    expect(queryByText('Confirm Submission')).toBeNull()
  })

  it('opens task actions from home using shared routing', () => {
    const { getByLabelText } = render(<DashboardScreen navigation={navigation} />)

    fireEvent.press(getByLabelText('Open action Submit Application'))

    expect(navigation.navigate).toHaveBeenCalledWith(
      'ApplyPack',
      expect.objectContaining({
        job: expect.objectContaining({ id: '3' }),
      })
    )
  })
})

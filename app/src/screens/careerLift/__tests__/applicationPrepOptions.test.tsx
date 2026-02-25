import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { Alert, Linking } from 'react-native'
import { act } from 'react-test-renderer'
import { ApplicationPrepOptions } from '../components/applicationPrepOptions'
import { useCreditsStore } from '../../../store/creditsStore'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'

describe('ApplicationPrepOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useCreditsStore.getState().resetCredits()
    useJobTrackerStore.getState().resetJobTrackerStore()
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true)
    jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)
  })

  it('shows quick apply click label on quick tab', () => {
    const { getByText } = render(
      <ApplicationPrepOptions
        job={null}
        showHeader={false}
        showCancel={false}
        initialTab='simple'
      />
    )

    expect(getByText('Click to Quick Apply')).toBeTruthy()
  })

  it('does not spend AI credits on advanced submit', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    const onApplied = jest.fn()
    const job = useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')!
    const initialBalance = useCreditsStore.getState().balance

    const { getByText } = render(
      <ApplicationPrepOptions
        job={job}
        showHeader={false}
        showCancel={false}
        initialTab='simple'
        onApplied={onApplied}
      />
    )

    fireEvent.press(getByText('Advanced'))
    fireEvent.press(getByText('Approve & Log Submission'))

    expect(useCreditsStore.getState().balance).toBe(initialBalance)
    expect(useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')?.status).toBe('Applied')
    expect(onApplied).toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith(
      'Application Logged!',
      expect.stringContaining('marked as Applied.')
    )
    expect(useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')?.nextAction).toBe('Follow up')
  })

  it('shows advanced click label and supports single press submit', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    const onApplied = jest.fn()
    const job = useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')!
    const initialBalance = useCreditsStore.getState().balance

    const { getByText, getByTestId } = render(
      <ApplicationPrepOptions
        job={job}
        showHeader={false}
        showCancel={false}
        initialTab='advanced'
        onApplied={onApplied}
      />
    )

    expect(getByText('Click to Approve')).toBeTruthy()
    fireEvent.press(getByTestId('advanced-apply-submit-button'))

    expect(useCreditsStore.getState().balance).toBe(initialBalance)
    expect(useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')?.status).toBe('Applied')
    expect(onApplied).toHaveBeenCalledTimes(1)
    expect(alertSpy).toHaveBeenCalledWith(
      'Application Logged!',
      expect.stringContaining('marked as Applied.')
    )
  })

  it('advanced submit also works on a single press release', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    const onApplied = jest.fn()
    const job = useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')!

    const { getByTestId } = render(
      <ApplicationPrepOptions
        job={job}
        showHeader={false}
        showCancel={false}
        initialTab='advanced'
        onApplied={onApplied}
      />
    )

    fireEvent.press(getByTestId('advanced-apply-submit-button'))

    expect(useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')?.status).toBe('Applied')
    expect(onApplied).toHaveBeenCalledTimes(1)
    expect(alertSpy).toHaveBeenCalledWith(
      'Application Logged!',
      expect.stringContaining('marked as Applied.')
    )
  })

  it('quick apply updates next weekly task after marking applied', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    const onApplied = jest.fn()
    const job = useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')!

    const { getByTestId } = render(
      <ApplicationPrepOptions
        job={job}
        showHeader={false}
        showCancel={false}
        initialTab='simple'
        onApplied={onApplied}
      />
    )

    fireEvent(getByTestId('quick-apply-submit-button'), 'pressIn')
    fireEvent(getByTestId('quick-apply-submit-button'), 'pressOut')

    expect(useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')?.status).toBe('Applied')
    expect(useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')?.nextAction).toBe('Follow up')
    expect(onApplied).toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith(
      'Application Logged!',
      expect.stringContaining('marked as Applied.')
    )
  })

  it('opens job application link and marks applied via callback decision', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    const onExternalApplyResult = jest.fn()
    const onApplied = jest.fn()
    const job = useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')!
    const jobWithLink = { ...job, applicationUrl: 'https://example.com/jobs/3' }

    const { getByTestId } = render(
      <ApplicationPrepOptions
        job={jobWithLink}
        showHeader={false}
        showCancel={false}
        initialTab='simple'
        onApplied={onApplied}
        onExternalApplyResult={onExternalApplyResult}
      />
    )

    fireEvent.press(getByTestId('open-job-application-button'))

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith('https://example.com/jobs/3')
      expect(alertSpy).toHaveBeenCalledWith(
        'Application status',
        'Did you submit the application?',
        expect.any(Array)
      )
    })

    const promptButtons = (alertSpy.mock.calls.at(-1)?.[2] || []) as Array<{ text: string; onPress?: () => void }>
    const submitButton = promptButtons.find(button => button.text === 'Yes, submitted')
    expect(submitButton?.onPress).toBeTruthy()
    act(() => {
      submitButton?.onPress?.()
    })

    expect(useJobTrackerStore.getState().nextUp.find(entry => entry.id === '3')?.status).toBe('Applied')
    expect(onExternalApplyResult).toHaveBeenCalledWith('applied', expect.objectContaining({ id: '3' }))
    expect(onApplied).toHaveBeenCalled()
  })
})

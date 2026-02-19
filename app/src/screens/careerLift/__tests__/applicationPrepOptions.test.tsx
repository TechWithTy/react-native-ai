import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { ApplicationPrepOptions } from '../components/applicationPrepOptions'
import { useCreditsStore } from '../../../store/creditsStore'
import { useJobTrackerStore } from '../../../store/jobTrackerStore'

describe('ApplicationPrepOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useCreditsStore.getState().resetCredits()
    useJobTrackerStore.getState().resetJobTrackerStore()
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
})

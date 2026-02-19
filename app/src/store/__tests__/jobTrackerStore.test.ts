import { useJobTrackerStore } from '../jobTrackerStore'

describe('jobTrackerStore save flow', () => {
  beforeEach(() => {
    useJobTrackerStore.getState().resetJobTrackerStore()
  })

  it('adds a saved recommended job to tracker nextUp', () => {
    const store = useJobTrackerStore.getState()
    const job = store.recommendedJobs[0]

    store.toggleSaveJob(job)

    const nextState = useJobTrackerStore.getState()
    expect(nextState.savedJobIds).toContain(job.id)
    expect(nextState.nextUp.some(entry => entry.id === job.id)).toBe(true)
    expect(nextState.nextUp.find(entry => entry.id === job.id)?.status).toBe('Target')
  })

  it('removes a saved recommended job from tracker when unsaved', () => {
    const store = useJobTrackerStore.getState()
    const job = store.recommendedJobs[0]

    store.toggleSaveJob(job)
    useJobTrackerStore.getState().toggleSaveJob(job)

    const nextState = useJobTrackerStore.getState()
    expect(nextState.savedJobIds).not.toContain(job.id)
    expect(nextState.nextUp.some(entry => entry.id === job.id)).toBe(false)
  })

  it('drops saved marker after status changes away from Target', () => {
    const store = useJobTrackerStore.getState()
    const job = store.recommendedJobs[0]

    store.toggleSaveJob(job)
    useJobTrackerStore.getState().updateJobStatus(job.id, 'Applied')

    const nextState = useJobTrackerStore.getState()
    expect(nextState.savedJobIds).not.toContain(job.id)
    expect(nextState.nextUp.find(entry => entry.id === job.id)?.status).toBe('Applied')
  })

  it('synchronizes recommended + tracker state when adding an existing recommended job id', () => {
    const store = useJobTrackerStore.getState()
    const recommended = store.recommendedJobs[0]

    store.addJob({
      ...recommended,
      status: 'Applied',
      nextAction: 'Follow up',
      nextActionDate: 'in 3 days',
    })

    const nextState = useJobTrackerStore.getState()
    expect(nextState.thisWeek.find(entry => entry.id === recommended.id)?.status).toBe('Applied')
    expect(nextState.nextUp.some(entry => entry.id === recommended.id)).toBe(false)
    expect(nextState.recommendedJobs.find(entry => entry.id === recommended.id)?.status).toBe('Applied')
    expect(nextState.savedJobIds).not.toContain(recommended.id)
  })

  it('saves recommended scan preset in store with derived label', () => {
    useJobTrackerStore.getState().saveRecommendedScanPreset({
      screenFilter: 'Remote',
      sortBy: 'matchDesc',
      remoteOnly: true,
      fullTimeOnly: true,
      hybridOnly: false,
      locationQuery: 'Austin, TX',
      name: 'Texas Remote Focus',
    })

    const nextState = useJobTrackerStore.getState()
    expect(nextState.recommendedScanPreset).toEqual(
      expect.objectContaining({
        screenFilter: 'Remote',
        remoteOnly: true,
        fullTimeOnly: true,
        locationQuery: 'Austin, TX',
        name: 'Texas Remote Focus',
        label: 'Remote • Full-time • Austin, TX',
      })
    )
  })

  it('clears recommended scan preset when reset action is called', () => {
    useJobTrackerStore.getState().saveRecommendedScanPreset({
      screenFilter: 'All Matches',
      sortBy: 'matchAsc',
      remoteOnly: false,
      fullTimeOnly: false,
      hybridOnly: true,
      locationQuery: '',
    })

    useJobTrackerStore.getState().clearRecommendedScanPreset()
    expect(useJobTrackerStore.getState().recommendedScanPreset).toBeNull()
  })
})

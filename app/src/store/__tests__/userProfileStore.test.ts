import { useUserProfileStore } from '../userProfileStore'

describe('userProfileStore next actions', () => {
  beforeEach(() => {
    useUserProfileStore.getState().resetProfile()
  })

  it('seeds default next actions on profile state', () => {
    const { nextActions } = useUserProfileStore.getState()
    expect(nextActions).toHaveLength(3)
    expect(nextActions[0]?.title).toBe('Follow up with Acme Corp')
  })

  it('toggles a next action completion state', () => {
    const store = useUserProfileStore.getState()
    expect(store.nextActions.find(item => item.id === '1')?.isCompleted).toBe(false)

    store.toggleNextAction('1')
    expect(useUserProfileStore.getState().nextActions.find(item => item.id === '1')?.isCompleted).toBe(true)

    useUserProfileStore.getState().toggleNextAction('1')
    expect(useUserProfileStore.getState().nextActions.find(item => item.id === '1')?.isCompleted).toBe(false)
  })

  it('keeps next actions while updating other profile fields', () => {
    const store = useUserProfileStore.getState()
    store.toggleNextAction('2')
    store.setProfile({ name: 'Taylor Jenkins' })

    const nextState = useUserProfileStore.getState()
    expect(nextState.name).toBe('Taylor Jenkins')
    expect(nextState.nextActions.find(item => item.id === '2')?.isCompleted).toBe(true)
  })

  it('seeds mock documents and insights in default state', () => {
    const { careerDocuments, documentInsights, activityLog } = useUserProfileStore.getState()
    expect(careerDocuments.length).toBeGreaterThan(0)
    expect(documentInsights.totalDocuments).toBe(careerDocuments.length)
    expect(activityLog.length).toBeGreaterThan(0)
  })

  it('recomputes insights when documents are added and removed', () => {
    const store = useUserProfileStore.getState()
    store.setProfile({ careerDocuments: [], activityLog: [] })

    store.addCareerDocument({
      name: 'QA_Resume.pdf',
      type: 'resume',
      uri: 'file:///tmp/QA_Resume.pdf',
      mimeType: 'application/pdf',
      targetLabel: 'QA Engineer',
      track: 'Engineering',
      status: 'applied',
      conversionRate: 0.2,
    })

    const withDoc = useUserProfileStore.getState()
    expect(withDoc.documentInsights.totalDocuments).toBe(1)
    expect(withDoc.documentInsights.totalResumes).toBe(1)
    expect(withDoc.activityLog[0]?.eventType).toBe('document_upload')

    const docId = withDoc.careerDocuments[0]?.id
    expect(docId).toBeTruthy()
    if (!docId) return

    store.removeCareerDocument(docId)
    const afterRemove = useUserProfileStore.getState()
    expect(afterRemove.documentInsights.totalDocuments).toBe(0)
    expect(afterRemove.activityLog[0]?.eventType).toBe('document_remove')
  })
})

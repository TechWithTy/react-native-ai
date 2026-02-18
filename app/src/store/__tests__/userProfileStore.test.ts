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
})

import { useCreditsStore, CREDIT_COSTS } from '../creditsStore'

describe('creditsStore', () => {
  beforeEach(() => {
    useCreditsStore.getState().resetCredits()
  })

  it('initialises with the default balance of 150', () => {
    const { balance, totalCredits, totalSpent, history } = useCreditsStore.getState()
    expect(balance).toBe(150)
    expect(totalCredits).toBe(150)
    expect(totalSpent).toBe(0)
    expect(history).toEqual([])
  })

  it('getCost returns the correct cost for each action', () => {
    const { getCost } = useCreditsStore.getState()
    expect(getCost('mockInterview')).toBe(15)
    expect(getCost('aiApplicationSubmit')).toBe(8)
    expect(getCost('storyPractice')).toBe(5)
    expect(getCost('resumeTailor')).toBe(4)
    expect(getCost('coverLetterGen')).toBe(4)
    expect(getCost('linkedInOptimize')).toBe(6)
  })

  it('canAfford returns true when balance is sufficient', () => {
    const { canAfford } = useCreditsStore.getState()
    expect(canAfford('mockInterview')).toBe(true)
    expect(canAfford('aiApplicationSubmit')).toBe(true)
  })

  it('spendCredits deducts balance and records a transaction', () => {
    const { spendCredits } = useCreditsStore.getState()
    const result = spendCredits('mockInterview', 'Behavioral Session')

    expect(result).toBe(true)

    const state = useCreditsStore.getState()
    expect(state.balance).toBe(150 - CREDIT_COSTS.mockInterview) // 135
    expect(state.totalSpent).toBe(CREDIT_COSTS.mockInterview)
    expect(state.history).toHaveLength(1)
    expect(state.history[0].action).toBe('mockInterview')
    expect(state.history[0].amount).toBe(15)
    expect(state.history[0].label).toBe('Behavioral Session')
  })

  it('spendCredits returns false when balance is insufficient', () => {
    // Drain the balance
    const store = useCreditsStore.getState()
    for (let i = 0; i < 10; i++) {
      store.spendCredits('mockInterview')
    }
    // Balance should now be 0
    expect(useCreditsStore.getState().balance).toBe(0)

    const result = useCreditsStore.getState().spendCredits('mockInterview')
    expect(result).toBe(false)
    // Balance should remain 0
    expect(useCreditsStore.getState().balance).toBe(0)
  })

  it('canAfford returns false when balance is insufficient', () => {
    // Drain everything
    const store = useCreditsStore.getState()
    for (let i = 0; i < 10; i++) {
      store.spendCredits('mockInterview')
    }
    expect(useCreditsStore.getState().canAfford('mockInterview')).toBe(false)
    expect(useCreditsStore.getState().canAfford('aiApplicationSubmit')).toBe(false)
  })

  it('addCredits increases balance and totalCredits', () => {
    useCreditsStore.getState().addCredits(50)
    const state = useCreditsStore.getState()
    expect(state.balance).toBe(200)
    expect(state.totalCredits).toBe(200)
  })

  it('history is capped at 20 transactions', () => {
    const store = useCreditsStore.getState()
    // Add enough credits to afford many spends
    store.addCredits(500)
    for (let i = 0; i < 25; i++) {
      store.spendCredits('coverLetterGen', `CL #${i}`)
    }
    expect(useCreditsStore.getState().history.length).toBe(20)
  })

  it('resetCredits restores default state', () => {
    const store = useCreditsStore.getState()
    store.spendCredits('mockInterview')
    store.addCredits(100)
    store.resetCredits()

    const state = useCreditsStore.getState()
    expect(state.balance).toBe(150)
    expect(state.totalCredits).toBe(150)
    expect(state.totalSpent).toBe(0)
    expect(state.history).toEqual([])
  })
})

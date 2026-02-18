import { act } from '@testing-library/react-native'
import { useMonetizationExperimentsStore } from '../monetizationExperimentsStore'

describe('monetizationExperimentsStore', () => {
  beforeEach(() => {
    act(() => {
      useMonetizationExperimentsStore.getState().resetExperiments()
    })
  })

  afterEach(() => {
    act(() => {
      useMonetizationExperimentsStore.getState().resetExperiments()
    })
  })

  it('returns sticky assignment for the same placement and seed', () => {
    const first = useMonetizationExperimentsStore.getState().evaluatePlacement({
      placement: 'settings_buy_ai_credits',
      seedKey: 'user-123',
    })
    const second = useMonetizationExperimentsStore.getState().evaluatePlacement({
      placement: 'settings_buy_ai_credits',
      seedKey: 'user-123',
    })

    expect(first.variantId).toBe(second.variantId)
    expect(first.surface).toBe(second.surface)
    expect(first.experimentId).toBe(second.experimentId)
  })

  it('supports holdout when allocated traffic is below 100%', () => {
    act(() => {
      useMonetizationExperimentsStore.getState().setVariantWeights('settings_buy_scan_credits', {
        classic: 0,
        value_pitch: 0,
        upgrade_nudge: 0,
      })
      useMonetizationExperimentsStore.getState().clearAssignments()
    })

    const decision = useMonetizationExperimentsStore.getState().evaluatePlacement({
      placement: 'settings_buy_scan_credits',
      seedKey: 'user-holdout',
    })

    expect(decision.isHoldout).toBe(true)
    expect(decision.surface).toBe('holdout')
    expect(decision.variantId).toBe('holdout')
  })

  it('supports debug override of placement variant', () => {
    act(() => {
      useMonetizationExperimentsStore.getState().setPlacementOverride(
        'interview_get_more_credits',
        'direct_ai_packs'
      )
    })

    const decision = useMonetizationExperimentsStore.getState().evaluatePlacement({
      placement: 'interview_get_more_credits',
      seedKey: 'user-override',
    })

    expect(decision.variantId).toBe('direct_ai_packs')
    expect(decision.surface).toBe('ai_credits')
  })
})

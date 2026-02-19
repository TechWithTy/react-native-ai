import { useAIAgentsStore } from '../aiAgentsStore'

describe('aiAgentsStore', () => {
  beforeEach(() => {
    useAIAgentsStore.getState().resetAIAgents()
  })

  it('defaults to general agent in text mode', () => {
    const state = useAIAgentsStore.getState()
    expect(state.selectedAgentId).toBe('general_coach')
    expect(state.selectedModelLabel).toBe('claudeOpus')
    expect(state.instructionBadges).toEqual([])
    expect(state.voiceModeEnabled).toBe(false)
    expect(state.getActivePrompt().length).toBeGreaterThan(0)
  })

  it('switches selected agent and returns that prompt', () => {
    const store = useAIAgentsStore.getState()
    store.setSelectedAgent('interview_coach')

    const next = useAIAgentsStore.getState()
    expect(next.selectedAgentId).toBe('interview_coach')
    expect(next.getActivePrompt().toLowerCase()).toContain('interview')
  })

  it('updates a specific agent prompt', () => {
    const store = useAIAgentsStore.getState()
    const prompt = 'You are a strict interview evaluator.'

    store.updateAgentPrompt('interview_coach', prompt)
    store.setSelectedAgent('interview_coach')

    const next = useAIAgentsStore.getState()
    expect(next.getActivePrompt()).toBe(prompt)
  })

  it('toggles voice mode', () => {
    const store = useAIAgentsStore.getState()
    expect(store.voiceModeEnabled).toBe(false)

    store.toggleVoiceMode()
    expect(useAIAgentsStore.getState().voiceModeEnabled).toBe(true)

    store.setVoiceModeEnabled(false)
    expect(useAIAgentsStore.getState().voiceModeEnabled).toBe(false)
  })

  it('stores selected model label in state', () => {
    const store = useAIAgentsStore.getState()
    store.setSelectedModelLabel('gpt52')
    expect(useAIAgentsStore.getState().selectedModelLabel).toBe('gpt52')
  })

  it('adds and removes instruction badges without duplicates', () => {
    const store = useAIAgentsStore.getState()

    store.addInstructionBadge('Use concise bullets')
    store.addInstructionBadge('Use concise bullets')
    store.addInstructionBadge('Prioritize ATS keywords')

    expect(useAIAgentsStore.getState().instructionBadges).toEqual([
      'Prioritize ATS keywords',
      'Use concise bullets',
    ])

    store.removeInstructionBadge('Use concise bullets')
    expect(useAIAgentsStore.getState().instructionBadges).toEqual(['Prioritize ATS keywords'])
  })
})

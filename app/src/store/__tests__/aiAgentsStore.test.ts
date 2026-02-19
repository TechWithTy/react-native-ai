import { useAIAgentsStore } from '../aiAgentsStore'

describe('aiAgentsStore', () => {
  beforeEach(() => {
    useAIAgentsStore.getState().resetAIAgents()
  })

  it('defaults to general agent in text mode', () => {
    const state = useAIAgentsStore.getState()
    expect(state.selectedAgentId).toBe('general_coach')
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
})

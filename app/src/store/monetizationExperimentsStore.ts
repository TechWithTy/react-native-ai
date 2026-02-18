import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type MonetizationPlacement =
  | 'settings_upgrade_plan'
  | 'settings_buy_ai_credits'
  | 'settings_buy_scan_credits'
  | 'interview_get_more_credits'

export type MonetizationSurface = 'subscription' | 'ai_credits' | 'scan_credits' | 'holdout'
export type MonetizationCopyVariant = 'classic' | 'value' | 'urgency'

export type PlacementVariant = {
  id: string
  weight: number
  surface: Exclude<MonetizationSurface, 'holdout'>
  copyVariant: MonetizationCopyVariant
}

export type PlacementExperiment = {
  id: string
  placement: MonetizationPlacement
  variants: PlacementVariant[]
}

export type PlacementDecision = {
  placement: MonetizationPlacement
  experimentId: string
  variantId: string
  surface: MonetizationSurface
  copyVariant: MonetizationCopyVariant
  isHoldout: boolean
  assignedAt: string
  seedKey: string
}

type PlacementOverrideMap = Partial<Record<MonetizationPlacement, string | null>>
type AssignmentMap = Partial<Record<MonetizationPlacement, PlacementDecision>>

type MonetizationExperimentsStore = {
  experiments: Record<MonetizationPlacement, PlacementExperiment>
  assignments: AssignmentMap
  overrides: PlacementOverrideMap
  evaluatePlacement: (args: {
    placement: MonetizationPlacement
    seedKey: string
  }) => PlacementDecision
  setPlacementOverride: (placement: MonetizationPlacement, variantId: string | null) => void
  setVariantWeights: (
    placement: MonetizationPlacement,
    weights: Partial<Record<string, number>>
  ) => void
  clearAssignments: () => void
  resetExperiments: () => void
}

const defaultExperiments: Record<MonetizationPlacement, PlacementExperiment> = {
  settings_upgrade_plan: {
    id: 'exp_settings_upgrade_v1',
    placement: 'settings_upgrade_plan',
    variants: [
      { id: 'classic', weight: 100, surface: 'subscription', copyVariant: 'classic' },
      { id: 'value_pitch', weight: 0, surface: 'subscription', copyVariant: 'value' },
      { id: 'urgency_pitch', weight: 0, surface: 'subscription', copyVariant: 'urgency' },
    ],
  },
  settings_buy_ai_credits: {
    id: 'exp_settings_ai_credits_v1',
    placement: 'settings_buy_ai_credits',
    variants: [
      { id: 'classic', weight: 100, surface: 'ai_credits', copyVariant: 'classic' },
      { id: 'value_pitch', weight: 0, surface: 'ai_credits', copyVariant: 'value' },
      { id: 'upgrade_nudge', weight: 0, surface: 'subscription', copyVariant: 'value' },
    ],
  },
  settings_buy_scan_credits: {
    id: 'exp_settings_scan_credits_v1',
    placement: 'settings_buy_scan_credits',
    variants: [
      { id: 'classic', weight: 100, surface: 'scan_credits', copyVariant: 'classic' },
      { id: 'value_pitch', weight: 0, surface: 'scan_credits', copyVariant: 'value' },
      { id: 'upgrade_nudge', weight: 0, surface: 'subscription', copyVariant: 'urgency' },
    ],
  },
  interview_get_more_credits: {
    id: 'exp_interview_credits_v1',
    placement: 'interview_get_more_credits',
    variants: [
      { id: 'classic', weight: 100, surface: 'subscription', copyVariant: 'classic' },
      { id: 'value_pitch', weight: 0, surface: 'subscription', copyVariant: 'value' },
      { id: 'direct_ai_packs', weight: 0, surface: 'ai_credits', copyVariant: 'urgency' },
    ],
  },
}

const memoryState: Record<string, string> = {}
const memoryStorage = {
  getItem: async (name: string) => memoryState[name] ?? null,
  setItem: async (name: string, value: string) => {
    memoryState[name] = value
  },
  removeItem: async (name: string) => {
    delete memoryState[name]
  },
}

const isTest = typeof process !== 'undefined' && typeof process.env?.JEST_WORKER_ID !== 'undefined'
const getPersistStorage = () => {
  if (isTest) return memoryStorage
  return require('@react-native-async-storage/async-storage').default
}

function hashToBucket(input: string) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash +=
      (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return Math.abs(hash >>> 0) % 100
}

function buildHoldoutDecision(
  placement: MonetizationPlacement,
  experiment: PlacementExperiment,
  seedKey: string
): PlacementDecision {
  return {
    placement,
    experimentId: experiment.id,
    variantId: 'holdout',
    surface: 'holdout',
    copyVariant: 'classic',
    isHoldout: true,
    assignedAt: new Date().toISOString(),
    seedKey,
  }
}

function resolveVariantDecision(
  placement: MonetizationPlacement,
  experiment: PlacementExperiment,
  seedKey: string,
  bucket: number,
  overrideVariantId?: string | null
): PlacementDecision {
  const now = new Date().toISOString()
  const selectedByOverride = overrideVariantId
    ? experiment.variants.find(variant => variant.id === overrideVariantId)
    : null

  if (selectedByOverride) {
    return {
      placement,
      experimentId: experiment.id,
      variantId: selectedByOverride.id,
      surface: selectedByOverride.surface,
      copyVariant: selectedByOverride.copyVariant,
      isHoldout: false,
      assignedAt: now,
      seedKey,
    }
  }

  let cumulative = 0
  for (const variant of experiment.variants) {
    cumulative += Math.max(0, variant.weight)
    if (bucket < cumulative) {
      return {
        placement,
        experimentId: experiment.id,
        variantId: variant.id,
        surface: variant.surface,
        copyVariant: variant.copyVariant,
        isHoldout: false,
        assignedAt: now,
        seedKey,
      }
    }
  }

  return buildHoldoutDecision(placement, experiment, seedKey)
}

export const useMonetizationExperimentsStore = create<MonetizationExperimentsStore>()(
  persist(
    (set, get) => ({
      experiments: defaultExperiments,
      assignments: {},
      overrides: {},
      evaluatePlacement: ({ placement, seedKey }) => {
        const experiment = get().experiments[placement]
        const existing = get().assignments[placement]
        if (
          existing &&
          existing.seedKey === seedKey &&
          existing.experimentId === experiment.id &&
          !get().overrides[placement]
        ) {
          return existing
        }

        const bucket = hashToBucket(`${seedKey}::${placement}::${experiment.id}`)
        const decision = resolveVariantDecision(
          placement,
          experiment,
          seedKey,
          bucket,
          get().overrides[placement]
        )

        set(state => ({
          assignments: {
            ...state.assignments,
            [placement]: decision,
          },
        }))
        return decision
      },
      setPlacementOverride: (placement, variantId) =>
        set(state => ({
          overrides: {
            ...state.overrides,
            [placement]: variantId,
          },
          assignments: {
            ...state.assignments,
            [placement]: undefined,
          },
        })),
      setVariantWeights: (placement, weights) =>
        set(state => ({
          experiments: {
            ...state.experiments,
            [placement]: {
              ...state.experiments[placement],
              variants: state.experiments[placement].variants.map(variant => ({
                ...variant,
                weight: Math.max(0, Math.round(weights[variant.id] ?? variant.weight)),
              })),
            },
          },
          assignments: {
            ...state.assignments,
            [placement]: undefined,
          },
        })),
      clearAssignments: () => set({ assignments: {} }),
      resetExperiments: () =>
        set({
          experiments: defaultExperiments,
          assignments: {},
          overrides: {},
        }),
    }),
    {
      name: 'rnai-monetization-experiments',
      storage: createJSONStorage(() => getPersistStorage()),
    }
  )
)

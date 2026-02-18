import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/** Cost table for AI-powered features (in credits) */
export const CREDIT_COSTS = {
  mockInterview: 15,       // ~30 min behavioral session
  aiApplicationSubmit: 8,  // Resume tailoring + cover letter + submit
  storyPractice: 5,        // Practice a single STAR story
  resumeTailor: 4,         // AI resume tailoring only
  coverLetterGen: 4,       // AI cover letter generation only
  linkedInOptimize: 6,     // LinkedIn optimization kit generation
} as const

export type CreditAction = keyof typeof CREDIT_COSTS

export interface CreditTransaction {
  id: string
  action: CreditAction
  amount: number
  timestamp: number
  label: string
}

interface CreditsState {
  /** Current credit balance */
  balance: number
  /** Total credits ever purchased / granted */
  totalCredits: number
  /** Lifetime credits spent */
  totalSpent: number
  /** Recent transaction history (last 20) */
  history: CreditTransaction[]

  // --- Actions ---
  /** Spend credits for an action. Returns false if insufficient balance. */
  spendCredits: (action: CreditAction, label?: string) => boolean
  /** Add credits to balance (purchase, bonus, etc.) */
  addCredits: (amount: number) => void
  /** Get the cost of a given action */
  getCost: (action: CreditAction) => number
  /** Check if user can afford a given action */
  canAfford: (action: CreditAction) => boolean
  /** Reset credits to default */
  resetCredits: () => void
}

const DEFAULT_BALANCE = 150 // Generous starter balance for demo

const defaultState = {
  balance: DEFAULT_BALANCE,
  totalCredits: DEFAULT_BALANCE,
  totalSpent: 0,
  history: [] as CreditTransaction[],
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

const isTest =
  typeof process !== 'undefined' &&
  typeof process.env?.JEST_WORKER_ID !== 'undefined'

const getPersistStorage = () => {
  if (isTest) return memoryStorage
  return require('@react-native-async-storage/async-storage').default
}

export const useCreditsStore = create<CreditsState>()(
  persist(
    (set, get) => ({
      ...defaultState,

      spendCredits: (action, label) => {
        const cost = CREDIT_COSTS[action]
        const { balance } = get()
        if (balance < cost) return false

        const tx: CreditTransaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          action,
          amount: cost,
          timestamp: Date.now(),
          label: label || action,
        }

        set((state) => ({
          balance: state.balance - cost,
          totalSpent: state.totalSpent + cost,
          history: [tx, ...state.history].slice(0, 20),
        }))
        return true
      },

      addCredits: (amount) =>
        set((state) => ({
          balance: state.balance + amount,
          totalCredits: state.totalCredits + amount,
        })),

      getCost: (action) => CREDIT_COSTS[action],

      canAfford: (action) => get().balance >= CREDIT_COSTS[action],

      resetCredits: () => set(defaultState),
    }),
    {
      name: 'rnai-credits-zustand',
      storage: createJSONStorage(() => getPersistStorage()),
    }
  )
)

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
  outreachMessageGen: 4,   // Follow-up outreach draft generation
} as const

export type CreditAction = keyof typeof CREDIT_COSTS
export type SubscriptionTierId = 'starter' | 'pro' | 'unlimited'
export const TIER_SCAN_CREDITS: Record<SubscriptionTierId, number | null> = {
  starter: 10,
  pro: 50,
  unlimited: null,
}

export interface CreditTransaction {
  id: string
  action: CreditAction
  amount: number
  timestamp: number
  label: string
}

export interface ScanTransaction {
  id: string
  amount: number
  timestamp: number
  label: string
  type: 'usage' | 'purchase' | 'tier-change'
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
  /** Active plan tier used for scan allowances */
  subscriptionTier: SubscriptionTierId
  /** Remaining scans on current tier + purchased packs; null means unlimited */
  scanCreditsRemaining: number | null
  /** Lifetime scans consumed */
  totalScansUsed: number
  /** Lifetime scans purchased via one-time packs */
  totalScanCreditsPurchased: number
  /** Recent scan credit history (last 30) */
  scanHistory: ScanTransaction[]

  // --- Actions ---
  /** Spend credits for an action. Returns false if insufficient balance. */
  spendCredits: (action: CreditAction, label?: string) => boolean
  /** Add credits to balance (purchase, bonus, etc.) */
  addCredits: (amount: number) => void
  /** Get the cost of a given action */
  getCost: (action: CreditAction) => number
  /** Check if user can afford a given action */
  canAfford: (action: CreditAction) => boolean
  /** Check if user can run a scan right now */
  canUseScan: () => boolean
  /** Spend one scan credit for a scan-based action. Returns false if insufficient. */
  spendScanCredit: (label?: string) => boolean
  /** Add scan credits via one-time purchase */
  addScanCredits: (amount: number, label?: string) => void
  /** Set current subscription tier and refresh scan allocation for that tier */
  setSubscriptionTier: (tier: SubscriptionTierId) => void
  /** Reset credits to default */
  resetCredits: () => void
}

const DEFAULT_BALANCE = 150 // Generous starter balance for demo
const DEFAULT_SUBSCRIPTION_TIER: SubscriptionTierId = 'pro'
const DEFAULT_SCAN_CREDITS = TIER_SCAN_CREDITS[DEFAULT_SUBSCRIPTION_TIER]

const defaultState = {
  balance: DEFAULT_BALANCE,
  totalCredits: DEFAULT_BALANCE,
  totalSpent: 0,
  history: [] as CreditTransaction[],
  subscriptionTier: DEFAULT_SUBSCRIPTION_TIER,
  scanCreditsRemaining: DEFAULT_SCAN_CREDITS,
  totalScansUsed: 0,
  totalScanCreditsPurchased: 0,
  scanHistory: [] as ScanTransaction[],
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

      canUseScan: () => {
        const { scanCreditsRemaining } = get()
        return scanCreditsRemaining === null || scanCreditsRemaining > 0
      },

      spendScanCredit: (label) => {
        const { scanCreditsRemaining } = get()
        if (scanCreditsRemaining !== null && scanCreditsRemaining < 1) return false

        const tx: ScanTransaction = {
          id: `scan_tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          amount: 1,
          timestamp: Date.now(),
          label: label || 'Job scan',
          type: 'usage',
        }

        set((state) => ({
          scanCreditsRemaining:
            state.scanCreditsRemaining === null ? null : Math.max(0, state.scanCreditsRemaining - 1),
          totalScansUsed: state.totalScansUsed + 1,
          scanHistory: [tx, ...state.scanHistory].slice(0, 30),
        }))

        return true
      },

      addScanCredits: (amount, label) =>
        set((state) => {
          if (amount <= 0) return state
          const tx: ScanTransaction = {
            id: `scan_tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            amount,
            timestamp: Date.now(),
            label: label || `${amount} scan credits`,
            type: 'purchase',
          }

          return {
            scanCreditsRemaining:
              state.scanCreditsRemaining === null ? null : state.scanCreditsRemaining + amount,
            totalScanCreditsPurchased: state.totalScanCreditsPurchased + amount,
            scanHistory: [tx, ...state.scanHistory].slice(0, 30),
          }
        }),

      setSubscriptionTier: (tier) =>
        set((state) => {
          const included = TIER_SCAN_CREDITS[tier]
          const tx: ScanTransaction = {
            id: `scan_tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            amount: included ?? 0,
            timestamp: Date.now(),
            label: `Tier switched to ${tier}`,
            type: 'tier-change',
          }
          return {
            subscriptionTier: tier,
            scanCreditsRemaining: included,
            scanHistory: [tx, ...state.scanHistory].slice(0, 30),
          }
        }),

      resetCredits: () => set(defaultState),
    }),
    {
      name: 'rnai-credits-zustand',
      storage: createJSONStorage(() => getPersistStorage()),
    }
  )
)

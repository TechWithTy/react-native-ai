type AdMobModule = {
  default: () => { initialize: () => Promise<unknown> }
  TestIds?: Record<string, string>
  InterstitialAd?: {
    createForAdRequest: (adUnitId: string, options?: Record<string, unknown>) => any
  }
  RewardedAd?: {
    createForAdRequest: (adUnitId: string, options?: Record<string, unknown>) => any
  }
  AdEventType?: {
    LOADED?: string
    CLOSED?: string
    ERROR?: string
  }
  RewardedAdEventType?: {
    EARNED_REWARD?: string
    LOADED?: string
  }
}

export type RewardedAdResult = 'earned' | 'closed_no_reward' | 'failed' | 'unavailable'
export type InterstitialAdResult = 'shown' | 'failed' | 'unavailable'

const FALLBACK_TEST_IDS = {
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
}

const requestOptions = {
  requestNonPersonalizedAdsOnly: true,
}

function hasAdMobNativeModule(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeModules, TurboModuleRegistry } = require('react-native') as {
      NativeModules?: Record<string, unknown>
      TurboModuleRegistry?: { get?: (name: string) => unknown }
    }

    // New Architecture path: only trust Turbo module registration.
    if (typeof TurboModuleRegistry?.get === 'function') {
      return !!TurboModuleRegistry.get('RNGoogleMobileAdsModule')
    }

    // Legacy architecture fallback.
    if (NativeModules?.RNGoogleMobileAdsModule) return true
  } catch {
    return false
  }

  return false
}

export function getAdMobRuntimeDiagnostics() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeModules, TurboModuleRegistry } = require('react-native') as {
      NativeModules?: Record<string, unknown>
      TurboModuleRegistry?: { get?: (name: string) => unknown }
    }

    const hasTurboRegistry = typeof TurboModuleRegistry?.get === 'function'
    const nativeModulesHasBridge = !!NativeModules?.RNGoogleMobileAdsModule
    const turboModuleAvailable = hasTurboRegistry
      ? !!TurboModuleRegistry.get('RNGoogleMobileAdsModule')
      : false
    const available = hasTurboRegistry ? turboModuleAvailable : nativeModulesHasBridge

    return {
      available,
      nativeModulesHasBridge,
      turboModuleAvailable,
      architecture: hasTurboRegistry ? 'new' : 'legacy',
    }
  } catch {
    return {
      available: false,
      nativeModulesHasBridge: false,
      turboModuleAvailable: false,
      architecture: 'unknown',
    }
  }
}

function getAdMobModule(): AdMobModule | null {
  if (!hasAdMobNativeModule()) return null
  try {
    return require('react-native-google-mobile-ads') as AdMobModule
  } catch {
    return null
  }
}

export function getAdMobTestIds() {
  const module = getAdMobModule()
  return {
    interstitial: module?.TestIds?.INTERSTITIAL || FALLBACK_TEST_IDS.INTERSTITIAL,
    rewarded: module?.TestIds?.REWARDED || FALLBACK_TEST_IDS.REWARDED,
    banner: module?.TestIds?.BANNER || FALLBACK_TEST_IDS.BANNER,
  }
}

export async function initializeAdMob(): Promise<boolean> {
  const module = getAdMobModule()
  if (!module?.default) return false
  try {
    await module.default().initialize()
    return true
  } catch {
    return false
  }
}

export async function showInterstitialAd(adUnitId?: string): Promise<InterstitialAdResult> {
  const module = getAdMobModule()
  if (!module?.InterstitialAd || !module?.AdEventType) return 'unavailable'

  const ids = getAdMobTestIds()
  const resolvedUnit = adUnitId || ids.interstitial
  const interstitial = module.InterstitialAd.createForAdRequest(resolvedUnit, requestOptions)

  return new Promise<InterstitialAdResult>((resolve) => {
    let shown = false

    const unsubscribeLoaded = interstitial.addAdEventListener(
      module.AdEventType?.LOADED,
      () => {
        shown = true
        interstitial.show()
      }
    )

    const unsubscribeClosed = interstitial.addAdEventListener(
      module.AdEventType?.CLOSED,
      () => {
        unsubscribeLoaded?.()
        unsubscribeClosed?.()
        unsubscribeError?.()
        resolve(shown ? 'shown' : 'failed')
      }
    )

    const unsubscribeError = interstitial.addAdEventListener(
      module.AdEventType?.ERROR,
      () => {
        unsubscribeLoaded?.()
        unsubscribeClosed?.()
        unsubscribeError?.()
        resolve('failed')
      }
    )

    interstitial.load()
  })
}

export async function showRewardedAd(adUnitId?: string): Promise<RewardedAdResult> {
  const module = getAdMobModule()
  if (!module?.RewardedAd || !module?.AdEventType || !module?.RewardedAdEventType) {
    return 'unavailable'
  }

  const ids = getAdMobTestIds()
  const resolvedUnit = adUnitId || ids.rewarded
  const rewarded = module.RewardedAd.createForAdRequest(resolvedUnit, requestOptions)

  return new Promise<RewardedAdResult>((resolve) => {
    let earned = false

    const unsubscribeLoaded = rewarded.addAdEventListener(
      module.RewardedAdEventType?.LOADED || module.AdEventType?.LOADED,
      () => {
        rewarded.show()
      }
    )

    const unsubscribeEarned = rewarded.addAdEventListener(
      module.RewardedAdEventType?.EARNED_REWARD,
      () => {
        earned = true
      }
    )

    const unsubscribeClosed = rewarded.addAdEventListener(
      module.AdEventType?.CLOSED,
      () => {
        unsubscribeLoaded?.()
        unsubscribeEarned?.()
        unsubscribeClosed?.()
        unsubscribeError?.()
        resolve(earned ? 'earned' : 'closed_no_reward')
      }
    )

    const unsubscribeError = rewarded.addAdEventListener(
      module.AdEventType?.ERROR,
      () => {
        unsubscribeLoaded?.()
        unsubscribeEarned?.()
        unsubscribeClosed?.()
        unsubscribeError?.()
        resolve('failed')
      }
    )

    rewarded.load()
  })
}

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CLTheme } from '../theme'
import { getAdMobRuntimeDiagnostics, getAdMobTestIds, initializeAdMob } from '../../../services/adMob'

type BannerAdSlotProps = {
  placement: string
  enabled?: boolean
}

export function BannerAdSlot({ placement, enabled = true }: BannerAdSlotProps) {
  const [failed, setFailed] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const [adModule, setAdModule] = React.useState<any>(null)
  const diagnostics = React.useMemo(() => getAdMobRuntimeDiagnostics(), [])

  if (!enabled) return null

  React.useEffect(() => {
    let mounted = true

    const loadAdModule = async () => {
      const isInitialized = await initializeAdMob()
      if (!mounted || !isInitialized) {
        setAdModule(null)
        return
      }

      try {
        setAdModule(require('react-native-google-mobile-ads'))
      } catch {
        setAdModule(null)
      }
    }

    void loadAdModule()
    return () => {
      mounted = false
    }
  }, [])

  const BannerAd = adModule?.BannerAd
  const BannerAdSize = adModule?.BannerAdSize
  const adUnitId = getAdMobTestIds().banner

  if (!BannerAd || !BannerAdSize) {
    return (
      <View style={styles.fallbackCard}>
        <Text style={styles.fallbackTitle}>Banner Ad Unavailable</Text>
        <Text style={styles.fallbackText}>Install native ads build to test banner placements.</Text>
        {__DEV__ ? (
          <Text style={styles.fallbackText}>
            Native module: {diagnostics.nativeModulesHasBridge ? 'bridge-ok' : 'bridge-missing'} | Turbo:{' '}
            {diagnostics.turboModuleAvailable ? 'ok' : 'missing'}
          </Text>
        ) : null}
        {__DEV__ ? <Text style={styles.placementText}>Placement: {placement}</Text> : null}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {__DEV__ ? <Text style={styles.placementText}>Ad placement: {placement}</Text> : null}
      <View style={styles.bannerWrap}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdLoaded={() => {
            setLoaded(true)
            setFailed(false)
          }}
          onAdFailedToLoad={() => {
            setFailed(true)
            setLoaded(false)
          }}
        />
      </View>
      {failed ? <Text style={styles.stateText}>Banner failed to load.</Text> : null}
      {!failed && !loaded ? <Text style={styles.stateText}>Loading banner ad...</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 10,
  },
  placementText: {
    color: CLTheme.text.muted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  bannerWrap: {
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: CLTheme.card,
    minHeight: 54,
    justifyContent: 'center',
  },
  stateText: {
    color: CLTheme.text.secondary,
    fontSize: 11,
  },
  fallbackCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: CLTheme.border,
    borderRadius: 10,
    backgroundColor: CLTheme.card,
    padding: 12,
    gap: 4,
  },
  fallbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: CLTheme.text.primary,
  },
  fallbackText: {
    color: CLTheme.text.secondary,
    fontSize: 12,
    lineHeight: 17,
  },
})

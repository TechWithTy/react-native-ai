import * as Location from 'expo-location'

export type LocationPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable'

export type DeviceLocationResult = {
  status: LocationPermissionStatus
  label?: string
  latitude?: number
  longitude?: number
}

type GeoAddress = {
  city?: string | null
  region?: string | null
  district?: string | null
}

const mapLocationStatus = (permission: {
  granted?: boolean
  status?: string
  canAskAgain?: boolean
}): LocationPermissionStatus => {
  if (permission.granted || permission.status === 'granted') return 'granted'
  if (permission.canAskAgain === false) return 'blocked'
  return 'denied'
}

export const formatGpsLocation = (latitude: number, longitude: number, geo?: GeoAddress) => {
  if (geo?.city && geo?.region) return `${geo.city}, ${geo.region}`
  if (geo?.city && geo?.district) return `${geo.city}, ${geo.district}`
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
}

export async function getCurrentDeviceLocation(): Promise<DeviceLocationResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync()
    const permissionStatus = mapLocationStatus(permission)
    if (permissionStatus !== 'granted') {
      return { status: permissionStatus }
    }

    const coords = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    })

    const geocoded = await Location.reverseGeocodeAsync({
      latitude: coords.coords.latitude,
      longitude: coords.coords.longitude,
    })

    const label = formatGpsLocation(
      coords.coords.latitude,
      coords.coords.longitude,
      geocoded?.[0]
        ? {
            city: geocoded[0].city,
            region: geocoded[0].region,
            district: geocoded[0].district,
          }
        : undefined
    )

    return {
      status: 'granted',
      label,
      latitude: coords.coords.latitude,
      longitude: coords.coords.longitude,
    }
  } catch {
    return { status: 'unavailable' }
  }
}

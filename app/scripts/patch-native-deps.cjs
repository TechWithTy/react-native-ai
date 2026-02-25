const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')

function patchGoogleMobileAdsAppJsonGradle() {
  const target = path.join(
    projectRoot,
    'node_modules',
    'react-native-google-mobile-ads',
    'android',
    'app-json.gradle'
  )

  if (!fs.existsSync(target)) return false

  const patched = `import groovy.json.JsonOutput
import groovy.json.JsonSlurper

String fileName = "app.json"
String jsonRoot = "react-native-google-mobile-ads"
String jsonRaw = "GOOGLE_MOBILE_ADS_JSON_RAW"

File jsonFile = null
File parentDir = rootProject.projectDir

for (int i = 0; i <= 3; i++) {
  if (parentDir == null) break
  parentDir = parentDir.parentFile
  if (parentDir != null) {
    jsonFile = new File(parentDir, fileName)
    if (jsonFile.exists()) break
  }
}

if (jsonFile != null && jsonFile.exists()) {
  rootProject.logger.info ":\${project.name} \${fileName} found at \${jsonFile.toString()}"
  Object json = null

  try {
    json = new JsonSlurper().parseText(jsonFile.text)
  } catch (Exception ignored) {
    rootProject.logger.warn ":\${project.name} failed to parse \${fileName} found at \${jsonFile.toString()}."
    rootProject.logger.warn ignored.toString()
  }

  def googleMobileAdsRaw = null
  if (json && json[jsonRoot]) {
    googleMobileAdsRaw = json[jsonRoot]
  } else if (json && json["expo"] && json["expo"]["plugins"] instanceof List) {
    for (def pluginEntry : json["expo"]["plugins"]) {
      if (pluginEntry instanceof List && pluginEntry.size() >= 2 && pluginEntry[0] == "react-native-google-mobile-ads" && pluginEntry[1] instanceof Map) {
        def expoPluginConfig = pluginEntry[1]
        googleMobileAdsRaw = [
          android_app_id: expoPluginConfig.androidAppId ?: "",
          ios_app_id: expoPluginConfig.iosAppId ?: "",
          delay_app_measurement_init: expoPluginConfig.delayAppMeasurementInit == true,
          optimize_initialization: expoPluginConfig.optimizeInitialization != false,
          optimize_ad_loading: expoPluginConfig.optimizeAdLoading != false
        ]
        break
      }
    }
  }

  if (googleMobileAdsRaw) {
    String jsonStr = JsonOutput.toJson(JsonOutput.toJson(googleMobileAdsRaw))

    rootProject.ext.googleMobileAdsJson = [
      raw: googleMobileAdsRaw,
      isFlagEnabled: { key, defaultValue ->
        if (googleMobileAdsRaw == null || googleMobileAdsRaw[key] == null) return defaultValue
        return googleMobileAdsRaw[key] == true ? true : false
      },
      getStringValue: { key, defaultValue ->
        if (googleMobileAdsRaw == null) return defaultValue
        return googleMobileAdsRaw[key] ? googleMobileAdsRaw[key] : defaultValue
      }
    ]

    rootProject.logger.info ":\${project.name} resolved \${jsonRoot} config from app.json/expo.plugins"
    android {
      defaultConfig {
        buildConfigField "String", jsonRaw, jsonStr
      }
    }
  } else {
    rootProject.ext.googleAdsJson = false
    rootProject.logger.info ":\${project.name} \${fileName} found with no \${jsonRoot} config, skipping"
    android {
      defaultConfig {
        buildConfigField "String", jsonRaw, '"{}"'
      }
    }
  }
} else {
  rootProject.ext.googleMobileAdsJson = false
  rootProject.logger.info ":\${project.name} no \${fileName} found, skipping"
  android {
    defaultConfig {
      buildConfigField "String", jsonRaw, '"{}"'
    }
  }
}
`

  const current = fs.readFileSync(target, 'utf8')
  if (current === patched) return false
  fs.writeFileSync(target, patched, 'utf8')
  return true
}

function patchManifestPackageAttribute(relativePath) {
  const target = path.join(projectRoot, relativePath)
  if (!fs.existsSync(target)) return false
  const current = fs.readFileSync(target, 'utf8')
  const updated = current.replace(/<manifest([^>]*?)\s+package=\"[^\"]+\"([^>]*)>/, '<manifest$1$2>')
  if (updated === current) return false
  fs.writeFileSync(target, updated, 'utf8')
  return true
}

function patchManifestAttribute(relativePath, attributePattern) {
  const target = path.join(projectRoot, relativePath)
  if (!fs.existsSync(target)) return false
  const current = fs.readFileSync(target, 'utf8')
  const updated = current.replace(attributePattern, '')
  if (updated === current) return false
  fs.writeFileSync(target, updated, 'utf8')
  return true
}

function main() {
  const changed = []

  if (patchGoogleMobileAdsAppJsonGradle()) {
    changed.push('react-native-google-mobile-ads/android/app-json.gradle')
  }

  const manifestTargets = [
    'node_modules/@react-native-async-storage/async-storage/android/src/main/AndroidManifest.xml',
    'node_modules/react-native-google-mobile-ads/android/src/main/AndroidManifest.xml',
    'node_modules/react-native-safe-area-context/android/src/main/AndroidManifest.xml',
    'node_modules/react-native-get-random-values/android/src/main/AndroidManifest.xml',
  ]

  for (const manifestPath of manifestTargets) {
    if (patchManifestPackageAttribute(manifestPath)) {
      changed.push(manifestPath)
    }
  }

  if (
    patchManifestAttribute(
      'node_modules/expo-file-system/android/src/main/AndroidManifest.xml',
      /\s+tools:replace=\"android:authorities\"/g
    )
  ) {
    changed.push('node_modules/expo-file-system/android/src/main/AndroidManifest.xml')
  }

  if (
    patchManifestAttribute(
      'node_modules/expo-image-picker/android/src/main/AndroidManifest.xml',
      /\s+tools:replace=\"android:exported\"/g
    )
  ) {
    changed.push('node_modules/expo-image-picker/android/src/main/AndroidManifest.xml')
  }

  if (changed.length > 0) {
    console.log(`[patch-native-deps] Applied patches:\\n- ${changed.join('\\n- ')}`)
  } else {
    console.log('[patch-native-deps] No dependency patches were needed.')
  }
}

main()

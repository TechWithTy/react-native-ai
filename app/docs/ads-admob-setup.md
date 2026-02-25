# AdMob Setup (Career Lift)

This app uses `react-native-google-mobile-ads` for in-app ads.

## 1) Install dependency

```bash
pnpm -C app install
```

The dependency is already added in `app/package.json`:
- `react-native-google-mobile-ads`

## 2) Expo config plugin

Configured in `app/app.json` plugins:
- `react-native-google-mobile-ads`
- Includes test App IDs for Android/iOS by default.

Before production release, replace these with your real AdMob App IDs.

## 3) iOS pods (if building iOS)

```bash
pnpm -C app ios
```

If needed:

```bash
cd app/ios && pod install
```

## 4) Rebuild native app

Because this is a native module, rebuild after install/config changes:

```bash
pnpm -C app android
# or
pnpm -C app ios
```

## 5) Runtime behavior

- Rewarded ad flow is used when users are out of:
  - AI credits
  - scan credits
- Core ad wrapper:
  - `src/services/adMob.ts`
- Reusable rewarded UI:
  - `src/screens/careerLift/components/rewardedAdDrawer.tsx`

## 6) Dev testing mode

In **Settings**:
- Enable `Ads Debug Mode` (dev-only toggle)
- Open `Prompts & Paywalls` to test:
  - SDK initialization
  - Interstitial ad
  - Rewarded ad

## 7) Test IDs

Google test IDs are used for safety in development.
Do not ship test IDs in production ad units.


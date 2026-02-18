# Android Metro Stability Runbook

This runbook prevents and fixes recurring Android emulator startup crashes like:

- `JSBigFileString::fromPath - Could not open file:`
- `Compiling JS failed ... invalid expression`

## Root Cause

The emulator was trying to connect to Metro on a LAN IP (for example `10.x.x.x:8081`) and failing.
When Metro is unreachable, React Native can fall back to a file loader path that is empty, which throws:

`JSBigFileString::fromPath - Could not open file:`

## What Is Already Enforced In This Repo

`pnpm -C app start` now uses `app/scripts/start-safe.cjs`, which:

1. validates critical Babel dependencies before startup
2. forces a clean Metro cache start (`expo start --clear`)
3. defaults to `--localhost`
4. auto-runs `adb reverse tcp:8081 tcp:8081`
5. runs in stable mode (`CI=1`) by default to reduce hot-update parse failures

## Standard Startup (Use This Every Time)

From repo root:

```powershell
pnpm -C app start
```

Then launch the app on emulator:

```powershell
adb shell monkey -p com.anonymous.app -c android.intent.category.LAUNCHER 1
```

## If You Want HMR Back

Stable mode disables reload interactions by default.
To enable HMR for a session:

```powershell
$env:ALLOW_HMR="1"; pnpm -C app start
```

## Fast Recovery (If App Fails To Load JS)

Run in order:

```powershell
adb reverse tcp:8081 tcp:8081
adb shell am force-stop com.anonymous.app
adb shell pm clear com.anonymous.app
pnpm -C app run repair:deps
pnpm -C app start
```

## Verification Commands

```powershell
adb reverse --list
curl http://localhost:8081/status
```

Expected:

- reverse list contains `tcp:8081 tcp:8081`
- Metro status returns `packager-status:running`

## Do Not Do

- Do not start app dev with `npm` or `yarn` in `app/`.
- Do not bypass `pnpm -C app start` with raw `expo start` unless debugging startup behavior.
- Do not keep multiple Metro instances running on different ports.

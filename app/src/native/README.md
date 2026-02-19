# Native Capabilities Setup

This folder centralizes native capability support for Career Lift so screens do not duplicate permission logic.

## Structure

- `capabilities/registry.ts`
- `capabilities/usageMap.ts`
- `permissions/notifications.ts`
- `permissions/location.ts`
- `permissions/media.ts`
- `permissions/biometrics.ts`

## Current capability coverage

- Notifications (`expo-notifications`)
- GPS / foreground location (`expo-location`)
- Document upload (`expo-document-picker`)
- Media library and camera request flow scaffold (`expo-image-picker`, `expo-camera`)
- Microphone recording (`expo-audio`)
- Speech synthesis (`expo-speech`)
- Clipboard (`expo-clipboard`)
- Face ID / biometrics (`expo-local-authentication`)

## Usage pattern

1. Screens import permission helpers from `src/native/permissions/*`.
2. Helpers normalize permission results (`granted`, `denied`, `blocked`, `unavailable`).
3. UI shows consistent alerts while store/state updates remain in screen/store logic.

## Notes

- Biometric and media helpers use runtime module detection (`require(...)`) to prevent hard crashes if a native package install is incomplete.
- If dependencies become corrupted during development, run:

```bash
pnpm -C app run native:doctor
pnpm -C app run repair:deps
```

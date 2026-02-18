# Running Locally (Windows + Android)

For repeated emulator bundle failures (`JSBigFileString::fromPath`, invalid expression), see:
[docs/android-metro-stability/README.md](docs/android-metro-stability/README.md)

## Prereqs
- Android Studio with SDK, NDK 26.1.10909125, and CMake 3.22.1
- Java 17
- Node.js and pnpm
- Android emulator or device

## Windows Path Length
- Keep the repo in a short path, for example C:\rn\react-native-ai.
- Enable long paths (admin required):
    `reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f`
- Reboot or sign out/in after enabling.

## Install
```powershell
cd app
pnpm install
cd ..\server
pnpm install
```

## Server
```powershell
cd server
copy .env.example .env
pnpm run dev
```

## Android App
1.  **Start Metro Bundler:**
    ```powershell
    cd app
    pnpm start --clear
    # OR if using root context: pnpm -C app start --clear -c
    ```

2.  **Launch on Android:**
    Press `a` in the Metro terminal.

    *Note: If the Expo build fails with native path errors, clean (`cd android && ./gradlew clean`) and rebuild.*

## Troubleshooting

### 1. "No package.json found" or "Unable to find expo"
**Cause:** Running commands from the project root instead of the `app/` directory.
**Fix:** Always `cd app` before running React Native commands.

### 2. Emulator Crash: `java.lang.NullPointerException ... StorageManagerService`
**Cause:** Emulator internal storage corruption (common with repeated installs/uninstalls).
**Fix:**
1.  Open Android Studio > Device Manager.
2.  Find your emulator (e.g., `Pixel_7_Pro_API_35`).
3.  Click the menu (dots) -> **Wipe Data**.
4.  Cold Boot the emulator.

### 3. Watcher Error: `ENOENT: no such file or directory ... node_modules`
**Cause:** Corrupted `node_modules` (e.g., interrupted install or partial deletion).
**Fix:**
```powershell
cd app
Remove-Item -Recurse -Force node_modules
pnpm install
pnpm start --clear
```

### 4. App Stuck on "Opening on Android..."
**Cause:** ADB connection issues or hung process.
**Fix:**
```powershell
adb kill-server
adb start-server
adb reverse tcp:8081 tcp:8081
```
Then try pressing `a` again in Metro.


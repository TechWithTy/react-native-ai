# Running Locally (Windows + Android

For repeated emulator bundle failures (`JSBigFileString::fromPath`, invalid expression), see:
`docs/android-metro-stability/README.md`
 
## Prereqs 
- Android Studio with SDK, NDK 26.1.10909125, and CMake 3.22.1 
- Java 17 
- Node.js and pnpm 
- Android emulator or device 
 
## Windows Path Length 
- Keep the repo in a short path, for example C:\rn\react-native-ai. 
- Enable long paths (admin required): 
    reg add \"HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\" /v LongPathsEnabled /t REG_DWORD /d 1 /f 
- Reboot or sign out/in after enabling. 
 
## Install 
    cd C:\rn\react-native-ai\app 
    pnpm install 
    cd ..\server 
    pnpm install 
 
## Server 
    cd C:\rn\react-native-ai\server 
    copy .env.example .env 
    pnpm run dev 
 
## Android App 
    cd C:\rn\react-native-ai\app 
    pnpm run android 
 
If the Expo build fails with Reanimated native path errors, run Gradle directly and target x86_64: 
    cd C:\rn\react-native-ai\app\android 
    gradlew.bat app:installDebug -x lint -x test -PreactNativeArchitectures=x86_64 -PreactNativeDevServerPort=8081 
 
Then start Metro: 
    cd C:\rn\react-native-ai\app 
    pnpm start)

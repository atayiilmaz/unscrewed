#!/usr/bin/env bash
# Build the web app, sync it into the Android project, then build, install and launch on a
# USB-connected phone (USB debugging on).   npm run android      -> bundled build
#                                           npm run android:dev  -> live reload from this Mac
set -euo pipefail
cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME_21:-/Applications/Android Studio.app/Contents/jbr/Contents/Home}"
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
APP_ID=io.peax.unscrewed

if [ "${1:-bundle}" = dev ]; then
  IP="$(ipconfig getifaddr en0 || ipconfig getifaddr en1)"
  export CAP_SERVER="http://$IP:5199"
  echo "Live reload from $CAP_SERVER (keep 'npm run dev -- --host' running)"
else
  npm run build
  rm -rf dist/ota # the OTA zip is for the website, not for inside the app
fi

npx cap sync android
(cd android && ./gradlew assembleDebug -q)
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"

if [ -z "$("$ADB" devices | sed 1d | grep -w device || true)" ]; then
  echo "No Android phone connected over USB (with USB debugging allowed). APK is built; install it manually." >&2
  exit 0
fi
"$ADB" install -r android/app/build/outputs/apk/debug/app-debug.apk >/dev/null
"$ADB" shell monkey -p "$APP_ID" -c android.intent.category.LAUNCHER 1 >/dev/null 2>&1
echo "Launched Unscrewed! on the Android phone."

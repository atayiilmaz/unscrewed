#!/usr/bin/env bash
# Build the web app, sync it into the iOS project, then build, install and launch on a plugged-in
# or Wi-Fi-paired iPhone.   npm run ios         -> bundled build (works offline, like the store app)
#                           npm run ios:dev     -> live reload from the Vite dev server on this Mac
set -euo pipefail
cd "$(dirname "$0")/.."

MODE="${1:-bundle}"
BUNDLE_ID=io.peax.unscrewed

DEVICE="${IOS_DEVICE:-$(xcrun devicectl list devices 2>/dev/null | grep 'available (paired)' | grep -m1 iPhone | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' || true)}"
if [ -z "$DEVICE" ]; then
  echo "No paired iPhone found. Plug it in (or join the same Wi-Fi), unlock it and trust this Mac." >&2
  exit 1
fi

if [ "$MODE" = dev ]; then
  IP="$(ipconfig getifaddr en0 || ipconfig getifaddr en1)"
  export CAP_SERVER="http://$IP:5199"
  echo "Live reload from $CAP_SERVER (keep 'npm run dev -- --host' running)"
else
  npm run build
fi

npx cap sync ios
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -destination "id=$DEVICE" -derivedDataPath ios/App/build -allowProvisioningUpdates -quiet build
xcrun devicectl device install app --device "$DEVICE" ios/App/build/Build/Products/Debug-iphoneos/App.app >/dev/null
xcrun devicectl device process launch --device "$DEVICE" "$BUNDLE_ID" >/dev/null
echo "Launched Unscrewed! on the iPhone."

import type { CapacitorConfig } from '@capacitor/cli'

// Live reload on a device: CAP_SERVER=http://<mac-ip>:5199 npx cap run ios
const server = process.env.CAP_SERVER

const config: CapacitorConfig = {
  appId: 'io.peax.unscrewed',
  appName: 'Unscrewed!',
  webDir: 'dist',
  backgroundColor: '#18213d',
  ios: { contentInset: 'never', scrollEnabled: false },
  ...(server ? { server: { url: server, cleartext: true } } : {}),
}

export default config

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.netlify.chat_zk.app',
  appName: 'Chat Anónimo ZK',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tekirstudios.lokumblast',
  appName: 'Lokum Blast',
  webDir: 'dist',
  backgroundColor: '#1a1238',
  ios: {
    contentInset: 'never',
    backgroundColor: '#1a1238',
  },
  android: {
    backgroundColor: '#1a1238',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#1a1238',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
  },
};

export default config;

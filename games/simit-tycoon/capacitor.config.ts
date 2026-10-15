import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tekirstudios.simittycoon',
  appName: 'Simit Tycoon',
  webDir: 'dist',
  backgroundColor: '#0f3550',
  ios: {
    contentInset: 'never',
    backgroundColor: '#0f3550',
  },
  android: {
    backgroundColor: '#0f3550',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0f3550',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_simit',
      iconColor: '#e8892e',
    },
  },
};

export default config;

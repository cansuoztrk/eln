import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tekirstudios.bookcat',
  appName: 'Bookcat',
  webDir: 'dist',
  backgroundColor: '#3a2414',
  ios: {
    contentInset: 'never',
    backgroundColor: '#3a2414',
  },
  android: {
    backgroundColor: '#3a2414',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#3a2414',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_bookcat',
      iconColor: '#e7bd5b',
    },
  },
};

export default config;

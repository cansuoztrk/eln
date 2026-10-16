import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tekirstudios.lale',
  appName: 'Lale',
  webDir: 'dist',
  backgroundColor: '#fbf6ee',
  ios: {
    contentInset: 'never',
    backgroundColor: '#fbf6ee',
  },
  android: {
    backgroundColor: '#fbf6ee',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      launchAutoHide: true,
      backgroundColor: '#fbf6ee',
      showSpinner: false,
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_lale',
      iconColor: '#d7263d',
    },
  },
};

export default config;

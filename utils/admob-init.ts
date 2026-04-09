import { Platform } from 'react-native';

export function initializeAds() {
  if (Platform.OS === 'web') return;
  try {
    const mobileAds = require('react-native-google-mobile-ads').default;
    mobileAds()
      .initialize()
      .then(() => {
        console.log('AdMob SDK initialized');
      })
      .catch((err: any) => {
        console.log('AdMob init error:', err);
      });
  } catch (e) {
    console.log('AdMob not available');
  }
}

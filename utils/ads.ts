import { Platform } from 'react-native';

/**
 * 広告ユニットIDを環境変数から取得するユーティリティ
 * IDが未設定の場合は undefined を返す → 広告は表示されない
 */

export function getBannerAdUnitId(): string | undefined {
  const id = Platform.select({
    android: process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID,
    ios: process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS,
  });
  return id || undefined;
}

export function getInterstitialAdUnitId(): string | undefined {
  const id = Platform.select({
    android: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID,
    ios: process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS,
  });
  return id || undefined;
}

/** 広告が利用可能かどうか（ネイティブ環境 + IDが設定されている） */
export function isAdsAvailable(): boolean {
  return Platform.OS !== 'web';
}

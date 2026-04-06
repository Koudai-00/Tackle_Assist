import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { getBannerAdUnitId, isAdsAvailable } from '../../utils/ads';
import { Colors } from '../../constants/theme';

let BannerAdComponent: any = null;
let BannerAdSize: any = null;

// ネイティブ環境でのみインポート（Expo Goやwebではエラー回避）
if (Platform.OS !== 'web') {
  try {
    const admob = require('react-native-google-mobile-ads');
    BannerAdComponent = admob.BannerAd;
    BannerAdSize = admob.BannerAdSize;
  } catch (e) {
    // Expo Go等でネイティブモジュールが利用不可
  }
}

interface AdBannerProps {
  style?: any;
}

/**
 * バナー広告コンポーネント
 * - 広告IDが未設定 or Web環境 → 何も表示しない
 * - Expo Go → 何も表示しない（ネイティブモジュールなし）
 */
export default function AdBanner({ style }: AdBannerProps) {
  const adUnitId = getBannerAdUnitId();

  if (!isAdsAvailable() || !adUnitId || !BannerAdComponent) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAdComponent
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(error: any) => {
          console.log('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
});

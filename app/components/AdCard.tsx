import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getBannerAdUnitId, isAdsAvailable } from '../../utils/ads';
import { Colors } from '../../constants/theme';

let BannerAdComponent: any = null;
let BannerAdSize: any = null;

if (Platform.OS !== 'web') {
  try {
    const admob = require('react-native-google-mobile-ads');
    BannerAdComponent = admob.BannerAd;
    BannerAdSize = admob.BannerAdSize;
  } catch (e) {
    // Expo Go等でネイティブモジュールが利用不可
  }
}

/**
 * リスト内に挿入するカード形式の広告
 * アプリのカードUIに馴染むデザイン
 */
export default function AdCard() {
  const adUnitId = getBannerAdUnitId();

  if (!isAdsAvailable() || !adUnitId || !BannerAdComponent) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.adLabel}>広告</Text>
      <View style={styles.adContainer}>
        <BannerAdComponent
          unitId={adUnitId}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={(error: any) => {
            console.log('Card ad failed to load:', error);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  adLabel: {
    fontSize: 10,
    color: Colors.dark.icon,
    marginBottom: 6,
    textAlign: 'right',
  },
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
});

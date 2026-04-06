import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { getInterstitialAdUnitId, isAdsAvailable } from '../utils/ads';

/**
 * インタースティシャル広告を管理するカスタムフック
 * 
 * 使い方:
 *   const { showAd, isAdReady } = useInterstitialAd();
 *   
 *   const handlePress = () => {
 *     showAd(() => {
 *       // 広告が閉じられた後（or 広告なしの場合すぐ）に実行される処理
 *       doSomething();
 *     });
 *   };
 */
export function useInterstitialAd() {
  const [isAdReady, setIsAdReady] = useState(false);
  const interstitialRef = useRef<any>(null);
  const onCloseCallbackRef = useRef<(() => void) | null>(null);

  const adUnitId = getInterstitialAdUnitId();
  const available = isAdsAvailable() && !!adUnitId;

  const loadAd = useCallback(() => {
    if (!available || Platform.OS === 'web') return;

    try {
      const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
      
      const interstitial = InterstitialAd.createForAdRequest(adUnitId!, {
        requestNonPersonalizedAdsOnly: true,
      });

      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        setIsAdReady(true);
      });

      interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        setIsAdReady(false);
        // 広告が閉じられたら、コールバックを実行
        if (onCloseCallbackRef.current) {
          onCloseCallbackRef.current();
          onCloseCallbackRef.current = null;
        }
        // 次の広告をプリロード
        loadAd();
      });

      interstitial.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.log('Interstitial ad error:', error);
        setIsAdReady(false);
        // エラー時もコールバックを実行（広告なしで処理続行）
        if (onCloseCallbackRef.current) {
          onCloseCallbackRef.current();
          onCloseCallbackRef.current = null;
        }
      });

      interstitial.load();
      interstitialRef.current = interstitial;
    } catch (e) {
      // Expo Go等ではネイティブモジュール利用不可
      console.log('Interstitial ad not available');
    }
  }, [available, adUnitId]);

  useEffect(() => {
    loadAd();
    return () => {
      // クリーンアップ
      interstitialRef.current = null;
    };
  }, [loadAd]);

  const showAd = useCallback((onComplete: () => void) => {
    if (isAdReady && interstitialRef.current) {
      onCloseCallbackRef.current = onComplete;
      interstitialRef.current.show();
    } else {
      // 広告が準備できていない場合はそのまま処理を実行
      onComplete();
    }
  }, [isAdReady]);

  return { showAd, isAdReady };
}

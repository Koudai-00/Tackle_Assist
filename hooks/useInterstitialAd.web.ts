import { useCallback } from 'react';

export function useInterstitialAd() {
  const showAd = useCallback((onComplete: () => void) => {
    onComplete();
  }, []);

  return { showAd, isAdReady: true };
}

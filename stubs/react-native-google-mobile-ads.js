module.exports = {
  BannerAd: () => null,
  BannerAdSize: {
    ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
    BANNER: 'BANNER',
    FULL_BANNER: 'FULL_BANNER',
    LARGE_BANNER: 'LARGE_BANNER',
    LEADERBOARD: 'LEADERBOARD',
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  },
  InterstitialAd: {
    createForAdRequest: () => ({
      load: () => {},
      show: () => {},
      addAdEventListener: () => () => {},
    }),
  },
  RewardedAd: {
    createForAdRequest: () => ({
      load: () => {},
      show: () => {},
      addAdEventListener: () => () => {},
    }),
  },
  AdEventType: {
    LOADED: 'loaded',
    ERROR: 'error',
    OPENED: 'opened',
    CLICKED: 'clicked',
    CLOSED: 'closed',
  },
  RewardedAdEventType: {
    LOADED: 'loaded',
    EARNED_REWARD: 'earned_reward',
  },
  TestIds: {
    BANNER: 'test-banner-id',
    INTERSTITIAL: 'test-interstitial-id',
    REWARDED: 'test-rewarded-id',
  },
  default: {
    initialize: () => Promise.resolve(),
  },
};

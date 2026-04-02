import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getBaseUrl = () => {
  if (Platform.OS === 'web') return '';
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  
  // Expo Goで実機稼働時のホストURIを自動で導出します (例: 192.168.0.91:8081)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri.split('/')[0]}`;
  }
  
  // エミュレーター等のフォールバック
  return 'http://localhost:8081';
};

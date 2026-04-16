import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { Platform } from 'react-native';

const IDENTITY_KEY = 'fishing_agent_user_uuid';

/**
 * 初回起動時にUUIDを生成・保存し、次回以降は保存されたものを返す関数
 */
export async function getOrGenerateIdentity(): Promise<string> {
  try {
    // 開発時のWeb環境ではSecureStoreは非対応のため、localStorageをフォールバックに使う
    if (Platform.OS === 'web') {
      let uuid = localStorage.getItem(IDENTITY_KEY);
      if (!uuid) {
        uuid = uuidv4();
        localStorage.setItem(IDENTITY_KEY, uuid);
      }
      return uuid;
    }

    // iOS / Android (ネイティブ) 環境
    let uuid = await SecureStore.getItemAsync(IDENTITY_KEY);
    if (!uuid) {
      uuid = uuidv4();
      await SecureStore.setItemAsync(IDENTITY_KEY, uuid);
    }
    return uuid;
  } catch (error) {
    console.error('Error managing identity (UUID):', error);
    // 何らかのエラー起因で保存不能な場合は、一時的なUUIDを返す (アプリ利用は止めない)
    return uuidv4(); 
  }
}

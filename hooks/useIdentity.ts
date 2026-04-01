import { useState, useEffect } from 'react';
import { getOrGenerateIdentity } from '../lib/identity';
import { Platform } from 'react-native';

export function useIdentity() {
  const [uuid, setUuid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initIdentity() {
      try {
        // 1. セキュアストアからUUID取得・生成
        const myUuid = await getOrGenerateIdentity();
        setUuid(myUuid);
        
        // 2. Neonバックエンド(API Route)へUUIDの存在通知・登録
        // ExpoモバイルアプリからローカルのAPI Routesを叩く場合、DEV環境ではフルURLが必要な場合があるため
        // ここでは簡単に同一ホスト判定（Web想定またはProduction）としてフェッチを行います。
        const apiUrl = Platform.OS === 'web' 
            ? '/api/auth' 
            : `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8081'}/api/auth`;
        
        try {
          await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid: myUuid })
          });
        } catch (apiError) {
          console.warn('Backend Auth API call failed. Running offline?', apiError);
          // オフライン・エラー時でもUUIDはあるのでUIはブロックしない
        }

      } catch (err) {
        console.error('Failed to init identity state', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    initIdentity();
  }, []);

  return { uuid, isLoading };
}

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// このファイルはセキュリティ上、フロントエンド（Reactコンポーネント）から直接importしてはいけません。
// 必ず app/api/... (+api.ts) などのバックエンドAPIルートからのみ呼び出してください。

// 環境変数からDATABASE_URLを取得
// ユーザーが .env または .env.local に入れた値を使用
const databaseUrl = process.env.DATABASE_URL || process.env.EXPO_PUBLIC_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Database URL is not defined in environment variables.');
}

// neon-http ドライバー経由で接続を確立
const sql = neon(databaseUrl);
export const db = drizzle(sql);

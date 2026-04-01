import { db } from '../../lib/db';
import { users } from '../../db/schema';

// POST /api/auth
// アプリフロントエンドのフック (useIdentity) からUUIDを受け取り、ユーザーテーブルに登録（UPSERT）する
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uuid } = body;

    if (!uuid) {
      return Response.json({ error: 'UUID is required' }, { status: 400 });
    }

    // 匿名ユーザーIDをNeon DBに登録（既に紐付いていれば何もせずに成功扱い: DB側のエラーを防ぐ）
    await db.insert(users)
      .values({ 
        id: uuid, 
        settings: { isAnonymous: true }
      })
      .onConflictDoNothing({ target: users.id });

    return Response.json({ success: true, uuid });

  } catch (error) {
    console.error('API Error (auth):', error);
    return Response.json({ error: 'Failed to authenticate user on DB' }, { status: 500 });
  }
}

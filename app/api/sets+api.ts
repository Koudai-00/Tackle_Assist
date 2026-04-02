import { db } from '../../lib/db';
import { favoriteSets, favoriteSetItems } from '../../db/schema';
import { eq } from 'drizzle-orm';

// ユーザーのお気に入りセット全件取得
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const sets = await db.select().from(favoriteSets).where(eq(favoriteSets.userId, userId));
    return Response.json({ sets });
  } catch (err) {
    console.error("Sets GET Error", err);
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

// 新規セット作成（AI提案結果をそのまま保存などにも利用）
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, description, itemIds } = body;

    // ヘッダー（セット自体）の作成
    const [newSet] = await db.insert(favoriteSets).values({
      userId,
      name,
      description: description || ''
    }).returning();

    // 属するアイテム群を中間テーブルへ一括保存
    if (itemIds && Array.isArray(itemIds) && itemIds.length > 0) {
      const inserts = itemIds.map(id => ({
        setId: newSet.id,
        itemId: id,
        requiredQuantity: 1
      }));
      await db.insert(favoriteSetItems).values(inserts);
    }

    return Response.json({ success: true, set: newSet });
  } catch (err) {
    console.error("Sets POST Error", err);
    return Response.json({ error: 'Creation failed' }, { status: 500 });
  }
}

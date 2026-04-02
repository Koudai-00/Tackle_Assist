import { db } from '../../lib/db';
import { favoriteSets, favoriteSetItems, inventoryItems } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

// お気に入りセット取得 (全件 または 特定の1件の全アイテム)
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const setId = url.searchParams.get('id');

    if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });

    if (setId) {
      // 特定のセットの詳細とアイテム一覧を結合して取得
      const set = await db.query.favoriteSets.findFirst({
        where: and(eq(favoriteSets.id, setId), eq(favoriteSets.userId, userId))
      });
      if (!set) return Response.json({ error: 'Set not found' }, { status: 404 });

      const items = await db.select({
        id: favoriteSetItems.id,
        itemId: favoriteSetItems.itemId,
        name: inventoryItems.name,
        requiredQuantity: favoriteSetItems.requiredQuantity,
        category: inventoryItems.category,
      })
      .from(favoriteSetItems)
      .innerJoin(inventoryItems, eq(favoriteSetItems.itemId, inventoryItems.id))
      .where(eq(favoriteSetItems.setId, setId));

      return Response.json({ set, items });
    } else {
      // 全件取得
      const sets = await db.select().from(favoriteSets).where(eq(favoriteSets.userId, userId));
      return Response.json({ sets });
    }
  } catch (err) {
    console.error("Sets GET Error", err);
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, description, items } = body; // items: [{itemId, requiredQuantity}]

    const [newSet] = await db.insert(favoriteSets).values({
      userId,
      name,
      description: description || ''
    }).returning();

    if (items && Array.isArray(items) && items.length > 0) {
      const inserts = items.map(item => ({
        setId: newSet.id,
        itemId: item.itemId,
        requiredQuantity: item.requiredQuantity || 1
      }));
      await db.insert(favoriteSetItems).values(inserts);
    }

    return Response.json({ success: true, set: newSet });
  } catch (err) {
    console.error("Sets POST Error", err);
    return Response.json({ error: 'Creation failed' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, items } = body;

    await db.update(favoriteSets)
      .set({ name, description, updatedAt: new Date() } as any)
      .where(eq(favoriteSets.id, id));

    if (items && Array.isArray(items)) {
      // 一旦全削除して入れ替え
      await db.delete(favoriteSetItems).where(eq(favoriteSetItems.setId, id));
      if (items.length > 0) {
        const inserts = items.map(item => ({
          setId: id,
          itemId: item.itemId,
          requiredQuantity: item.requiredQuantity || 1
        }));
        await db.insert(favoriteSetItems).values(inserts);
      }
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Sets PATCH Error", err);
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    // 中間テーブルも連鎖削除（DB側の参照制約に依存するか、手動で消す）
    await db.delete(favoriteSetItems).where(eq(favoriteSetItems.setId, id));
    await db.delete(favoriteSets).where(eq(favoriteSets.id, id));

    return Response.json({ success: true });
  } catch (err) {
    console.error("Sets DELETE Error", err);
    return Response.json({ error: 'Delete failed' }, { status: 500 });
  }
}

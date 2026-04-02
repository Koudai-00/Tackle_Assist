import { db } from '../../../lib/db';
import { inventoryItems } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/inventory/lost
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, itemId, amount } = body;
    const decreaseAmount = amount ? parseInt(amount, 10) : 1;

    if (!userId || !itemId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. 現在の在庫状態を取得
    const currentItem = await db
      .select({ quantity: inventoryItems.quantity })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.userId, userId)))
      .limit(1);

    if (currentItem.length === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    // 0を下回らないように計算
    const newQuantity = Math.max(0, currentItem[0].quantity - decreaseAmount);

    // 2. 在庫の更新
    await db.update(inventoryItems)
      .set({ quantity: newQuantity })
      .where(eq(inventoryItems.id, itemId));
      
    // バックエンド側では買い物リストへ勝手に入れない（フロントエンド側で判断する）
    return Response.json({ success: true, newQuantity });
  } catch (err) {
    console.error('Lost item error:', err);
    return Response.json({ error: 'Failed to process lost item' }, { status: 500 });
  }
}

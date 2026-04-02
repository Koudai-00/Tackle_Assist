import { db } from '../../../lib/db';
import { inventoryItems } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/inventory/replenish
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, itemId, amount } = body;
    const incrementAmount = amount ? parseInt(amount, 10) : 1;

    if (!userId || !itemId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. 現在の在庫状態を取得
    const currentItems = await db
      .select({ quantity: inventoryItems.quantity })
      .from(inventoryItems)
      .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.userId, userId)))
      .limit(1);

    if (currentItems.length === 0) {
      return Response.json({ error: 'Item not found' }, { status: 404 });
    }

    const newQuantity = currentItems[0].quantity + incrementAmount;

    // 2. 在庫の更新
    await db.update(inventoryItems)
      .set({ quantity: newQuantity })
      .where(eq(inventoryItems.id, itemId));
      
    return Response.json({ success: true, newQuantity });
  } catch (err) {
    console.error('Replenish item error:', err);
    return Response.json({ error: 'Failed to process replenish item' }, { status: 500 });
  }
}

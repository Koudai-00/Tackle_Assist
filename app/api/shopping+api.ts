import { db } from '../../lib/db';
import { shoppingList } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const items = await db.select().from(shoppingList).where(eq(shoppingList.userId, userId));
    return Response.json({ items });
  } catch (err) {
    console.error("Shopping GET error", err);
    return Response.json({ error: 'Failed to fetch shopping list' }, { status: 500 });
  }
}

// アイテムの更新 (購入済みフラグ、個数、メモ、名前)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isPurchased, quantity, memo, itemName } = body;

    if (!id) {
      return Response.json({ error: 'id is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (isPurchased !== undefined) updateData.isPurchased = isPurchased;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (memo !== undefined) updateData.memo = memo;
    if (itemName !== undefined) updateData.itemName = itemName;

    await db.update(shoppingList)
      .set(updateData)
      .where(eq(shoppingList.id, id));

    return Response.json({ success: true });
  } catch (err) {
    console.error("Shopping PATCH error", err);
    return Response.json({ error: 'Failed to update shopping list' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, itemName, itemId, quantity, memo } = body;

    if (!userId || !itemName) {
      return Response.json({ error: 'userId and itemName are required' }, { status: 400 });
    }

    await db.insert(shoppingList).values({
      userId,
      itemName,
      itemId: itemId || null,
      quantity: quantity || 1,
      memo: memo || null,
      isPurchased: false
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Shopping POST error", err);
    return Response.json({ error: 'Failed to add to shopping list' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, clearPurchased } = body;

    if (clearPurchased && userId) {
      // 購入済みアイテムを一括削除
      await db.delete(shoppingList).where(
        and(eq(shoppingList.userId, userId), eq(shoppingList.isPurchased, true))
      );
      return Response.json({ success: true });
    }

    if (!id) {
      return Response.json({ error: 'id is required' }, { status: 400 });
    }

    await db.delete(shoppingList).where(eq(shoppingList.id, id));
    return Response.json({ success: true });
  } catch (err) {
    console.error("Shopping DELETE error", err);
    return Response.json({ error: 'Failed to delete shopping item' }, { status: 500 });
  }
}

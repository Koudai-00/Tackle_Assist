import { db } from '../../lib/db';
import { shoppingList } from '../../db/schema';
import { eq } from 'drizzle-orm';

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

// チェックボックスのトグル用 (購入済みフラグ更新)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isPurchased } = body;

    await db.update(shoppingList)
      .set({ isPurchased })
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
    const { userId, itemName, itemId } = body;

    if (!userId || !itemName) {
      return Response.json({ error: 'userId and itemName are required' }, { status: 400 });
    }

    await db.insert(shoppingList).values({
      userId,
      itemName,
      itemId: itemId || null,
      isPurchased: false
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Shopping POST error", err);
    return Response.json({ error: 'Failed to add to shopping list' }, { status: 500 });
  }
}

import { db } from '../../lib/db';
import { tripChecklists, tripChecklistItems, favoriteSetItems, inventoryItems } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

// 釣行一覧 または 特定釣行の詳細取得
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const tripId = url.searchParams.get('id');

    if (!userId) return Response.json({ error: 'userId is required' }, { status: 400 });

    if (tripId) {
      const trip = await db.query.tripChecklists.findFirst({
        where: and(eq(tripChecklists.id, tripId), eq(tripChecklists.userId, userId))
      });
      if (!trip) return Response.json({ error: 'Trip not found' }, { status: 404 });

      const items = await db.select()
        .from(tripChecklistItems)
        .where(eq(tripChecklistItems.tripChecklistId, tripId));

      return Response.json({ trip, items });
    } else {
      // 一覧取得 (進捗状況付き)
      const trips = await db.select({
        id: tripChecklists.id,
        name: tripChecklists.name,
        tripDate: tripChecklists.tripDate,
        isCompleted: tripChecklists.isCompleted,
        totalItems: sql<number>`count(${tripChecklistItems.id})`,
        packedItems: sql<number>`count(case when ${tripChecklistItems.isPacked} then 1 end)`
      })
      .from(tripChecklists)
      .leftJoin(tripChecklistItems, eq(tripChecklists.id, tripChecklistItems.tripChecklistId))
      .where(eq(tripChecklists.userId, userId))
      .groupBy(tripChecklists.id);

      return Response.json({ trips });
    }
  } catch (err) {
    console.error("Trips GET Error", err);
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

// 釣行チェックリストの作成 (セットから生成)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, setId, name, tripDate, alertEnabled } = body;

    const [newTrip] = await db.insert(tripChecklists).values({
      userId,
      setId,
      name,
      tripDate: tripDate || new Date().toISOString().split('T')[0],
      alertEnabled: !!alertEnabled
    }).returning();

    // セットに含まれるアイテムをコピー
    if (setId) {
      const itemsToCopy = await db.select({
        itemId: favoriteSetItems.itemId,
        name: inventoryItems.name,
        requiredQuantity: favoriteSetItems.requiredQuantity
      })
      .from(favoriteSetItems)
      .innerJoin(inventoryItems, eq(favoriteSetItems.itemId, inventoryItems.id))
      .where(eq(favoriteSetItems.setId, setId));

      if (itemsToCopy.length > 0) {
        const inserts = itemsToCopy.map(item => ({
          tripChecklistId: newTrip.id,
          itemId: item.itemId,
          name: item.name,
          requiredQuantity: item.requiredQuantity,
          isPacked: false
        }));
        await db.insert(tripChecklistItems).values(inserts);
      }
    }

    return Response.json({ success: true, trip: newTrip });
  } catch (err) {
    console.error("Trips POST Error", err);
    return Response.json({ error: 'Trip creation failed' }, { status: 500 });
  }
}

// 進捗更新 (アイテム単体 or 全体完了)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { tripId, itemId, isPacked, isCompleted } = body;

    if (itemId) {
      await db.update(tripChecklistItems)
        .set({ isPacked })
        .where(eq(tripChecklistItems.id, itemId));
    }

    if (isCompleted !== undefined) {
      await db.update(tripChecklists)
        .set({ isCompleted, updatedAt: new Date() })
        .where(eq(tripChecklists.id, tripId));
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Trips PATCH Error", err);
    return Response.json({ error: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id is required' }, { status: 400 });

    await db.delete(tripChecklistItems).where(eq(tripChecklistItems.tripChecklistId, id));
    await db.delete(tripChecklists).where(eq(tripChecklists.id, id));

    return Response.json({ success: true });
  } catch (err) {
    console.error("Trips DELETE Error", err);
    return Response.json({ error: 'Delete failed' }, { status: 500 });
  }
}

import { db } from '../../lib/db';
import { inventoryItems } from '../../db/schema';
import { eq, asc, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const items = await db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        category: inventoryItems.category,
        subCategory: inventoryItems.subCategory,
        quantity: inventoryItems.quantity,
        locationTag: inventoryItems.locationTag,
        imageUrl: inventoryItems.imageUrl,
        barcode: inventoryItems.barcode,
        createdAt: inventoryItems.createdAt,
      })
      .from(inventoryItems)
      .where(eq(inventoryItems.userId, userId))
      .orderBy(desc(inventoryItems.createdAt));

    return Response.json({ items });
  } catch (err) {
    console.error("Inventory GET Error", err);
    return Response.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, category, subCategory, quantity, locationTag, imageUrl, barcode } = body;

    if (!userId || !name || !category) {
       return Response.json({ error: 'Missing required fundamental fields' }, { status: 400 });
    }

    await db.insert(inventoryItems).values({
      userId,
      name,
      category,
      subCategory: subCategory || null,
      quantity: quantity !== undefined ? quantity : 1,
      locationTag: locationTag || null,
      imageUrl: imageUrl || null,
      barcode: barcode || null,
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("Inventory POST error", err);
    return Response.json({ error: 'Failed to record inventory' }, { status: 500 });
  }
}

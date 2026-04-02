import { db } from '../../../lib/db';
import { favoriteSetItems, favoriteSets, tripChecklistItems, tripChecklists, shoppingList, maintenanceLogs } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const itemId = url.searchParams.get('itemId');

    if (!itemId) {
      return Response.json({ error: 'itemId is required' }, { status: 400 });
    }

    const setItemRows = await db
      .select({
        setId: favoriteSets.id,
        setName: favoriteSets.name,
      })
      .from(favoriteSetItems)
      .innerJoin(favoriteSets, eq(favoriteSetItems.setId, favoriteSets.id))
      .where(eq(favoriteSetItems.itemId, itemId));

    const checklistRows = await db
      .select({
        checklistId: tripChecklists.id,
        checklistName: tripChecklists.name,
        tripDate: tripChecklists.tripDate,
      })
      .from(tripChecklistItems)
      .innerJoin(tripChecklists, eq(tripChecklistItems.tripChecklistId, tripChecklists.id))
      .where(eq(tripChecklistItems.itemId, itemId));

    const shoppingRows = await db
      .select({
        id: shoppingList.id,
        itemName: shoppingList.itemName,
        quantity: shoppingList.quantity,
      })
      .from(shoppingList)
      .where(eq(shoppingList.itemId, itemId));

    const maintenanceRows = await db
      .select({
        id: maintenanceLogs.id,
        customTitle: maintenanceLogs.customTitle,
        maintenanceType: maintenanceLogs.maintenanceType,
        createdAt: maintenanceLogs.createdAt,
      })
      .from(maintenanceLogs)
      .where(eq(maintenanceLogs.itemId, itemId));

    return Response.json({
      sets: setItemRows,
      checklists: checklistRows,
      shopping: shoppingRows,
      maintenance: maintenanceRows,
    });
  } catch (err) {
    console.error('Inventory related GET Error', err);
    return Response.json({ error: 'Failed to fetch related data' }, { status: 500 });
  }
}

import { db } from '../../lib/db';
import { maintenanceLogs, inventoryItems } from '../../db/schema';
import { eq, asc, and } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    // leftJoinに変更し、itemIdがnull(任意設定)のものも取得できるようにする
    const logs = await db
      .select({
        id: maintenanceLogs.id,
        maintenanceType: maintenanceLogs.maintenanceType,
        customTitle: maintenanceLogs.customTitle,
        lineType: maintenanceLogs.lineType,
        recurringInterval: maintenanceLogs.recurringInterval,
        nextAlertDate: maintenanceLogs.nextAlertDate,
        createdAt: maintenanceLogs.createdAt,
        itemId: maintenanceLogs.itemId,
        itemName: inventoryItems.name,
      })
      .from(maintenanceLogs)
      .leftJoin(inventoryItems, eq(maintenanceLogs.itemId, inventoryItems.id))
      .where(eq(maintenanceLogs.userId, userId))
      .orderBy(asc(maintenanceLogs.nextAlertDate));

    return Response.json({ logs });
  } catch (err) {
    console.error("Maintenance GET Error", err);
    return Response.json({ error: 'Failed to fetch maintenance logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, itemId, maintenanceType, customTitle, lineType, recurringInterval, alertDateStr } = body;

    if (!userId || !maintenanceType) {
       return Response.json({ error: 'Missing fundamental fields' }, { status: 400 });
    }

    // クライアントで指定されたアラート日がない場合は自動計算
    let formattedDate = alertDateStr;
    if (!formattedDate) {
      let addDays = 180;
      if (lineType === 'fluoro' || lineType === 'nylon') addDays = 90;
      const alertDate = new Date();
      alertDate.setDate(alertDate.getDate() + addDays);
      formattedDate = alertDate.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    await db.insert(maintenanceLogs).values({
      userId,
      itemId: itemId || null,
      maintenanceType,
      customTitle: customTitle || null,
      lineType: lineType || null,
      recurringInterval: recurringInterval || 'none',
      nextAlertDate: formattedDate,
    });

    return Response.json({ success: true, nextAlertDate: formattedDate });
  } catch (err) {
    console.error("Maintenance POST error", err);
    return Response.json({ error: 'Failed to record maintenance' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return Response.json({ error: 'id and userId required' }, { status: 400 });
    }

    await db.delete(maintenanceLogs).where(
      and(eq(maintenanceLogs.id, id), eq(maintenanceLogs.userId, userId))
    );

    return Response.json({ success: true });
  } catch (err) {
    console.error("Maintenance DELETE error", err);
    return Response.json({ error: 'Failed to delete maintenance log' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, userId, nextAlertDate, recurringInterval, customTitle } = body;

    if (!id || !userId) {
      return Response.json({ error: 'id and userId required' }, { status: 400 });
    }

    const updateData: any = {};
    if (nextAlertDate !== undefined) updateData.nextAlertDate = nextAlertDate;
    if (recurringInterval !== undefined) updateData.recurringInterval = recurringInterval;
    if (customTitle !== undefined) updateData.customTitle = customTitle;

    await db.update(maintenanceLogs)
      .set(updateData)
      .where(and(eq(maintenanceLogs.id, id), eq(maintenanceLogs.userId, userId)));

    return Response.json({ success: true });
  } catch (err) {
    console.error("Maintenance PATCH error", err);
    return Response.json({ error: 'Failed to update maintenance log' }, { status: 500 });
  }
}

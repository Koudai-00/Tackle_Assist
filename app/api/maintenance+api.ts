import { db } from '../../lib/db';
import { maintenanceLogs, inventoryItems } from '../../db/schema';
import { eq, asc, and, isNotNull, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'userId parameter is required' }, { status: 400 });
    }

    const allLogs = await db
      .select({
        id: maintenanceLogs.id,
        maintenanceType: maintenanceLogs.maintenanceType,
        customTitle: maintenanceLogs.customTitle,
        lineType: maintenanceLogs.lineType,
        recurringInterval: maintenanceLogs.recurringInterval,
        nextAlertDate: maintenanceLogs.nextAlertDate,
        isCompleted: maintenanceLogs.isCompleted,
        completedAt: maintenanceLogs.completedAt,
        createdAt: maintenanceLogs.createdAt,
        itemId: maintenanceLogs.itemId,
        itemName: inventoryItems.name,
      })
      .from(maintenanceLogs)
      .leftJoin(inventoryItems, eq(maintenanceLogs.itemId, inventoryItems.id))
      .where(and(
        eq(maintenanceLogs.userId, userId),
        isNotNull(maintenanceLogs.nextAlertDate)
      ))
      .orderBy(asc(maintenanceLogs.nextAlertDate));

    const activeLogs = allLogs.filter(log => !log.isCompleted);
    const completedLogs = allLogs.filter(log => log.isCompleted);

    return Response.json({ activeLogs, completedLogs, logs: allLogs });
  } catch (err: any) {
    console.error("Maintenance GET Error", err?.message || err);
    return Response.json({ activeLogs: [], completedLogs: [], logs: [], error: String(err?.message || 'Failed to fetch maintenance logs') }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, itemId, maintenanceType, customTitle, lineType, recurringInterval, alertDateStr } = body;

    if (!userId || !maintenanceType) {
       return Response.json({ error: 'Missing fundamental fields' }, { status: 400 });
    }

    let formattedDate = alertDateStr;
    if (!formattedDate) {
      let addDays = 180;
      if (lineType === 'fluoro' || lineType === 'nylon') addDays = 90;
      const alertDate = new Date();
      alertDate.setDate(alertDate.getDate() + addDays);
      formattedDate = alertDate.toISOString().split('T')[0];
    }

    await db.insert(maintenanceLogs).values({
      userId,
      itemId: itemId || null,
      maintenanceType,
      customTitle: customTitle || null,
      lineType: lineType || null,
      recurringInterval: recurringInterval || 'none',
      nextAlertDate: formattedDate,
      isCompleted: false,
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
    const { id, userId, clearCompleted } = body;

    if (clearCompleted) {
      if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
      await db.delete(maintenanceLogs).where(
        and(eq(maintenanceLogs.userId, userId), eq(maintenanceLogs.isCompleted, true))
      );
      return Response.json({ success: true });
    }

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
    const { id, userId, nextAlertDate, recurringInterval, customTitle, isCompleted } = body;

    if (!id || !userId) {
      return Response.json({ error: 'id and userId required' }, { status: 400 });
    }

    // 1. 現在のレコードを取得 (繰り返し処理の判定用)
    const existing = await db
      .select()
      .from(maintenanceLogs)
      .where(and(eq(maintenanceLogs.id, id), eq(maintenanceLogs.userId, userId)))
      .limit(1);

    if (existing.length === 0) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }

    const current = existing[0];
    const becomingCompleted = isCompleted === true && current.isCompleted === false;

    // 2. 更新データの作成
    const updateData: any = {};
    if (nextAlertDate !== undefined) updateData.nextAlertDate = nextAlertDate;
    if (recurringInterval !== undefined) updateData.recurringInterval = recurringInterval;
    if (customTitle !== undefined) updateData.customTitle = customTitle;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
    }

    await db.update(maintenanceLogs)
      .set(updateData)
      .where(and(eq(maintenanceLogs.id, id), eq(maintenanceLogs.userId, userId)));

    // 3. 繰り返し設定に基づく次回予定の自動作成
    if (becomingCompleted && current.recurringInterval && current.recurringInterval !== 'none') {
      const baseDate = new Date(current.nextAlertDate || new Date());
      const now = new Date();
      // 基準日が過去の場合は今日を基準にする
      const referenceDate = baseDate < now ? now : baseDate;
      const nextDate = new Date(referenceDate);

      switch (current.recurringInterval) {
        case '1m': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case '3m': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case '6m': nextDate.setMonth(nextDate.getMonth() + 6); break;
        case '1y': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      const nextAlertDateStr = nextDate.toISOString().split('T')[0];

      await db.insert(maintenanceLogs).values({
        userId: current.userId,
        itemId: current.itemId,
        maintenanceType: current.maintenanceType,
        customTitle: current.customTitle,
        lineType: current.lineType,
        recurringInterval: current.recurringInterval,
        nextAlertDate: nextAlertDateStr,
        isCompleted: false,
      });
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Maintenance PATCH error", err);
    return Response.json({ error: 'Failed to update maintenance log' }, { status: 500 });
  }
}

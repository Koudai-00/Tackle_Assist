import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../db/schema';
import { eq, and, asc, desc, ilike, sql } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';
import { Resend } from 'resend';

type Bindings = {
  EXPO_PUBLIC_DATABASE_URL: string;
  EXPO_PUBLIC_GEMINI_API_KEY: string;
  EXPO_PUBLIC_YAHOO_CLIENT_ID: string;
  RESEND_API_KEY: string;
  RESEND_TO_EMAIL: string;
};

type Variables = {
  db: ReturnType<typeof drizzle>;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api');

// DB Middleware
app.use('*', async (c, next) => {
  const dbUrl = c.env.EXPO_PUBLIC_DATABASE_URL;
  if (!dbUrl) {
    return c.json({ error: 'Database URL not configured' }, 500);
  }
  const sqlClient = neon(dbUrl);
  const db = drizzle(sqlClient, { schema });
  c.set('db', db);
  await next();
});

// ==== Auth ====
app.post('/auth', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { uuid } = body;

    if (!uuid) return c.json({ error: 'UUID is required' }, 400);

    await db.insert(schema.users)
      .values({ id: uuid, settings: { isAnonymous: true } })
      .onConflictDoNothing({ target: schema.users.id });

    return c.json({ success: true, uuid });
  } catch (error) {
    console.error('API Error (auth):', error);
    return c.json({ error: 'Failed to authenticate user on DB' }, 500);
  }
});

// ==== Barcode ====
app.get('/barcode', async (c) => {
  try {
    const janCode = c.req.query('jan');
    if (!janCode) return c.json({ error: 'JANコードが指定されていません' }, 400);

    const clientId = c.env.EXPO_PUBLIC_YAHOO_CLIENT_ID;
    if (!clientId) return c.json({ error: 'Yahoo APIキー(Client ID)が設定されていません' }, 500);

    const yahooApiUrl = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${clientId}&jan_code=${janCode}&results=1`;
    const res = await fetch(yahooApiUrl);
    const data = await res.json();

    if (data.hits && data.hits.length > 0) {
      const item = data.hits[0];
      return c.json({
        success: true,
        name: item.name,
        category: 'other',
        imageUrl: item.image?.medium || ''
      });
    } else {
      return c.json({ success: false, error: '商品が見つかりませんでした' }, 404);
    }
  } catch (err) {
    console.error("Barcode Fetch Error", err);
    return c.json({ error: '商品情報の取得に失敗しました' }, 500);
  }
});

// ==== Locations ====
app.get('/locations', async (c) => {
  try {
    const db = c.get('db');
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);

    const tags = await db.select().from(schema.locationTags).where(eq(schema.locationTags.userId, userId));
    return c.json({ tags });
  } catch (err) {
    return c.json({ error: 'Failed to fetch location tags' }, 500);
  }
});

app.post('/locations', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, name } = body;
    if (!userId || !name) return c.json({ error: 'userId and name required' }, 400);

    await db.insert(schema.locationTags).values({ userId, name });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to create location tag' }, 500);
  }
});

app.delete('/locations', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, id } = body;
    if (!userId || !id) return c.json({ error: 'userId and id required' }, 400);

    await db.delete(schema.locationTags).where(
      and(eq(schema.locationTags.id, id), eq(schema.locationTags.userId, userId))
    );
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to delete location tag' }, 500);
  }
});

// ==== Shopping ====
app.get('/shopping', async (c) => {
  try {
    const db = c.get('db');
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);

    const items = await db.select().from(schema.shoppingList).where(eq(schema.shoppingList.userId, userId));
    return c.json({ items });
  } catch (err) {
    return c.json({ error: 'Failed to fetch shopping list' }, 500);
  }
});

app.patch('/shopping', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { id, isPurchased, quantity, memo, itemName } = body;
    if (!id) return c.json({ error: 'id is required' }, 400);

    const updateData: any = {};
    if (isPurchased !== undefined) updateData.isPurchased = isPurchased;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (memo !== undefined) updateData.memo = memo;
    if (itemName !== undefined) updateData.itemName = itemName;

    await db.update(schema.shoppingList).set(updateData).where(eq(schema.shoppingList.id, id));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to update shopping list' }, 500);
  }
});

app.post('/shopping', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, itemName, itemId, quantity, memo } = body;
    if (!userId || !itemName) return c.json({ error: 'userId and itemName required' }, 400);

    await db.insert(schema.shoppingList).values({
      userId, itemName, itemId: itemId || null, quantity: quantity || 1, memo: memo || null, isPurchased: false
    });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to add to shopping list' }, 500);
  }
});

app.delete('/shopping', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { id, userId, clearPurchased } = body;

    if (clearPurchased && userId) {
      await db.delete(schema.shoppingList).where(
        and(eq(schema.shoppingList.userId, userId), eq(schema.shoppingList.isPurchased, true))
      );
      return c.json({ success: true });
    }
    if (!id) return c.json({ error: 'id is required' }, 400);

    await db.delete(schema.shoppingList).where(eq(schema.shoppingList.id, id));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to delete shopping item' }, 500);
  }
});

// ==== Sets ====
app.get('/sets', async (c) => {
  try {
    const db = c.get('db');
    const userId = c.req.query('userId');
    const setId = c.req.query('id');
    if (!userId) return c.json({ error: 'userId is required' }, 400);

    if (setId) {
      const setArr = await db.select().from(schema.favoriteSets).where(
        and(eq(schema.favoriteSets.id, setId), eq(schema.favoriteSets.userId, userId))
      ).limit(1);
      const set = setArr[0];
      if (!set) return c.json({ error: 'Set not found' }, 404);

      const items = await db.select({
        id: schema.favoriteSetItems.id,
        itemId: schema.favoriteSetItems.itemId,
        name: schema.inventoryItems.name,
        requiredQuantity: schema.favoriteSetItems.requiredQuantity,
        category: schema.inventoryItems.category,
      })
      .from(schema.favoriteSetItems)
      .innerJoin(schema.inventoryItems, eq(schema.favoriteSetItems.itemId, schema.inventoryItems.id))
      .where(eq(schema.favoriteSetItems.setId, setId));

      return c.json({ set, items });
    } else {
      const sets = await db.select().from(schema.favoriteSets).where(eq(schema.favoriteSets.userId, userId));
      return c.json({ sets });
    }
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.post('/sets', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, name, description, items } = body;

    const [newSet] = await db.insert(schema.favoriteSets).values({
      userId, name, description: description || ''
    }).returning();

    if (items && Array.isArray(items) && items.length > 0) {
      const inserts = items.map(item => ({
        setId: newSet.id, itemId: item.itemId, requiredQuantity: item.requiredQuantity || 1
      }));
      await db.insert(schema.favoriteSetItems).values(inserts);
    }
    return c.json({ success: true, set: newSet });
  } catch (err) {
    return c.json({ error: 'Creation failed' }, 500);
  }
});

app.patch('/sets', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { id, name, description, items } = body;

    await db.update(schema.favoriteSets)
      .set({ name, description, updatedAt: new Date() } as any)
      .where(eq(schema.favoriteSets.id, id));

    if (items && Array.isArray(items)) {
      await db.delete(schema.favoriteSetItems).where(eq(schema.favoriteSetItems.setId, id));
      if (items.length > 0) {
        const inserts = items.map(item => ({
          setId: id, itemId: item.itemId, requiredQuantity: item.requiredQuantity || 1
        }));
        await db.insert(schema.favoriteSetItems).values(inserts);
      }
    }
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Update failed' }, 500);
  }
});

app.delete('/sets', async (c) => {
  try {
    const db = c.get('db');
    const id = c.req.query('id');
    if (!id) return c.json({ error: 'id is required' }, 400);

    await db.delete(schema.favoriteSetItems).where(eq(schema.favoriteSetItems.setId, id));
    await db.delete(schema.favoriteSets).where(eq(schema.favoriteSets.id, id));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Delete failed' }, 500);
  }
});

// ==== Trips ====
app.get('/trips', async (c) => {
  try {
    const db = c.get('db');
    const userId = c.req.query('userId');
    const tripId = c.req.query('id');
    if (!userId) return c.json({ error: 'userId is required' }, 400);

    if (tripId) {
      const tripArr = await db.select().from(schema.tripChecklists).where(
        and(eq(schema.tripChecklists.id, tripId), eq(schema.tripChecklists.userId, userId))
      ).limit(1);
      const trip = tripArr[0];
      if (!trip) return c.json({ error: 'Trip not found' }, 404);

      const items = await db.select().from(schema.tripChecklistItems).where(eq(schema.tripChecklistItems.tripChecklistId, tripId));
      return c.json({ trip, items });
    } else {
      const allTrips = await db.select({
        id: schema.tripChecklists.id,
        name: schema.tripChecklists.name,
        tripDate: schema.tripChecklists.tripDate,
        isCompleted: schema.tripChecklists.isCompleted,
        alertEnabled: schema.tripChecklists.alertEnabled,
        alertAt: schema.tripChecklists.alertAt,
        totalItems: sql<number>`count(${schema.tripChecklistItems.id})`,
        packedItems: sql<number>`count(case when ${schema.tripChecklistItems.isPacked} then 1 end)`
      })
      .from(schema.tripChecklists)
      .leftJoin(schema.tripChecklistItems, eq(schema.tripChecklists.id, schema.tripChecklistItems.tripChecklistId))
      .where(eq(schema.tripChecklists.userId, userId))
      .groupBy(schema.tripChecklists.id);

      const activeTrips = allTrips.filter(t => !t.isCompleted);
      const completedTrips = allTrips.filter(t => t.isCompleted);
      return c.json({ activeTrips, completedTrips });
    }
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.post('/trips', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, setId, name, tripDate, alertEnabled, alertAt } = body;
    let alertAtFinal = null;
    if (alertAt) alertAtFinal = new Date(alertAt);

    const [newTrip] = await db.insert(schema.tripChecklists).values({
      userId, setId, name, tripDate: tripDate || new Date().toISOString().split('T')[0],
      alertEnabled: !!alertEnabled, alertAt: alertAtFinal
    }).returning();

    if (setId) {
      const itemsToCopy = await db.select({
        itemId: schema.favoriteSetItems.itemId, name: schema.inventoryItems.name, requiredQuantity: schema.favoriteSetItems.requiredQuantity
      })
      .from(schema.favoriteSetItems)
      .innerJoin(schema.inventoryItems, eq(schema.favoriteSetItems.itemId, schema.inventoryItems.id))
      .where(eq(schema.favoriteSetItems.setId, setId));

      if (itemsToCopy.length > 0) {
        const inserts = itemsToCopy.map(item => ({
          tripChecklistId: newTrip.id, itemId: item.itemId, name: item.name, requiredQuantity: item.requiredQuantity, isPacked: false
        }));
        await db.insert(schema.tripChecklistItems).values(inserts);
      }
    }
    return c.json({ success: true, trip: newTrip });
  } catch (err) {
    return c.json({ error: 'Trip creation failed' }, 500);
  }
});

app.patch('/trips', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { tripId, itemId, isPacked, isCompleted, name, tripDate, alertAt, alertEnabled } = body;

    if (itemId) {
      await db.update(schema.tripChecklistItems).set({ isPacked }).where(eq(schema.tripChecklistItems.id, itemId));
    }
    if (tripId && (isCompleted !== undefined || name || tripDate || alertAt !== undefined || alertEnabled !== undefined)) {
      const updateData: any = { updatedAt: new Date() };
      if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
      if (name) updateData.name = name;
      if (tripDate) updateData.tripDate = tripDate;
      if (alertAt !== undefined) updateData.alertAt = alertAt ? new Date(alertAt) : null;
      if (alertEnabled !== undefined) updateData.alertEnabled = !!alertEnabled;

      await db.update(schema.tripChecklists).set(updateData).where(eq(schema.tripChecklists.id, tripId));
    }
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Update failed' }, 500);
  }
});

app.delete('/trips', async (c) => {
  try {
    const db = c.get('db');
    const id = c.req.query('id');
    const body = await c.req.json().catch(() => ({}));
    const { userId, clearCompleted } = body;

    if (clearCompleted && userId) {
      const completedTripsToDelete = await db.select({ id: schema.tripChecklists.id })
        .from(schema.tripChecklists).where(and(eq(schema.tripChecklists.userId, userId), eq(schema.tripChecklists.isCompleted, true)));
      
      if (completedTripsToDelete.length > 0) {
        const ids = completedTripsToDelete.map(t => t.id);
        await db.delete(schema.tripChecklistItems).where(sql`${schema.tripChecklistItems.tripChecklistId} IN ${ids}`);
        await db.delete(schema.tripChecklists).where(sql`${schema.tripChecklists.id} IN ${ids}`);
      }
      return c.json({ success: true });
    }
    if (!id) return c.json({ error: 'id is required' }, 400);

    await db.delete(schema.tripChecklistItems).where(eq(schema.tripChecklistItems.tripChecklistId, id));
    await db.delete(schema.tripChecklists).where(eq(schema.tripChecklists.id, id));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Delete failed' }, 500);
  }
});

// ==== Gemini ====
app.post('/gemini', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, targetFish, location, extraInfo } = body;
    if (!userId || !targetFish) return c.json({ error: 'userId and targetFish required' }, 400);

    const apiKey = c.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return c.json({ error: 'API Key missing' }, 500);

    const ai = new GoogleGenAI({ apiKey });

    const userInventory = await db
      .select({ id: schema.inventoryItems.id, name: schema.inventoryItems.name, category: schema.inventoryItems.category })
      .from(schema.inventoryItems).where(eq(schema.inventoryItems.userId, userId));

    const inventoryString = JSON.stringify(userInventory);
    const prompt = `
      あなたは釣りのエキスパートであり、ユーザーのタックル準備アドバイザーです。
      ユーザーの対象魚は「${targetFish}」、場所は「${location}」、その他条件:「${extraInfo || '特になし'}」です。
      
      ユーザーが現在持っている釣具の在庫一覧データ（JSON）は以下の通りです:
      ${inventoryString}
      
      上記の在庫情報の中から、今回の釣行に最も適したアイテムを選び出してください。
      また、なぜそのアイテムを選んだか、釣行に向けたワンポイントアドバイスを提供してください。
      
      必ず以下のJSONスキーマに従って出力してください。Markdownなどの装飾は不要です。
      {
        "recommendedItemIds": ["取得したアイテムのid文字列の配列"],
        "advice": "ユーザーへのアドバイス内容文字列"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const resultObj = JSON.parse(response.text || '{}');
    return c.json({ success: true, recommendation: resultObj });
  } catch (err) {
    return c.json({ error: 'AIアドバイスの生成に失敗しました' }, 500);
  }
});

// ==== Maintenance ====
app.get('/maintenance', async (c) => {
  try {
    const db = c.get('db');
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);

    const allLogs = await db.select({
      id: schema.maintenanceLogs.id, maintenanceType: schema.maintenanceLogs.maintenanceType, customTitle: schema.maintenanceLogs.customTitle,
      lineType: schema.maintenanceLogs.lineType, recurringInterval: schema.maintenanceLogs.recurringInterval, nextAlertDate: schema.maintenanceLogs.nextAlertDate,
      isCompleted: schema.maintenanceLogs.isCompleted, completedAt: schema.maintenanceLogs.completedAt, createdAt: schema.maintenanceLogs.createdAt,
      itemId: schema.maintenanceLogs.itemId, itemName: schema.inventoryItems.name,
    })
    .from(schema.maintenanceLogs).leftJoin(schema.inventoryItems, eq(schema.maintenanceLogs.itemId, schema.inventoryItems.id))
    .where(and(eq(schema.maintenanceLogs.userId, userId), sql`${schema.maintenanceLogs.nextAlertDate} IS NOT NULL`))
    .orderBy(asc(schema.maintenanceLogs.nextAlertDate));

    return c.json({ activeLogs: allLogs.filter(l => !l.isCompleted), completedLogs: allLogs.filter(l => l.isCompleted), logs: allLogs });
  } catch (err) {
    return c.json({ activeLogs: [], completedLogs: [], logs: [], error: 'Failed' }, 200);
  }
});

app.post('/maintenance', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, itemId, maintenanceType, customTitle, lineType, recurringInterval, alertDateStr } = body;
    if (!userId || !maintenanceType) return c.json({ error: 'Missing fields' }, 400);

    let formattedDate = alertDateStr;
    if (!formattedDate) {
      let addDays = (lineType === 'fluoro' || lineType === 'nylon') ? 90 : 180;
      const ad = new Date(); ad.setDate(ad.getDate() + addDays);
      formattedDate = ad.toISOString().split('T')[0];
    }

    await db.insert(schema.maintenanceLogs).values({
      userId, itemId: itemId || null, maintenanceType, customTitle: customTitle || null,
      lineType: lineType || null, recurringInterval: recurringInterval || 'none', nextAlertDate: formattedDate, isCompleted: false,
    });
    return c.json({ success: true, nextAlertDate: formattedDate });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.patch('/maintenance', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { id, userId, nextAlertDate, recurringInterval, customTitle, isCompleted } = body;
    if (!id || !userId) return c.json({ error: 'id and userId required' }, 400);

    const existing = await db.select().from(schema.maintenanceLogs).where(and(eq(schema.maintenanceLogs.id, id), eq(schema.maintenanceLogs.userId, userId))).limit(1);
    if (existing.length === 0) return c.json({ error: 'Not found' }, 404);

    const current = existing[0];
    const becomingCompleted = isCompleted === true && current.isCompleted === false;

    const updateData: any = {};
    if (nextAlertDate !== undefined) updateData.nextAlertDate = nextAlertDate;
    if (recurringInterval !== undefined) updateData.recurringInterval = recurringInterval;
    if (customTitle !== undefined) updateData.customTitle = customTitle;
    if (isCompleted !== undefined) { updateData.isCompleted = isCompleted; updateData.completedAt = isCompleted ? new Date() : null; }

    await db.update(schema.maintenanceLogs).set(updateData).where(and(eq(schema.maintenanceLogs.id, id), eq(schema.maintenanceLogs.userId, userId)));

    if (becomingCompleted && current.recurringInterval && current.recurringInterval !== 'none') {
      const baseDate = new Date(current.nextAlertDate || new Date());
      const now = new Date();
      const referenceDate = baseDate < now ? now : baseDate;
      const nextDate = new Date(referenceDate);

      switch (current.recurringInterval) {
        case '1m': nextDate.setMonth(nextDate.getMonth() + 1); break;
        case '3m': nextDate.setMonth(nextDate.getMonth() + 3); break;
        case '6m': nextDate.setMonth(nextDate.getMonth() + 6); break;
        case '1y': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
      }

      await db.insert(schema.maintenanceLogs).values({
        userId: current.userId, itemId: current.itemId, maintenanceType: current.maintenanceType, customTitle: current.customTitle,
        lineType: current.lineType, recurringInterval: current.recurringInterval, nextAlertDate: nextDate.toISOString().split('T')[0], isCompleted: false,
      });
    }
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.delete('/maintenance', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { id, userId, clearCompleted } = body;

    if (clearCompleted) {
      if (!userId) return c.json({ error: 'userId required' }, 400);
      await db.delete(schema.maintenanceLogs).where(and(eq(schema.maintenanceLogs.userId, userId), eq(schema.maintenanceLogs.isCompleted, true)));
      return c.json({ success: true });
    }
    if (!id || !userId) return c.json({ error: 'id and userId required' }, 400);

    await db.delete(schema.maintenanceLogs).where(and(eq(schema.maintenanceLogs.id, id), eq(schema.maintenanceLogs.userId, userId)));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

// ==== Inventory ====
app.get('/inventory', async (c) => {
  try {
    const db = c.get('db');
    const userId = c.req.query('userId');
    if (!userId) return c.json({ error: 'userId is required' }, 400);

    const items = await db.select({
      id: schema.inventoryItems.id, name: schema.inventoryItems.name, category: schema.inventoryItems.category, subCategory: schema.inventoryItems.subCategory,
      quantity: schema.inventoryItems.quantity, locationTag: schema.inventoryItems.locationTag, imageUrl: schema.inventoryItems.imageUrl, barcode: schema.inventoryItems.barcode,
      createdAt: schema.inventoryItems.createdAt,
    }).from(schema.inventoryItems).where(eq(schema.inventoryItems.userId, userId)).orderBy(desc(schema.inventoryItems.createdAt));

    return c.json({ items });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.post('/inventory', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, name, category, subCategory, quantity, locationTag, imageUrl, barcode } = body;
    if (!userId || !name || !category) return c.json({ error: 'Missing required fields' }, 400);

    await db.insert(schema.inventoryItems).values({
      userId, name, category, subCategory: subCategory || null, quantity: quantity !== undefined ? quantity : 1,
      locationTag: locationTag || null, imageUrl: imageUrl || null, barcode: barcode || null,
    });
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.patch('/inventory', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { id, userId, name, category, subCategory, quantity, locationTag, imageUrl, barcode } = body;
    if (!id || !userId) return c.json({ error: 'id and userId required' }, 400);

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (subCategory !== undefined) updateData.subCategory = subCategory;
    if (quantity !== undefined) updateData.quantity = quantity;
    if (locationTag !== undefined) updateData.locationTag = locationTag || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl || null;
    if (barcode !== undefined) updateData.barcode = barcode || null;

    await db.update(schema.inventoryItems).set(updateData).where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.userId, userId)));
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.delete('/inventory', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { id, userId } = body;
    if (!id || !userId) return c.json({ error: 'id and userId required' }, 400);

    await db.delete(schema.favoriteSetItems).where(eq(schema.favoriteSetItems.itemId, id));
    await db.delete(schema.tripChecklistItems).where(eq(schema.tripChecklistItems.itemId, id));
    await db.update(schema.shoppingList).set({ itemId: null }).where(eq(schema.shoppingList.itemId, id));
    await db.delete(schema.maintenanceLogs).where(eq(schema.maintenanceLogs.itemId, id));
    await db.delete(schema.inventoryItems).where(and(eq(schema.inventoryItems.id, id), eq(schema.inventoryItems.userId, userId)));

    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: 'Failed to delete' }, 500);
  }
});


app.post('/inventory/lost', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, itemId, amount } = body;
    const decreaseAmount = amount ? parseInt(amount, 10) : 1;
    if (!userId || !itemId) return c.json({ error: 'Missing req fields' }, 400);

    const currentItem = await db.select({ quantity: schema.inventoryItems.quantity }).from(schema.inventoryItems).where(and(eq(schema.inventoryItems.id, itemId), eq(schema.inventoryItems.userId, userId))).limit(1);
    if (currentItem.length === 0) return c.json({ error: 'Item not found' }, 404);

    const newQuantity = Math.max(0, currentItem[0].quantity - decreaseAmount);
    await db.update(schema.inventoryItems).set({ quantity: newQuantity }).where(eq(schema.inventoryItems.id, itemId));
    return c.json({ success: true, newQuantity });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.post('/inventory/replenish', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const { userId, itemId, amount } = body;
    const incrementAmount = amount ? parseInt(amount, 10) : 1;
    if (!userId || !itemId) return c.json({ error: 'Missing req fields' }, 400);

    const currentItems = await db.select({ quantity: schema.inventoryItems.quantity }).from(schema.inventoryItems).where(and(eq(schema.inventoryItems.id, itemId), eq(schema.inventoryItems.userId, userId))).limit(1);
    if (currentItems.length === 0) return c.json({ error: 'Item not found' }, 404);

    const newQuantity = currentItems[0].quantity + incrementAmount;
    await db.update(schema.inventoryItems).set({ quantity: newQuantity }).where(eq(schema.inventoryItems.id, itemId));
    return c.json({ success: true, newQuantity });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

app.get('/inventory/related', async (c) => {
  try {
    const db = c.get('db');
    const itemId = c.req.query('itemId');
    if (!itemId) return c.json({ error: 'itemId required' }, 400);

    const sets = await db.select({ setId: schema.favoriteSets.id, setName: schema.favoriteSets.name })
      .from(schema.favoriteSetItems).innerJoin(schema.favoriteSets, eq(schema.favoriteSetItems.setId, schema.favoriteSets.id))
      .where(eq(schema.favoriteSetItems.itemId, itemId));

    const checklists = await db.select({ checklistId: schema.tripChecklists.id, checklistName: schema.tripChecklists.name, tripDate: schema.tripChecklists.tripDate })
      .from(schema.tripChecklistItems).innerJoin(schema.tripChecklists, eq(schema.tripChecklistItems.tripChecklistId, schema.tripChecklists.id))
      .where(eq(schema.tripChecklistItems.itemId, itemId));

    const shopping = await db.select({ id: schema.shoppingList.id, itemName: schema.shoppingList.itemName, quantity: schema.shoppingList.quantity })
      .from(schema.shoppingList).where(eq(schema.shoppingList.itemId, itemId));

    const maintenance = await db.select({ id: schema.maintenanceLogs.id, customTitle: schema.maintenanceLogs.customTitle, maintenanceType: schema.maintenanceLogs.maintenanceType, createdAt: schema.maintenanceLogs.createdAt })
      .from(schema.maintenanceLogs).where(eq(schema.maintenanceLogs.itemId, itemId));

    return c.json({ sets, checklists, shopping, maintenance });
  } catch (err) {
    return c.json({ error: 'Failed' }, 500);
  }
});

// ==== Inquiry ====
app.post('/inquiry', async (c) => {
  try {
    const { name, email, type, message } = await c.req.json();
    const apiKey = c.env.RESEND_API_KEY;
    const toEmail = c.env.RESEND_TO_EMAIL;

    if (!apiKey || !toEmail) {
      console.error('Resend environment variables not configured');
      return c.json({ error: 'Mail server not configured' }, 500);
    }

    if (!email || !message) {
      return c.json({ error: 'Email and message are required' }, 400);
    }

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: 'Fishing Agent <onboarding@resend.dev>',
      to: [toEmail],
      subject: `[Fishing Agent] お問い合わせ: ${type || 'その他'}`,
      text: `アプリから新しいお問い合わせがありました。\n\n` +
            `■ お名前\n${name || '未入力'}\n\n` +
            `■ 返信用メールアドレス\n${email}\n\n` +
            `■ 種別\n${type || '未選択'}\n\n` +
            `■ お問い合わせ内容\n${message}\n`,
    });

    if (result.error) {
      console.error('Resend Error:', result.error);
      return c.json({ error: 'Failed to send email' }, 500);
    }

    return c.json({ success: true, id: result.data?.id });
  } catch (error) {
    console.error('Inquiry endpoint error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export const onRequest = handle(app);

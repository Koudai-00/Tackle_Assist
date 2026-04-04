import { pgTable, text, varchar, integer, boolean, timestamp, date, uuid, jsonb } from "drizzle-orm/pg-core";

// 1. Users (ユーザープロファイル・設定)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // App内で生成した匿名UUID
  transferCode: varchar('transfer_code', { length: 255 }), // 引き継ぎ用ハッシュコード
  settings: jsonb('settings'), // ユーザー設定情報
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Inventory Items (釣り具在庫)
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // rod, reel, lure, line, wear, other
  subCategory: varchar('sub_category', { length: 100 }), 
  specs: jsonb('specs'), // 重量、長さなどの詳細スペック
  quantity: integer('quantity').default(1).notNull(),
  locationTag: varchar('location_tag', { length: 255 }), // 保管場所 (例: ガレージA)
  imageUrl: text('image_url'), // ユーザーが設定した写真のBase64エンコードデータ
  barcode: varchar('barcode', { length: 255 }), // JANコード等のバーコード情報
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Favorite Sets (お気に入りタックル編成)
export const favoriteSets = pgTable('favorite_sets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // (例: 秋のシーバスセット)
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Favorite Set Items (編成に含まれるアイテムの中間テーブル)
export const favoriteSetItems = pgTable('favorite_set_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  setId: uuid('set_id').references(() => favoriteSets.id).notNull(),
  itemId: uuid('item_id').references(() => inventoryItems.id).notNull(),
  requiredQuantity: integer('required_quantity').default(1).notNull(),
});

// 5. Trip Checklists (釣行チェックリスト - 特定の日付に紐づく実行用)
export const tripChecklists = pgTable('trip_checklists', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  setId: uuid('set_id').references(() => favoriteSets.id), // 元になったセット (任意)
  name: varchar('name', { length: 255 }).notNull(), // (例: 4/10 駿河湾アジング)
  tripDate: date('trip_date').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  alertEnabled: boolean('alert_enabled').default(false).notNull(),
  alertAt: timestamp('alert_at'), // アラートを鳴らす日時
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Trip Checklist Items (個別の持ち物チェック状態)
export const tripChecklistItems = pgTable('trip_checklist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  tripChecklistId: uuid('trip_checklist_id').references(() => tripChecklists.id).notNull(),
  itemId: uuid('item_id').references(() => inventoryItems.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // アイテム名 (スナップショット)
  requiredQuantity: integer('required_quantity').default(1).notNull(),
  isPacked: boolean('is_packed').default(false).notNull(),
});

// 7. Shopping List (買い物リスト)
export const shoppingList = pgTable('shopping_list', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(), // 買うべき名前 または
  itemId: uuid('item_id').references(() => inventoryItems.id), // 既存アイテムの補充用リンク
  quantity: integer('quantity').default(1).notNull(), // 買うべき個数
  memo: text('memo'), // 買い物用のメモ
  isPurchased: boolean('is_purchased').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Maintenance Logs (メンテナンス・巻き替え履歴)
export const maintenanceLogs = pgTable('maintenance_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  itemId: uuid('item_id').references(() => inventoryItems.id), // (任意) 対象となる釣具
  customTitle: varchar('custom_title', { length: 255 }), // 任意のタイトル(ルアーフック交換など)
  maintenanceType: varchar('maintenance_type', { length: 100 }).notNull(), // line_change, oiling, custom etc.
  lineType: varchar('line_type', { length: 100 }), // PE, Fluoro etc.
  recurringInterval: varchar('recurring_interval', { length: 50 }), // 繰り返し設定(none, 1m, 6m, 1y等)
  nextAlertDate: date('next_alert_date'), // アラート日
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Location Tags
export const locationTags = pgTable('location_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

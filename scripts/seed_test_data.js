const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const databaseUrl = process.env.EXPO_PUBLIC_DATABASE_URL;
const userId = '9e2b9e13-3c3f-4a43-84ac-a7dfc3add905';

if (!databaseUrl) {
  console.error('DATABASE_URL is not defined');
  process.exit(1);
}

const sql = neon(databaseUrl);

const categories = ['rod', 'reel', 'lure', 'line', 'wear', 'bag', 'tool', 'other'];

const rodNames = ['ポイズンアドレナ 1610M', 'ゾディアス 264L', 'スティーズ リアルコントロール', 'ワールドシャウラ 1702R', 'ブレゾン C66M', 'ハートランド 722MRB', 'リベリオン 661MHFB', 'エクスプライド 166M', 'レバンテ F3-66LV', 'オロチXXX F4-68K'];
const reelNames = ['22 ステラ C3000XG', '23 ヴァンキッシュ 2500S', '24 セルテート LT3000-CXH', '20 メタニウム HG', '21 アンタレス DC XG', '22 イグジスト LT2500S-DH', '23 ストラディック 4000XG', '21 カルディア LT2500', '20 ルビアス LT2500', ' Tatula SV TW'];
const lureNames = ['ジョインテッドクロー 178', 'タイニークラッシュ', 'レベルバイブ', 'ピーナッツII', 'ソウルシャッド', 'ドライブシャッド', 'カットテール 4インチ', 'ヤマセンコー', 'ポップX', 'ヴィジョンワンテン'];

async function seed() {
  try {
    // 1. Ensure user exists
    console.log('Checking for user...');
    const userExists = await sql`SELECT id FROM users WHERE id = ${userId}`;
    if (userExists.length === 0) {
      console.log('User not found. Creating user...');
      await sql`INSERT INTO users (id) VALUES (${userId})`;
    }

    console.log('Seeding 100 items...');
    const items = [];
    for (let i = 0; i < 100; i++) {
      let name = '';
      let category = '';
      let subCategory = '';
      
      const type = i % 5;
      if (type === 0) { // Rod
        name = rodNames[Math.floor(Math.random() * rodNames.length)] + ` #${i}`;
        category = 'rod';
      } else if (type === 1) { // Reel
        name = reelNames[Math.floor(Math.random() * reelNames.length)] + ` #${i}`;
        category = 'reel';
      } else if (type === 2 || type === 3) { // Lure (Higher frequency)
        name = lureNames[Math.floor(Math.random() * lureNames.length)] + ` #${i}`;
        category = 'lure';
      } else { // Others
        category = categories[Math.floor(Math.random() * categories.length)];
        name = `便利ツール #${i}`;
      }

      items.push({
        userId,
        name,
        category,
        quantity: Math.floor(Math.random() * 5) + 1,
        locationTag: i % 3 === 0 ? 'ガレージ' : (i % 3 === 1 ? '寝室' : '車内')
      });
    }

    // Insert items one by one for simplicity in this script
    for (const item of items) {
       await sql`INSERT INTO inventory_items (user_id, name, category, quantity, location_tag) 
                 VALUES (${item.userId}, ${item.name}, ${item.category}, ${item.quantity}, ${item.locationTag})`;
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();

import { GoogleGenAI } from '@google/genai';
import { db } from '../../lib/db';
import { inventoryItems } from '../../db/schema';
import { eq } from 'drizzle-orm';

const apiKey = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, targetFish, location, extraInfo } = body;

    if (!userId || !targetFish) {
      return Response.json({ error: 'userId and targetFish are required' }, { status: 400 });
    }

    // 1. ユーザーの現在の在庫一覧をDBからすべて取得
    const userInventory = await db
      .select({ id: inventoryItems.id, name: inventoryItems.name, category: inventoryItems.category })
      .from(inventoryItems)
      .where(eq(inventoryItems.userId, userId));

    const inventoryString = JSON.stringify(userInventory);

    // 2. Geminiに投げるプロンプトを作成し、在庫リストをコンテキストとして渡す
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

    // 3. Gemini API 呼び出し (JSONモードを使用)
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { 
        responseMimeType: 'application/json' 
      },
    });

    const resultText = response.text || '{}';
    const resultObj = JSON.parse(resultText);
    
    return Response.json({ success: true, recommendation: resultObj });

  } catch (err) {
     console.error("Gemini API Error:", err);
     return Response.json({ error: 'AIアドバイスの生成に失敗しました' }, { status: 500 });
  }
}

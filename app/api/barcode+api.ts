export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const janCode = url.searchParams.get('jan');

    if (!janCode) {
      return Response.json({ error: 'JANコードが指定されていません' }, { status: 400 });
    }

    const clientId = process.env.EXPO_PUBLIC_YAHOO_CLIENT_ID;
    if (!clientId) {
      return Response.json({ error: 'Yahoo APIキー(Client ID)が設定されていません' }, { status: 500 });
    }

    // Yahooショッピング商品検索API V3 (jan_codeパラメータを使用)
    const yahooApiUrl = `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch?appid=${clientId}&jan_code=${janCode}&results=1`;
    
    const res = await fetch(yahooApiUrl);
    const data = await res.json();

    if (data.hits && data.hits.length > 0) {
      const item = data.hits[0];
      return Response.json({
        success: true,
        name: item.name,
        category: 'other', // 分類は一旦otherとし、ユーザーに選ばせます
        imageUrl: item.image?.medium || ''
      });
    } else {
      return Response.json({ success: false, error: '商品が見つかりませんでした' }, { status: 404 });
    }

  } catch (err) {
    console.error("Barcode Fetch Error", err);
    return Response.json({ error: '商品情報の取得に失敗しました' }, { status: 500 });
  }
}

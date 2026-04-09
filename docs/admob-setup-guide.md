# AdMob 広告導入 — 設定ガイド & テスト手順

## 実装した広告の種類

| 広告タイプ | 設置場所 | 表示タイミング |
|---|---|---|
| **バナー広告** | 画面下部（タブバーの上） | 常時表示 |
| **カード間広告** | ホーム画面・パッキング一覧 | 5カードごとに1広告 |
| **インタースティシャル広告** | AIパッキング提案画面 | 「提案を生成する」タップ時 |

---

## AdMob から取得が必要なもの

### 1. AdMob アプリID（必須・アプリごとに1つ）

| 項目 | 形式 | 用途 |
|---|---|---|
| Android用 アプリID | `ca-app-pub-XXXX~YYYY` | アプリの識別 |
| iOS用 アプリID | `ca-app-pub-XXXX~YYYY` | アプリの識別 |

**取得方法**: [AdMob コンソール](https://admob.google.com) → アプリ → アプリの追加 → アプリIDをコピー

### 2. 広告ユニットID（広告の種類ごとに個別作成）

| 項目 | 形式 | 用途 |
|---|---|---|
| バナー広告ユニットID (Android) | `ca-app-pub-XXXX/ZZZZ` | バナー & カード間広告 |
| バナー広告ユニットID (iOS) | `ca-app-pub-XXXX/ZZZZ` | バナー & カード間広告 |
| インタースティシャル広告ユニットID (Android) | `ca-app-pub-XXXX/ZZZZ` | AI提案時の全画面広告 |
| インタースティシャル広告ユニットID (iOS) | `ca-app-pub-XXXX/ZZZZ` | AI提案時の全画面広告 |

**取得方法**: AdMob コンソール → アプリ → 広告ユニット → 広告ユニットの作成

> [!NOTE]
> これ以外に取得が必要なものはありません。  
> AdMobアカウントの作成とアプリの登録、広告ユニットの作成だけでOKです。

---

## ID の設定場所

### Step 1: アプリID → `app.json`

[app.json](file:///c:/Users/kk-19/Tackle_Assist/app.json) のファイル末尾付近にある以下の部分を、取得した本番用IDに書き換えます。

```json
"react-native-google-mobile-ads": {
  "android_app_id": "ca-app-pub-ここにAndroidアプリIDを入力",
  "ios_app_id": "ca-app-pub-ここにiOSアプリIDを入力"
}
```

> [!IMPORTANT]
> この設定は `"expo": { ... }` の**外側**（ルートレベル）にあります。  
> `expo` オブジェクトの中には入れないでください。

### Step 2: 広告ユニットID → `.env`

[.env](file:///c:/Users/kk-19/Tackle_Assist/.env) ファイルの末尾にある以下の部分を書き換えます。

```env
# 本番用IDに差し替え
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=ca-app-pub-ここにAndroidバナーIDを入力
EXPO_PUBLIC_ADMOB_BANNER_IOS=ca-app-pub-ここにiOSバナーIDを入力
EXPO_PUBLIC_ADMOB_INTERSTITIAL_ANDROID=ca-app-pub-ここにAndroidインタースティシャルIDを入力
EXPO_PUBLIC_ADMOB_INTERSTITIAL_IOS=ca-app-pub-ここにiOSインタースティシャルIDを入力
```

---

## テスト方法

> [!CAUTION]
> ### Expo Go では広告テスト不可
> `react-native-google-mobile-ads` はネイティブコードを含むため、**Expo Go では動作しません**。  
> 開発ビルド（Development Build）の作成が必要です。

### 前提条件

- Node.js がインストール済み
- AdMob アカウントが作成済み（テスト用IDのみの場合は不要）

### Step 1: EAS CLI のインストール・ログイン

```bash
npm install -g eas-cli
eas login
```

### Step 2: EAS の初期設定

```bash
cd c:\Users\kk-19\Tackle_Assist
eas build:configure
```

`eas.json` が生成されます。

### Step 3: Development Build の作成

```bash
# Android ビルド
eas build --platform android --profile development

# iOS ビルド（Mac が必要）
eas build --platform ios --profile development
```

> [!NOTE]
> ビルドには5〜15分程度かかります。  
> EASダッシュボード（https://expo.dev）からビルド状況を確認できます。

### Step 4: ビルドのインストール

- **Android**: ビルド完了後、ダウンロードリンクからAPKを取得し、実機にインストール
- **iOS**: TestFlight経由、またはシミュレーター用ビルドを使用

### Step 5: 開発サーバーの起動

```bash
npx expo start --dev-client
```

端末にインストールした Development Build アプリを起動すると、開発サーバーに自動接続されます。

### Step 6: テスト広告の確認

現在 `.env` には **Google公式テスト用広告ID** が設定されているため：
- バナー広告 → 「Test Ad」と表示されるバナーが出現
- インタースティシャル → テスト用の全画面広告が表示
- これらでアプリの広告表示ロジックが正しく動作していることを確認

> [!WARNING]
> ### 本番ID使用時の注意
> テスト中に**本番用の広告ユニットID**を使用すると、不正クリック/表示として  
> AdMobアカウントが**永久停止**される可能性があります。  
> テスト中は必ずテスト用IDを使用してください。

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---|---|
| [app.json](file:///c:/Users/kk-19/Tackle_Assist/app.json) | AdMobアプリID設定、iOS追跡許可、SKAdNetwork |
| [.env](file:///c:/Users/kk-19/Tackle_Assist/.env) | 広告ユニットID（テスト用） |
| [utils/ads.ts](file:///c:/Users/kk-19/Tackle_Assist/utils/ads.ts) | 広告ID取得ユーティリティ |
| [AdBanner.tsx](file:///c:/Users/kk-19/Tackle_Assist/app/components/AdBanner.tsx) | バナー広告コンポーネント |
| [AdCard.tsx](file:///c:/Users/kk-19/Tackle_Assist/app/components/AdCard.tsx) | カード間広告コンポーネント |
| [useInterstitialAd.ts](file:///c:/Users/kk-19/Tackle_Assist/hooks/useInterstitialAd.ts) | インタースティシャル広告フック |
| [_layout.tsx (root)](file:///c:/Users/kk-19/Tackle_Assist/app/_layout.tsx) | AdMob SDK 初期化 |
| [_layout.tsx (tabs)](file:///c:/Users/kk-19/Tackle_Assist/app/(tabs)/_layout.tsx) | タブ上バナー広告設置 |
| [index.tsx](file:///c:/Users/kk-19/Tackle_Assist/app/(tabs)/index.tsx) | ホーム カード間広告 |
| [packing.tsx](file:///c:/Users/kk-19/Tackle_Assist/app/(tabs)/packing.tsx) | パッキング カード間広告 |
| [ai-packing.tsx](file:///c:/Users/kk-19/Tackle_Assist/app/ai-packing.tsx) | AI提案時インタースティシャル |

---

## 安全設計

- **広告IDが未設定** → 広告は表示されない（アプリは正常動作）
- **Expo Go 環境** → ネイティブモジュールが無いため自動的にスキップ（エラーなし）
- **Web 環境** → `Platform.OS === 'web'` で自動スキップ
- **広告ロード失敗** → エラーログのみ出力、アプリ動作に影響なし
## git連携のためのコメントアウト追加
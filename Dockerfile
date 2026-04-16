FROM node:22-bullseye-slim

WORKDIR /app

# npmの依存関係をインストールするためにpackage.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# EXPOの起動ポートを開放
EXPOSE 8081

# コンテナ起動時に実行するコマンド（Expoサーバーを起動）
CMD ["npm", "start"]

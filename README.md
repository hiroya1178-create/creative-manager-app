# デザインマネージャー 完全更新版

GitHub Pages でそのまま公開できる静的版です。

## 追加した機能
- サンプル案件を30件ランダム生成
- 担当者の追加 / 編集 / 稼働時間更新 / 削除
- 外注完了案件の受信登録
- PDF読込から顧客名 / 案件名 / 詳細候補の自動反映
- LINE通知用メッセージ生成とコピー

## LINE通知について
この版は GitHub Pages のみで動く静的アプリです。
そのため **LINE への自動送信そのものは未対応** です。

ただし以下は対応しています。
- LINE通知用メッセージの自動生成
- ワンクリックでコピー

自動送信をしたい場合は、次のどちらかが必要です。
- LINE Messaging API + サーバー
- Make / n8n / GAS / Cloud Functions などのWebhook連携

## 更新方法
既存の `creative-manager-app` リポジトリの中身を、この4ファイルで置き換えてください。
- index.html
- style.css
- app.js
- README.md

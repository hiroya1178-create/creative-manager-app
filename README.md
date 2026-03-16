# Creative Manager App

クリエイティブデザイナー会社向けの、GitHub Pagesでそのまま動くシンプルな業務管理WEBアプリです。

## できること
- 発注テンプレート(JSON)の読込
- 業務内容の自動判定
- 作成日報の自動生成
- 納期可否のOK / NG判定
- 外注利用の判断
- 担当者通知文の自動生成
- 外注指示書の自動生成

## ファイル構成
- `index.html`
- `style.css`
- `app.js`
- `README.md`

## GitHubで公開する手順
1. GitHubの `creative-manager-app` リポジトリを開く
2. `Add file` → `Upload files`
3. このフォルダの中身を全部アップロード
4. `Commit changes`
5. `Settings` → `Pages`
6. `Deploy from a branch` を選ぶ
7. `main` / `(root)` を選んで `Save`
8. 数分待つ
9. 公開URL例： `https://hiroya1178-create.github.io/creative-manager-app/`

## 注意
このアプリは静的サイトです。GitHub Pagesで動かす前提なので、メールの実送信やデータベース保存はしていません。
その代わり、通知文や指示書をダウンロードできるようにしています。

将来的に追加できる機能例：
- Gmail連携で実際にメール送信
- Googleカレンダー連携で担当者予定確認
- スプレッドシート保存
- ログイン機能

# Cloudflare Pages デプロイ手順

## 1. GitHubに新規リポジトリを作成

推奨リポジトリ名：

```txt
fund-mobile-app
```

## 2. このZIPの中身をGitHubへアップロード

アップロード対象：

```txt
index.html
style.css
script.js
db.js
manifest.json
service-worker.js
icon-192.png
icon-512.png
README.md
CODEX_TASK.md
CLOUDFLARE_DEPLOY.md
sample-prices.csv
```

## 3. Cloudflare PagesとGitHubを接続

Cloudflare DashboardをPC版ページで開きます。

```txt
Workers & Pages
→ Create
→ Pages
→ Connect to Git
→ GitHub
→ fund-mobile-app を選択
```

## 4. ビルド設定

| 項目 | 設定 |
|---|---|
| Framework preset | None |
| Build command | 空欄 |
| Build output directory | `/` |
| Root directory | `/` |
| Production branch | `main` |

## 5. デプロイ後

発行された `pages.dev` URLをAndroid Chromeで開きます。

## 6. 今後の修正

```txt
ChatGPT / Codex
→ GitHub上のコードを修正
→ commit / pull request
→ Cloudflare Pagesが自動デプロイ
→ Androidで確認
```

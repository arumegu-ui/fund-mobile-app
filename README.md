# fund-mobile-app

スマホ専用の投資信託日足分析PWAです。  
Cloudflare Pages + GitHub + Codex で修正・デプロイする前提の構成です。

## 目的

- Androidスマホで見やすい投資信託分析アプリ
- 投資信託は時間足ではなく、日足の基準価額・終値ベースで分析
- GitHub上のコードをCodexで修正
- GitHubにpushするとCloudflare Pagesへ自動デプロイ

## ファイル構成

```txt
fund-mobile-app/
├─ index.html
├─ style.css
├─ script.js
├─ db.js
├─ manifest.json
├─ service-worker.js
├─ icon-192.png
├─ icon-512.png
├─ README.md
├─ CODEX_TASK.md
├─ CLOUDFLARE_DEPLOY.md
└─ sample-prices.csv
```

## 登録済み銘柄コード

- 2931316A
- 2931101C
- 2931416A
- 0231102C
- 0431102C
- 03311022
- 5531112B

## Cloudflare Pages 設定

| 項目 | 値 |
|---|---|
| Framework preset | None |
| Build command | 空欄 |
| Build output directory | `/` |
| Root directory | `/` |
| Production branch | `main` |

## データ更新

アプリ内のCSV読込で、以下の形式を読み込めます。

```csv
code,date,close
2931316A,2026-05-20,28450
2931316A,2026-05-21,28510
```

## Codexへの依頼例

`CODEX_TASK.md` をコピーしてCodexに渡してください。

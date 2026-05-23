// db.js
// 初期データ。実データAPIを使う場合は、Codexでこのファイルまたは script.js の fetch 部分を修正してください。
// 投資信託は原則として日次の基準価額で、時間足データは通常ありません。

window.FUND_MASTER = [
  { code: "2931316A", name: "DCニッセイ日経225インデックスファンドB", category: "国内株式" },
  { code: "2931101C", name: "登録ファンド 2931101C", category: "投資信託" },
  { code: "2931416A", name: "登録ファンド 2931416A", category: "投資信託" },
  { code: "0231102C", name: "登録ファンド 0231102C", category: "投資信託" },
  { code: "0431102C", name: "登録ファンド 0431102C", category: "投資信託" },
  { code: "03311022", name: "登録ファンド 03311022", category: "投資信託" },
  { code: "5531112B", name: "登録ファンド 5531112B", category: "投資信託" }
];

function makeSeries(code, base, drift, wave){
  const arr = [];
  const start = new Date("2025-11-04T00:00:00+09:00");
  let price = base;
  let n = 0;
  for(let i=0;i<170;i++){
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = d.getDay();
    if(day === 0 || day === 6) continue;
    n++;
    const seasonal = Math.sin(n / 7) * wave + Math.cos(n / 17) * wave * 0.55;
    const noise = Math.sin(n * 1.7) * wave * 0.22;
    price = Math.max(1000, price + drift + seasonal * 0.08 + noise);
    arr.push({
      code,
      date: d.toISOString().slice(0,10),
      close: Math.round(price)
    });
  }
  return arr;
}

window.FUND_PRICE_DATA = [
  ...makeSeries("2931316A", 25800, 24, 170),
  ...makeSeries("2931101C", 15400, 8, 90),
  ...makeSeries("2931416A", 19600, 12, 120),
  ...makeSeries("0231102C", 11200, -2, 70),
  ...makeSeries("0431102C", 13600, 5, 85),
  ...makeSeries("03311022", 22100, 18, 150),
  ...makeSeries("5531112B", 9800, 4, 65)
];

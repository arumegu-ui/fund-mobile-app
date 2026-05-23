// script.js
const state = {
  activeCode: "2931316A",
  prices: [],
  master: []
};

const yen = new Intl.NumberFormat("ja-JP");

function byId(id){ return document.getElementById(id); }

function init(){
  state.master = window.FUND_MASTER || [];
  state.prices = loadStoredPrices() || window.FUND_PRICE_DATA || [];
  renderTabs();
  renderFundList();
  selectFund(state.activeCode);
  byId("refreshBtn").addEventListener("click", () => selectFund(state.activeCode));
  byId("csvInput").addEventListener("change", handleCsvUpload);
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
  }
}

function loadStoredPrices(){
  try{
    const raw = localStorage.getItem("fundPriceData");
    return raw ? JSON.parse(raw) : null;
  }catch(e){ return null; }
}

function saveStoredPrices(){
  localStorage.setItem("fundPriceData", JSON.stringify(state.prices));
}

function renderTabs(){
  const tabs = byId("fundTabs");
  tabs.innerHTML = "";
  state.master.forEach(f => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tab" + (f.code === state.activeCode ? " active" : "");
    btn.textContent = f.code;
    btn.addEventListener("click", () => selectFund(f.code));
    tabs.appendChild(btn);
  });
}

function renderFundList(){
  const box = byId("fundList");
  box.innerHTML = "";
  state.master.forEach(f => {
    const latest = getSeries(f.code).at(-1);
    const row = document.createElement("button");
    row.type = "button";
    row.className = "fund-row";
    row.innerHTML = `
      <span><b>${escapeHtml(f.name)}</b><small>${f.code} / ${f.category || ""}</small></span>
      <strong>${latest ? yen.format(latest.close) : "--"}</strong>
    `;
    row.addEventListener("click", () => selectFund(f.code));
    box.appendChild(row);
  });
}

function selectFund(code){
  state.activeCode = code;
  renderTabs();
  const fund = state.master.find(f => f.code === code) || {code, name:"未登録ファンド"};
  const series = getSeries(code);
  const a = analyze(series);

  byId("fundCode").textContent = fund.code;
  byId("fundName").textContent = fund.name;
  byId("lastClose").textContent = a.last ? yen.format(a.last.close) : "--";
  byId("dayChange").textContent = formatChange(a.dayChange, true);
  byId("dayChange").className = "big-number " + trendClass(a.dayChange);
  byId("change20").textContent = formatPct(a.change20);
  byId("change20").className = "big-number " + trendClass(a.change20);
  byId("rsi14").textContent = a.rsi14 == null ? "--" : a.rsi14.toFixed(1);
  byId("updatedAt").textContent = a.last ? a.last.date : "--";

  const badge = byId("signalBadge");
  badge.textContent = a.signal.label;
  badge.className = "badge " + a.signal.className;

  drawChart(series.slice(-90), a);
  renderAnalysis(a);
}

function getSeries(code){
  return state.prices
    .filter(x => x.code === code && Number.isFinite(Number(x.close)))
    .map(x => ({code:x.code, date:x.date, close:Number(x.close)}))
    .sort((a,b) => a.date.localeCompare(b.date));
}

function analyze(series){
  const last = series.at(-1);
  const prev = series.at(-2);
  const close = series.map(x => x.close);
  const ema5 = ema(close, 5);
  const ema20 = ema(close, 20);
  const ema60 = ema(close, 60);
  const rsi14 = rsi(close, 14);
  const dayChange = last && prev ? last.close - prev.close : null;
  const change20 = series.length > 20 ? ((last.close / series.at(-21).close) - 1) * 100 : null;

  let score = 0;
  if(last && ema20 && last.close > ema20) score += 25;
  if(ema5 && ema20 && ema5 > ema20) score += 25;
  if(ema20 && ema60 && ema20 > ema60) score += 25;
  if(change20 != null && change20 > 0) score += 15;
  if(rsi14 != null && rsi14 >= 45 && rsi14 <= 70) score += 10;

  let signal = { label:"中立", className:"neutral" };
  if(score >= 75) signal = { label:"上昇優勢", className:"buy" };
  else if(score >= 55) signal = { label:"買い待ち", className:"watch" };
  else if(score <= 25) signal = { label:"弱含み", className:"sell" };

  return { last, prev, ema5, ema20, ema60, rsi14, dayChange, change20, score, signal };
}

function ema(values, period){
  if(values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a,b)=>a+b,0) / period;
  for(let i=period;i<values.length;i++) e = values[i] * k + e * (1-k);
  return e;
}

function emaSeries(values, period){
  const out = Array(values.length).fill(null);
  if(values.length < period) return out;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a,b)=>a+b,0) / period;
  out[period-1] = e;
  for(let i=period;i<values.length;i++){
    e = values[i] * k + e * (1-k);
    out[i] = e;
  }
  return out;
}

function rsi(values, period){
  if(values.length <= period) return null;
  let gain = 0, loss = 0;
  for(let i=1;i<=period;i++){
    const diff = values[i] - values[i-1];
    if(diff >= 0) gain += diff; else loss -= diff;
  }
  gain /= period; loss /= period;
  for(let i=period+1;i<values.length;i++){
    const diff = values[i] - values[i-1];
    gain = (gain * (period-1) + Math.max(diff, 0)) / period;
    loss = (loss * (period-1) + Math.max(-diff, 0)) / period;
  }
  if(loss === 0) return 100;
  return 100 - (100 / (1 + gain / loss));
}

function renderAnalysis(a){
  const items = [
    ["総合スコア", `${a.score} / 100`],
    ["終値とEMA20", a.last && a.ema20 ? (a.last.close > a.ema20 ? "終値がEMA20を上回る" : "終値がEMA20を下回る") : "--"],
    ["EMA配列", a.ema5 && a.ema20 && a.ema60 ? `EMA5 ${fmt(a.ema5)} / EMA20 ${fmt(a.ema20)} / EMA60 ${fmt(a.ema60)}` : "--"],
    ["RSI判定", a.rsi14 == null ? "--" : (a.rsi14 >= 70 ? "過熱気味" : a.rsi14 <= 30 ? "売られ過ぎ気味" : "中立圏")],
    ["注意点", "投資信託は終値ベースのため、FXや株の時間足分析とは異なります"]
  ];
  byId("analysisList").innerHTML = items.map(([k,v]) => `
    <div class="analysis-item"><b>${k}</b><span>${v}</span></div>
  `).join("");
}

function drawChart(series, a){
  const canvas = byId("chart");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);

  if(series.length < 2){
    ctx.fillStyle = "#64748b";
    ctx.font = "24px sans-serif";
    ctx.fillText("データがありません", 40, 160);
    return;
  }

  const values = series.map(x=>x.close);
  const ema20 = emaSeries(values, 20);
  const min = Math.min(...values, ...ema20.filter(Boolean));
  const max = Math.max(...values, ...ema20.filter(Boolean));
  const pad = 28;
  const x = i => pad + (w - pad*2) * i / (series.length - 1);
  const y = v => h - pad - (h - pad*2) * (v - min) / (max - min || 1);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for(let i=0;i<4;i++){
    const yy = pad + (h - pad*2) * i / 3;
    ctx.beginPath(); ctx.moveTo(pad, yy); ctx.lineTo(w-pad, yy); ctx.stroke();
  }

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  values.forEach((v,i)=> i===0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v)));
  ctx.stroke();

  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  ema20.forEach((v,i)=>{
    if(v == null) return;
    if(!started){ ctx.moveTo(x(i), y(v)); started = true; }
    else ctx.lineTo(x(i), y(v));
  });
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "22px sans-serif";
  ctx.fillText(yen.format(values.at(-1)), w - 150, y(values.at(-1)) - 10);

  ctx.fillStyle = "#64748b";
  ctx.font = "18px sans-serif";
  ctx.fillText("青:基準価額 / 橙:EMA20", pad, h - 8);
}

function handleCsvUpload(ev){
  const file = ev.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const rows = parseCsv(String(reader.result || ""));
    const add = rows
      .filter(r => r.code && r.date && r.close)
      .map(r => ({code:r.code.trim(), date:r.date.trim(), close:Number(String(r.close).replace(/,/g,""))}))
      .filter(r => Number.isFinite(r.close));

    const key = r => `${r.code}_${r.date}`;
    const map = new Map(state.prices.map(r => [key(r), r]));
    add.forEach(r => map.set(key(r), r));
    state.prices = Array.from(map.values()).sort((a,b) => (a.code+a.date).localeCompare(b.code+b.date));
    saveStoredPrices();
    renderFundList();
    selectFund(state.activeCode);
    alert(`${add.length}件のCSVデータを読み込みました`);
  };
  reader.readAsText(file, "utf-8");
}

function parseCsv(text){
  const lines = text.replace(/^\uFEFF/,"").trim().split(/\r?\n/);
  if(lines.length < 2) return [];
  const headers = lines[0].split(",").map(s=>s.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(",");
    const obj = {};
    headers.forEach((h,i)=> obj[h] = cols[i]);
    return obj;
  });
}

function fmt(v){ return v == null ? "--" : yen.format(Math.round(v)); }
function formatChange(v, yenFlag=false){
  if(v == null) return "--";
  const sign = v > 0 ? "+" : "";
  return sign + (yenFlag ? yen.format(v) : v.toFixed(2));
}
function formatPct(v){
  if(v == null) return "--";
  return (v > 0 ? "+" : "") + v.toFixed(2) + "%";
}
function trendClass(v){
  if(v > 0) return "up";
  if(v < 0) return "down";
  return "flat";
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

document.addEventListener("DOMContentLoaded", init);

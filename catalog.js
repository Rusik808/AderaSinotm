const SHEET_ID = "1q-i97SHxs-4lGoxvev0R2aUG79v2Xsq06TpnUKAHMvY";

// ✅ ВАЖНО: берем CSV, а не /edit
const SHEET_PRODUCTS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;
const SHEET_SPECS    = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=1343433042`;

// ---------- CSV parser (нормальный, с кавычками) ----------
function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];

    if (c === '"' && inQuotes && n === '"') { cell += '"'; i++; continue; }
    if (c === '"') { inQuotes = !inQuotes; continue; }

    if (!inQuotes && c === ",") { row.push(cell); cell = ""; continue; }
    if (!inQuotes && c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; continue; }
    if (c === "\r") continue;

    cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function csvToObjects(csvText) {
  const rows = parseCSV(csvText);
  const header = (rows.shift() || []).map(h => h.trim());
  return rows
    .filter(r => r.some(x => String(x).trim() !== ""))
    .map(r => {
      const o = {};
      header.forEach((h, i) => o[h] = (r[i] ?? "").trim());
      return o;
    });
}

// ---------- helpers ----------
const $ = (s) => document.querySelector(s);

function getParams() {
  const p = new URLSearchParams(location.search);
  return { c: p.get("c"), s: p.get("s"), ss: p.get("ss"), tab: p.get("tab") };
}

function go(params) {
  const p = new URLSearchParams(params);
  location.href = `catalog.html?${p.toString()}`;
}

// ---------- render ----------
function renderGridTitle(title) {
  const el = $("#pageTitle");
  if (el) el.textContent = title;
}

function renderTiles(items, onClick) {
  const tabs = $("#tabs");
  if (tabs) tabs.hidden = true;

  const grid = $("#grid");
  if (!grid) return;
  grid.innerHTML = "";

  items.forEach(it => {
    const card = document.createElement("a");
    card.href = "javascript:void(0)";
    card.className = "catCard";
    card.innerHTML = `
      <div class="catCard__imgWrap">
        <img class="catCard__img" src="${it.image || ""}" alt="">
      </div>
      <div class="catCard__title">${it.title || ""}</div>
    `;
    card.addEventListener("click", () => onClick(it));
    grid.appendChild(card);
  });
}

function renderTabs(tabsArr, active, onPick) {
  const el = $("#tabs");
  if (!el) return;

  el.className = "catTabs";
  el.hidden = false;
  el.innerHTML = "";

  tabsArr.forEach(t => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "catTab" + (t === active ? " is-active" : "");
    btn.textContent = t;
    btn.addEventListener("click", () => onPick(t));
    el.appendChild(btn);
  });
}

function renderProducts(items) {
  const tabs = $("#tabs");
  if (tabs) tabs.hidden = true;

  const grid = $("#grid");
  if (!grid) return;
  grid.innerHTML = "";

  items.forEach(p => {
    const a = document.createElement("a");
    a.className = "prodCard";
    a.href = `product.html?p=${encodeURIComponent(p.slug || "")}`;

    const bullets = (p.bullets || "")
      .split("|")
      .map(x => x.trim())
      .filter(Boolean);

    a.innerHTML = `
      <div class="prodCard__imgWrap">
        <img class="prodCard__img" src="${p.image || ""}" alt="">
      </div>
      <div class="prodCard__title">${p.title || ""}</div>
      ${bullets.length ? `<ul class="prodCard__bullets">${bullets.map(b=>`<li>${b}</li>`).join("")}</ul>` : ""}
    `;
    grid.appendChild(a);
  });
}

// ---------- main ----------
let PRODUCTS = [];
let SPECS = [];

async function loadSheets() {
  // ✅ чтобы увидеть ошибки в консоли
  console.log("Loading sheets:", SHEET_PRODUCTS, SHEET_SPECS);

  const [pRes, sRes] = await Promise.all([
    fetch(SHEET_PRODUCTS, { cache: "no-store" }),
    fetch(SHEET_SPECS, { cache: "no-store" }),
  ]);

  if (!pRes.ok) throw new Error("Products sheet fetch failed: " + pRes.status);
  if (!sRes.ok) throw new Error("Specs sheet fetch failed: " + sRes.status);

  const [pText, sText] = await Promise.all([pRes.text(), sRes.text()]);

  PRODUCTS = csvToObjects(pText);
  SPECS = csvToObjects(sText);

  console.log("Loaded PRODUCTS:", PRODUCTS.length, "SPECS:", SPECS.length);
}

function pickByType(type) {
  return PRODUCTS.filter(x => (x.type || "").toLowerCase() === type);
}

function findTitleBySlug(type, slug) {
  const t = (type || "").toLowerCase();
  return PRODUCTS.find(x => (x.type || "").toLowerCase() === t && x.slug === slug)?.title || "";
}

function bootCatalog() {
  const { c, s, ss, tab } = getParams();

  // 1) старт: категории
  if (!c) {
    renderGridTitle("Каталог");
    return renderTiles(pickByType("category"), (it) => go({ c: it.slug }));
  }

  // tabs внутри категории (если у товаров есть tab)
  const catProducts = PRODUCTS.filter(x =>
    (x.type || "").toLowerCase() === "product" && x.category === c
  );

  const tabSet = [...new Set(catProducts.map(x => x.tab).filter(Boolean))];

  if (tabSet.length) {
    const activeTab = tab || tabSet[0];
    renderGridTitle(findTitleBySlug("category", c) || "Каталог");
    renderTabs(tabSet, activeTab, (t) => go({ c, tab: t }));
    return renderProducts(catProducts.filter(p => p.tab === activeTab));
  }

  // 2) подкатегории
  const subs = PRODUCTS.filter(x =>
    (x.type || "").toLowerCase() === "subcategory" && x.category === c
  );

  if (subs.length && !s) {
    renderGridTitle(findTitleBySlug("category", c) || "Каталог");
    return renderTiles(subs, (it) => go({ c, s: it.slug }));
  }

  // 3) подподкатегории
  const subTitle = findTitleBySlug("subcategory", s) || findTitleBySlug("category", c) || "Каталог";
  const subsubs = PRODUCTS.filter(x =>
    (x.type || "").toLowerCase() === "subsubcategory" && x.category === c && x.subcategory === s
  );

  if (subsubs.length && !ss) {
    renderGridTitle(subTitle);
    return renderTiles(subsubs, (it) => go({ c, s, ss: it.slug }));
  }

  // 4) товары
  const title = ss ? (findTitleBySlug("subsubcategory", ss) || subTitle) : subTitle;

  const list = PRODUCTS.filter(x =>
    (x.type || "").toLowerCase() === "product" &&
    x.category === c &&
    (!s || x.subcategory === s) &&
    (!ss || x.subsubcategory === ss)
  );

  renderGridTitle(title);
  return renderProducts(list);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadSheets();
    bootCatalog();
  } catch (err) {
    console.error(err);
    const grid = $("#grid");
    if (grid) grid.innerHTML = `<div style="padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">
      Ошибка загрузки каталога. Проверь доступ к Google Sheets и ссылки CSV.<br>
      Открой Console (F12) — там будет причина.
    </div>`;
  }
});

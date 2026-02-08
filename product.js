const SHEET_ID = "1q-i97SHxs-4lGoxvev0R2aUG79v2Xsq06TpnUKAHMvY";

// gid должны совпадать с твоими листами
const SHEET_PRODUCTS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;
const SHEET_SPECS    = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=1343433042`;

// ---- CSV parse ----
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

// ---- helpers ----
const $ = (s) => document.querySelector(s);

function getProductSlug() {
  const p = new URLSearchParams(location.search);
  return p.get("p");
}

function showError(msg) {
  const el = $("#prodError");
  el.hidden = false;
  el.textContent = msg;
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function setImage(id, src, alt) {
  const img = document.getElementById(id);
  if (!img) return;
  img.src = src || "";
  img.alt = alt || "";
}

// ---- main ----
document.addEventListener("DOMContentLoaded", async () => {
  const slug = getProductSlug();
  if (!slug) return showError("Нет параметра товара. Открой так: product.html?p=xc938");

  try {
    const [pRes, sRes] = await Promise.all([
      fetch(SHEET_PRODUCTS, { cache: "no-store" }),
      fetch(SHEET_SPECS, { cache: "no-store" }),
    ]);

    if (!pRes.ok) throw new Error("Не удалось загрузить products (доступ к таблице?)");
    if (!sRes.ok) throw new Error("Не удалось загрузить specs (доступ к таблице?)");

    const [pText, sText] = await Promise.all([pRes.text(), sRes.text()]);
    const PRODUCTS = csvToObjects(pText);
    const SPECS = csvToObjects(sText);

    const product = PRODUCTS.find(x => (x.type || "").toLowerCase() === "product" && x.slug === slug);
    if (!product) return showError(`Товар "${slug}" не найден в products`);

    // title + image
    setText("prodTitle", product.title);
    setImage("prodImage", product.image, product.title);
    document.title = product.title;

    // bullets (из колонки bullets: разделитель | )
    const bullets = (product.bullets || "")
      .split("|")
      .map(x => x.trim())
      .filter(Boolean);

    const ul = $("#prodBullets");
    ul.innerHTML = bullets.map(b => `<li>${b}</li>`).join("");

    // specs table
    const rows = SPECS
      .filter(r => r.productSlug === slug)
      .map(r => {
        const key = r.key || "";
        const val = (r.value || "") + (r.unit ? ` ${r.unit}` : "");
        return `<tr><td>${key}</td><td>${val}</td></tr>`;
      });

    const tbody = $("#specsBody");
    tbody.innerHTML = rows.length
      ? rows.join("")
      : `<tr><td colspan="2">Характеристики пока не заполнены</td></tr>`;

  } catch (e) {
    console.error(e);
    showError("Ошибка загрузки товара. Проверь: доступ к Google Sheet (Anyone with link / Publish) и правильные gid.");
  }
});

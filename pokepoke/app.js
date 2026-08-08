const CARD_DATA_URL =
  "https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/v4.json";
const EXPANSION_DATA_URL =
  "https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/expansions.json";

const STORAGE_KEY = "pokepoke-collection-v2";

let cards = [];
let expansions = [];
let selectedPack = null;
let selectedExpansion = null;
let filter = "all";
let packSearch = "";
let cardSearch = "";

const $ = id => document.getElementById(id);

const expansionJa = {
  a1:"最強の遺伝子", a1a:"幻のいる島", promo:"プロモ",
  a2:"時空の激闘", a2a:"超克の光", a2b:"シャイニングハイ",
  a3:"空と海の導き", a3a:"異次元クライシス", a3b:"イーブイガーデン",
  a4:"空と海の導き", a4a:"秘境の泉", a4b:"ex",
  b1:"メガライジング", b1a:"紅蓮の覇道", b2:"幻想の宴",
  b2a:"パルデアの鼓動", b2b:"メガシャイン",
  b3:"波動ビート", b3a:"進撃パラドックス", b3b:"ミラクルデイズ"
};

const packJa = {
  Pikachu:"ピカチュウ", Mewtwo:"ミュウツー", Charizard:"リザードン",
  Mew:"ミュウ", Dialga:"ディアルガ", Palkia:"パルキア",
  Arceus:"アルセウス", Booster:"ブースター",
  Lunala:"ルナアーラ", Solgaleo:"ソルガレオ",
  "Promo-A":"プロモA", "Promo-B":"プロモB",
  "Mega Altaria":"メガチルタリス", "Mega Blaziken":"メガバシャーモ",
  "Mega Gyarados":"メガギャラドス"
};

const cardJa = {
  Bulbasaur:"フシギダネ", Ivysaur:"フシギソウ", Venusaur:"フシギバナ",
  "Venusaur ex":"フシギバナex", Charmander:"ヒトカゲ", Charmeleon:"リザード",
  Charizard:"リザードン", "Charizard ex":"リザードンex",
  Pikachu:"ピカチュウ", "Pikachu ex":"ピカチュウex", Mew:"ミュウ",
  Mewtwo:"ミュウツー", "Mewtwo ex":"ミュウツーex", Celebi:"セレビィ",
  Eevee:"イーブイ", Sylveon:"ニンフィア", Snorlax:"カビゴン",
  Jigglypuff:"プリン", Caterpie:"キャタピー", Metapod:"トランセル",
  Butterfree:"バタフリー", Piplup:"ポッチャマ", Milotic:"ミロカロス",
  Dedenne:"デデンネ", "Dedenne ex":"デデンネex",
  "Mega Diancie ex":"メガディアンシーex", "Mega Sableye ex":"メガヤミラミex"
};

function jaName(name) {
  if (cardJa[name]) return cardJa[name];
  if (name.startsWith("Hisuian ")) return "ヒスイ" + name.slice(8);
  if (name.startsWith("Mega ")) return "メガ" + name.slice(5);
  return name;
}
function jaExpansion(name, id) { return expansionJa[id] || name; }
function jaPack(name) { return packJa[name] || name; }

function getOwned() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveOwned(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function qty(id) { return Number(getOwned()[id] || 0); }

function expansionIdFromCard(card) {
  return card.id.split("-")[0].toLowerCase();
}

function normalizeCard(card) {
  return {
    ...card,
    id: String(card.id),
    expansionId: expansionIdFromCard(card),
    displayName: jaName(card.name),
    displayPack: jaPack(card.pack || "その他")
  };
}

function packKey(card) {
  return card.pack || "その他";
}

async function loadData() {
  $("data-status").textContent = "カードデータを読み込んでいます...";
  try {
    const [cardRes, expRes] = await Promise.all([
      fetch(CARD_DATA_URL, { cache: "no-store" }),
      fetch(EXPANSION_DATA_URL, { cache: "no-store" })
    ]);
    if (!cardRes.ok || !expRes.ok) throw new Error("データ取得失敗");
    cards = (await cardRes.json()).map(normalizeCard);
    expansions = await expRes.json();
    $("data-status").textContent =
      `カード ${cards.length.toLocaleString()}枚 / 拡張 ${expansions.length}件。外部公開データを使用中。`;
    renderHome();
    updateTotal();
  } catch (e) {
    console.error(e);
    $("data-status").innerHTML =
      "カードデータを取得できませんでした。インターネット接続を確認してください。";
    $("total-progress").textContent = "読み込み失敗";
  }
}

function cardsForExpansion(expansion) {
  return cards.filter(c => c.expansionId === expansion.id);
}

function cardsForPack(expansionId, packName) {
  return cards.filter(c =>
    c.expansionId === expansionId && c.pack === packName
  );
}

function progressInfo(list) {
  const owned = list.filter(c => qty(c.id) > 0).length;
  const percent = list.length ? Math.round(owned / list.length * 100) : 0;
  return { owned, total: list.length, percent };
}

function renderHome() {
  const root = $("pack-list");
  root.innerHTML = "";
  const q = packSearch.trim().toLowerCase();

  expansions.forEach(exp => {
    const expCards = cardsForExpansion(exp);
    if (!expCards.length) return;

    const packNames = [...new Set(expCards.map(c => c.pack || "その他"))];
    const visiblePacks = packNames.filter(name => {
      const text = `${jaExpansion(exp.name, exp.id)} ${jaPack(name)} ${name}`.toLowerCase();
      return !q || text.includes(q);
    });
    if (!visiblePacks.length) return;

    const info = progressInfo(expCards);
    const section = document.createElement("div");
    section.className = "expansion";

    const header = document.createElement("div");
    header.className = "expansion-header";
    header.innerHTML = `
      <span>${escapeHtml(jaExpansion(exp.name, exp.id))} <small>(${escapeHtml(exp.id.toUpperCase())})</small></span>
      <span class="expansion-progress">${info.owned} / ${info.total} (${info.percent}%)</span>
    `;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "pack-grid";

    visiblePacks.forEach(packName => {
      const list = cardsForPack(exp.id, packName);
      const p = progressInfo(list);
      const packDef = (exp.packs || []).find(x => x.name === packName);

      const card = document.createElement("div");
      card.className = "pack";
      card.innerHTML = `
        ${packDef?.image ? `<img class="pack-image" src="${packDef.image}" alt="">` : ""}
        <div class="pack-name">${escapeHtml(jaPack(packName))}</div>
        <div class="pack-count">${p.owned} / ${p.total} 所持 (${p.percent}%)</div>
      `;
      card.addEventListener("click", () => openPack(exp.id, packName));
      grid.appendChild(card);
    });

    section.appendChild(grid);
    root.appendChild(section);
  });

  if (!root.children.length) {
    root.innerHTML = `<div class="empty">該当するパックがありません。</div>`;
  }
}

function openPack(expansionId, packName) {
  selectedExpansion = expansions.find(e => e.id === expansionId);
  selectedPack = packName;
  filter = "all";
  cardSearch = "";
  $("home-section").classList.add("hidden");
  $("card-section").classList.remove("hidden");
  $("search-card").value = "";
  $("selected-pack-name").textContent = jaPack(packName);
  $("breadcrumb").textContent =
    `${jaExpansion(selectedExpansion.name, selectedExpansion.id)} / ${jaPack(packName)}`;
  updatePackProgress();
  updateFilterButtons();
  renderCards();
}

function updatePackProgress() {
  const list = cardsForPack(selectedExpansion.id, selectedPack);
  const p = progressInfo(list);
  $("pack-progress-text").textContent = `${p.owned} / ${p.total} 所持 (${p.percent}%)`;
  $("pack-progress-bar").style.width = `${p.percent}%`;
}

function renderCards() {
  const root = $("card-list");
  root.innerHTML = "";
  const query = cardSearch.trim().toLowerCase();

  let list = cardsForPack(selectedExpansion.id, selectedPack);

  if (filter === "owned") list = list.filter(c => qty(c.id) > 0);
  if (filter === "missing") list = list.filter(c => qty(c.id) === 0);

  if (query) {
    list = list.filter(c =>
      `${c.displayName} ${c.name} ${c.id}`.toLowerCase().includes(query)
    );
  }

  list.sort((a,b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  if (!list.length) {
    root.innerHTML = `<div class="empty">該当するカードがありません。</div>`;
    return;
  }

  list.forEach(c => {
    const n = qty(c.id);
    const el = document.createElement("article");
    el.className = `card ${n ? "" : "missing"}`;
    el.innerHTML = `
      ${n ? `<div class="owned-badge">所持</div>` : ""}
      <img class="card-image" loading="lazy" src="${c.image}" alt="${escapeHtml(c.displayName)}"
           onerror="this.style.visibility='hidden'">
      <div class="card-info">
        <div class="card-name">${escapeHtml(c.displayName)}</div>
        <div class="card-meta">${escapeHtml(c.id.toUpperCase())}</div>
        <div class="rarity">${escapeHtml(c.rarity || "")}${c.ex === "Yes" ? " / ex" : ""}</div>
        <div class="quantity-row">
          <button aria-label="1枚減らす">−</button>
          <span class="quantity">${n}</span>
          <button aria-label="1枚増やす">＋</button>
        </div>
      </div>
    `;
    const buttons = el.querySelectorAll("button");
    buttons[0].addEventListener("click", () => changeQty(c.id, -1));
    buttons[1].addEventListener("click", () => changeQty(c.id, +1));
    root.appendChild(el);
  });
}

function changeQty(id, delta) {
  const data = getOwned();
  data[id] = Math.max(0, Number(data[id] || 0) + delta);
  if (data[id] === 0) delete data[id];
  saveOwned(data);
  renderCards();
  updatePackProgress();
  updateTotal();
  renderHome();
}

function updateTotal() {
  const p = progressInfo(cards);
  $("total-progress").textContent = `${p.owned.toLocaleString()} / ${p.total.toLocaleString()} (${p.percent}%)`;
  $("total-progress-bar").style.width = `${p.percent}%`;
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-button").forEach(b =>
    b.classList.toggle("active", b.dataset.filter === filter)
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]
  );
}

function toast(message) {
  const t = $("toast");
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1800);
}

$("back-button").addEventListener("click", () => {
  $("card-section").classList.add("hidden");
  $("home-section").classList.remove("hidden");
  renderHome();
});

document.querySelectorAll(".filter-button").forEach(b =>
  b.addEventListener("click", () => {
    filter = b.dataset.filter;
    updateFilterButtons();
    renderCards();
  })
);

$("search-pack").addEventListener("input", e => {
  packSearch = e.target.value;
  renderHome();
});

$("search-card").addEventListener("input", e => {
  cardSearch = e.target.value;
  renderCards();
});

$("reset-button").addEventListener("click", () => {
  if (!confirm("所持情報をすべて削除します。よろしいですか？")) return;
  localStorage.removeItem(STORAGE_KEY);
  updateTotal();
  renderHome();
  if (!selectedPack) return;
  updatePackProgress();
  renderCards();
  toast("所持情報をリセットしました");
});

$("export-button").addEventListener("click", () => {
  const data = {
    app: "pokepoke-card-manager",
    version: 2,
    exportedAt: new Date().toISOString(),
    owned: getOwned()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pokepoke-collection-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  toast("バックアップを保存しました");
});

$("import-file").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data.owned !== "object") throw new Error();
    saveOwned(data.owned);
    updateTotal();
    renderHome();
    if (selectedPack) {
      updatePackProgress();
      renderCards();
    }
    toast("バックアップを復元しました");
  } catch {
    alert("バックアップファイルを読み込めませんでした。");
  } finally {
    e.target.value = "";
  }
});

loadData();

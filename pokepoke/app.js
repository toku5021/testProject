// pokemon-tcg-pocket-database CDNエンドポイント
const CARD_DATA_URL = "https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/dist/cards.json";
const SET_DATA_URL = "https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/dist/sets.json";

const STORAGE_KEY = "pokepoke-3acc-collection";

// 固定3アカウント設定
const ACCOUNTS = [
  { id: "acc1", name: "アカウント 1" },
  { id: "acc2", name: "アカウント 2" },
  { id: "acc3", name: "アカウント 3" }
];

let activeAccountId = "acc1";
let cards = [];
let expansions = [];
let selectedPack = null;
let selectedExpansion = null;

let filterStatus = "all";
let filterRarity = "all";
let searchPackQuery = "";
let searchCardQuery = "";

const $ = id => document.getElementById(id);

// レアリティ定義：銀星 ◆1〜◆4 のみを対象とする (データ上は ◊ / ◊◊ / ◊◊◊ / ◊◊◊◊)
const MANAGED_RARITIES = new Set(["◊", "◊◊", "◊◊◊", "◊◊◊◊"]);
const RARITY_MAP = {
  "◊": "◆1",
  "◊◊": "◆2",
  "◊◊◊": "◆3",
[O  "◊◊◊◊": "◆4"
};

// localStorageから全カードの所持枚数を取得
function loadOwnedData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

function saveOwnedData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 指定カードの指定アカウント所持数
function getCardQty(cardId, accountId = activeAccountId) {
  const owned = loadOwnedData();
  return Number(owned[cardId]?.[accountId] || 0);
}

// 全アカウントでの合計所持数
function getTotalCardQty(cardId) {
  const owned = loadOwnedData();
  const cardObj = owned[cardId] || {};
  return Object.values(cardObj).reduce((sum, count) => sum + Number(count || 0), 0);
}

// 1枚でも誰かが持っていれば「保持 (true)」と判定
function isOwned(cardId) {
  return getTotalCardQty(cardId) > 0;
}

// レアリティの標準化
function normalizeRarity(rarity) {
  if (!rarity) return "";
  const s = String(rarity).trim();
  if (s === "◊" || s === "◆" || s === "1") return "◊";
  if (s === "◊◊" || s === "◆◆" || s === "2") return "◊◊";
  if (s === "◊◊◊" || s === "◆◆◆" || s === "3") return "◊◊◊";
  if (s === "◊◊◊◊" || s === "◆◆◆◆" || s === "4") return "◊◊◊◊";
  return s;
}

async function init() {
  renderAccountTabs();
  setupEventListeners();
  await loadData();
}

function renderAccountTabs() {
  const container = $("account-tabs");
  container.innerHTML = "";
  ACCOUNTS.forEach(acc => {
    const tab = document.createElement("div");
    tab.className = `account-tab ${acc.id === activeAccountId ? "active" : ""}`;
    tab.textContent = acc.name;
    tab.addEventListener("click", () => {
      activeAccountId = acc.id;
      renderAccountTabs();
      $("active-account-label").textContent = acc.name;
      if (selectedPack) renderCards();
    });
    container.appendChild(tab);
  });
  $("active-account-label").textContent = ACCOUNTS.find(a => a.id === activeAccountId).name;
}

async function loadData() {
  try {
    const [cardRes, setRes] = await Promise.all([
      fetch(CARD_DATA_URL, { cache: "no-store" }),
      fetch(SET_DATA_URL, { cache: "no-store" })
    ]);

    const rawCards = await cardRes.json();
    const rawSets = await setRes.json();

    // 銀星◆1〜◆4 のカードのみフィルタリング
    cards = rawCards.filter(c => MANAGED_RARITIES.has(normalizeRarity(c.rarity))).map(c => {
      const setId = String(c.set || "").toUpperCase();
      const num = String(c.number ?? "");
      const packs = Array.isArray(c.packs) && c.packs.length > 0 ? c.packs : [c.pack || "その他"];
      return {
        ...c,
        id: `${setId}-${num}`,
        setId,
        number: num,
        packs,
        normRarity: normalizeRarity(c.rarity)
      };
    });

    let setsArr = Array.isArray(rawSets) ? rawSets : Object.values(rawSets).flat();
    expansions = setsArr.map(s => ({
      id: String(s.code || s.id || "").toUpperCase(),
      name: s.name?.ja || s.name?.en || s.name || String(s.code)
    }));

    // データ整合性のフォロー
    const foundSetIds = [...new Set(cards.map(c => c.setId))];
    foundSetIds.forEach(id => {
      if (!expansions.some(e => e.id === id)) {
        expansions.push({ id, name: id });
      }
    });

    $("status-message").textContent = `読み込み完了: 銀星対象 ${cards.length}枚`;
    renderHome();
    updateTotalProgress();
  } catch (err) {
    console.error(err);
    $("status-message").textContent = "カードデータの読み込みに失敗しました。";
  }
}

function renderHome() {
  const root = $("pack-list");
  root.innerHTML = "";
  const q = searchPackQuery.toLowerCase();

  expansions.forEach(exp => {
    const expCards = cards.filter(c => c.setId === exp.id);
    if (!expCards.length) return;

    // パック一覧の抽出
    const packNames = [...new Set(expCards.flatMap(c => c.packs))];
    const visiblePacks = packNames.filter(p => !q || `${exp.name} ${p}`.toLowerCase().includes(q));

    if (!visiblePacks.length) return;

    const block = document.createElement("div");
    block.className = "expansion-block";

    const ownedCount = expCards.filter(c => isOwned(c.id)).length;
    const pct = Math.round((ownedCount / expCards.length) * 100);

    block.innerHTML = `
      <div class="expansion-title">
        <span>${exp.name} (${exp.id})</span>
        <span>${ownedCount} / ${expCards.length} (${pct}%)</span>
      </div>
      <div class="pack-grid" id="grid-${exp.id}"></div>
    `;
    root.appendChild(block);

    const grid = $(`grid-${exp.id}`);
    visiblePacks.forEach(packName => {
      const pCards = expCards.filter(c => c.packs.includes(packName));
      const pOwned = pCards.filter(c => isOwned(c.id)).length;
      const pPct = Math.round((pOwned / pCards.length) * 100);

      const pCard = document.createElement("div");
      pCard.className = "pack-card";
      pCard.innerHTML = `
        <div class="pack-card-name">${packName}</div>
        <div class="pack-card-count">${pOwned} / ${pCards.length} 保持 (${pPct}%)</div>
      `;
      pCard.addEventListener("click", () => openPack(exp, packName));
      grid.appendChild(pCard);
    });
  });
}

function openPack(exp, packName) {
  selectedExpansion = exp;
  selectedPack = packName;
  filterStatus = "all";
  filterRarity = "all";
  searchCardQuery = "";
  
  $("search-card").value = "";
  $("home-section")?.classList.add("hidden");
  $("pack-view").classList.add("hidden");
  $("card-view").classList.remove("hidden");

  $("selected-pack-name").textContent = packName;
  $("breadcrumb").textContent = `${exp.name} / ${packName}`;

  updateFilterButtons();
  renderCards();
  updatePackProgress();
}

function renderCards() {
  const container = $("card-grid");
  container.innerHTML = "";

  let list = cards.filter(c => c.setId === selectedExpansion.id && c.packs.includes(selectedPack));

  // フィルタリング
  if (filterStatus === "owned") list = list.filter(c => isOwned(c.id));
  if (filterStatus === "missing") list = list.filter(c => !isOwned(c.id));
  if (filterRarity !== "all") list = list.filter(c => c.normRarity === filterRarity);

  if (searchCardQuery) {
    const q = searchCardQuery.toLowerCase();
    list = list.filter(c => `${c.name} ${c.id}`.toLowerCase().includes(q));
  }

  list.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

  if (!list.length) {
    container.innerHTML = `<p class="sub-text">該当するカードがありません。</p>`;
    return;
  }

  list.forEach(c => {
    const currentQty = getCardQty(c.id, activeAccountId);
    const totalQty = getTotalCardQty(c.id);
    const ownedFlag = totalQty > 0;

    const cardEl = document.createElement("div");
    cardEl.className = `card-item ${ownedFlag ? "" : "missing"}`;

    const imageUrl = `https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/cards-by-set/${encodeURIComponent(c.setId)}/${encodeURIComponent(c.number)}.webp`;

    cardEl.innerHTML = `
      ${ownedFlag ? `<div class="owned-badge">保持</div>` : ""}
      <img class="card-img" src="${imageUrl}" alt="${c.name}" loading="lazy" onerror="this.style.visibility='hidden'">
      <div class="card-name">${c.name}</div>
      <div class="card-meta">${c.id} | ${RARITY_MAP[c.normRarity] || c.rarity}</div>
      
      <div class="qty-control">
        <button class="qty-btn btn-minus">−</button>
        <span class="qty-num">${currentQty}</span>
        <button class="qty-btn btn-plus">＋</button>
      </div>

      <div class="accounts-breakdown">
        ${ACCOUNTS.map(a => `
          <div class="account-row">
            <span>${a.name}</span>
            <strong>${getCardQty(c.id, a.id)}枚</strong>
          </div>
        `).join("")}
      </div>
    `;

    cardEl.querySelector(".btn-minus").addEventListener("click", () => updateQty(c.id, -1));
    cardEl.querySelector(".btn-plus").addEventListener("click", () => updateQty(c.id, 1));

    container.appendChild(cardEl);
  });
}

function updateQty(cardId, delta) {
  const owned = loadOwnedData();
  if (!owned[cardId]) owned[cardId] = {};

  const current = Number(owned[cardId][activeAccountId] || 0);
  const next = Math.max(0, current + delta);

  if (next === 0) {
    delete owned[cardId][activeAccountId];
  } else {
    owned[cardId][activeAccountId] = next;
  }

  if (Object.keys(owned[cardId]).length === 0) {
    delete owned[cardId];
  }

  saveOwnedData(owned);

  renderCards();
  updatePackProgress();
  updateTotalProgress();
}

function updatePackProgress() {
  const list = cards.filter(c => c.setId === selectedExpansion.id && c.packs.includes(selectedPack));
  const ownedCount = list.filter(c => isOwned(c.id)).length;
  const pct = list.length ? Math.round((ownedCount / list.length) * 100) : 0;

  $("pack-progress-text").textContent = `保持率: ${ownedCount} / ${list.length} (${pct}%)`;
  $("pack-progress-bar").style.width = `${pct}%`;
}

function updateTotalProgress() {
  const ownedCount = cards.filter(c => isOwned(c.id)).length;
  const pct = cards.length ? Math.round((ownedCount / cards.length) * 100) : 0;

  $("total-progress").textContent = `${ownedCount} / ${cards.length} (${pct}%)`;
  $("total-progress-bar").style.width = `${pct}%`;
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.filter === filterStatus);
  });
  document.querySelectorAll(".rarity-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.rarity === filterRarity);
  });
}

function setupEventListeners() {
  $("back-btn").addEventListener("click", () => {
    $("card-view").classList.add("hidden");
    $("pack-view").classList.remove("hidden");
    selectedPack = null;
    renderHome();
  });

  $("search-pack").addEventListener("input", e => {
    searchPackQuery = e.target.value;
    renderHome();
  });

  $("search-card").addEventListener("input", e => {
    searchCardQuery = e.target.value;
    renderCards();
  });

  document.querySelectorAll(".filter-btn").forEach(b => {
    b.addEventListener("click", () => {
      filterStatus = b.dataset.filter;
      updateFilterButtons();
      renderCards();
    });
  });

  document.querySelectorAll(".rarity-btn").forEach(b => {
    b.addEventListener("click", () => {
      filterRarity = b.dataset.rarity;
      updateFilterButtons();
      renderCards();
    });
  });

  // バックアップ・復元
  $("export-btn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(loadOwnedData(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pokepoke-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    showToast("バックアップを出力しました");
  });

  $("import-file").addEventListener("change", async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      saveOwnedData(data);
      updateTotalProgress();
      if (selectedPack) renderCards();
      else renderHome();
      showToast("データを復元しました");
    } catch {
      alert("JSONファイルの形式が不正です。");
[I    }
  });

  $("reset-btn").addEventListener("click", () => {
    if (confirm("全アカウントの所持データをクリアしますか？")) {
      localStorage.removeItem(STORAGE_KEY);
      updateTotalProgress();
      if (selectedPack) renderCards();
      else renderHome();
      showToast("所持情報をリセットしました");
    }
  });
}

function showToast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}

document.addEventListener("DOMContentLoaded", init);

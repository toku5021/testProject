const CARD_DATA_URL =
  "https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/dist/cards.json";
const SET_DATA_URL =
  "https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/dist/sets.json";

const STORAGE_KEY = "pokepoke-collection-v3";
const ACCOUNT_KEY = "pokepoke-accounts-v3";

let cards = [];
let expansions = [];
let accounts = loadAccounts();
let selectedAccountId = accounts[0].id;
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
  "Mega Diancie ex":"メガディアンシーex", "Mega Sableye ex":"メガヤミラブex"
};

function jaName(name) {
  if (!name) return "";
  if (cardJa[name]) return cardJa[name];
  if (name.startsWith("Hisuian ")) return "ヒスイ" + name.slice(8);
  if (name.startsWith("Mega ")) return "メガ" + name.slice(5);
  return name;
}
function jaExpansion(name, id) { return expansionJa[id?.toLowerCase()] || name; }
function jaPack(name) { return packJa[name] || name; }

function makeId() {
  return "acc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}

function loadAccounts() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACCOUNT_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}
  return [{ id: "acc-1", name: "メイン" }];
}

function saveAccounts() {
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
}

function getOwned() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}
function saveOwned(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getCardAccounts(cardId) {
  const all = getOwned();
  return all[cardId] || {};
}

function getQty(cardId, accountId = selectedAccountId) {
  return Number(getCardAccounts(cardId)[accountId] || 0);
}

function getTotalQty(cardId) {
  return Object.values(getCardAccounts(cardId))
    .reduce((sum, n) => sum + Number(n || 0), 0);
}

function isOwned(cardId) {
  return getTotalQty(cardId) > 0;
}

const MANAGED_RARITIES = new Set(["◊", "◊◊", "◊◊◊", "◊◊◊◊"]);
const RARITY_LABELS = {
  "◊": "◆1",
  "◊◊": "◆2",
  "◊◊◊": "◆3",
  "◊◊◊◊": "◆4"
};
let rarityFilter = "all";

function normalizeRarity(value) {
  if (value == null) return "";
  const s = String(value).trim();
  if (s === "◊" || s === "◆" || s === "1") return "◊";
  if (s === "◊◊" || s === "◆◆" || s === "2") return "◊◊";
  if (s === "◊◊◊" || s === "◆◆◆" || s === "3") return "◊◊◊";
  if (s === "◊◊◊◊" || s === "◆◆◆◆" || s === "4") return "◊◊◊◊";
  return s;
}

function normalizeCard(card) {
  const setId = String(card.set || "").toUpperCase();
  const number = String(card.number ?? "");
  const id = `${setId}-${number}`;
  
  // パック名の抽出を拡張
  let primaryPack = "その他";
  if (Array.isArray(card.packs) && card.packs.length > 0) {
    primaryPack = card.packs[0];
  } else if (card.pack) {
    primaryPack = card.pack;
  }

  return {
    ...card,
    id,
    set: setId,
    number,
    expansionId: setId,
    pack: primaryPack,
    packsList: Array.isArray(card.packs) && card.packs.length > 0 ? card.packs : [primaryPack],
    displayName: jaName(card.name || card.displayName),
    displayPack: jaPack(primaryPack)
  };
}

function isManagedCard(card) {
  return MANAGED_RARITIES.has(normalizeRarity(card.rarity));
}

function cardsForExpansion(expansion) {
  return cards.filter(c => c.expansionId === expansion.id);
}

function cardsForPack(expansionId, packName) {
  return cards.filter(c =>
    c.expansionId === expansionId &&
    (c.packsList.includes(packName) || c.pack === packName)
  );
}

function progressInfo(list) {
  const owned = list.filter(c => isOwned(c.id)).length;
  const percent = list.length ? Math.round(owned / list.length * 100) : 0;
  return { owned, total: list.length, percent };
}

function rarityFiltered(list) {
  if (rarityFilter === "all") return list;
  return list.filter(c => normalizeRarity(c.rarity) === rarityFilter);
}

function renderAccounts() {
  const root = $("account-list");
  root.innerHTML = "";

  accounts.forEach(account => {
    const item = document.createElement("div");
    item.className = "account-item" + (account.id === selectedAccountId ? " active" : "");

    const select = document.createElement("button");
    select.className = "account-select";
    select.textContent = account.name;
    select.title = "このアカウントを選択";
    select.addEventListener("click", () => {
      selectedAccountId = account.id;
      renderAccounts();
      updateSelectedAccountName();
      if (selectedPack) {
        renderCards();
        updatePackProgress();
      }
    });

    const rename = document.createElement("button");
    rename.className = "account-rename";
    rename.textContent = "✎";
    rename.title = "名前変更";
    rename.addEventListener("click", () => renameAccount(account.id));

    const del = document.createElement("button");
    del.className = "account-delete";
    del.textContent = "×";
    del.title = "削除";
    del.addEventListener("click", () => deleteAccount(account.id));

    item.append(select, rename, del);
    root.appendChild(item);
  });
}

function addAccount() {
  const input = $("new-account-name");
  const name = input.value.trim();
  if (!name) return;

  accounts.push({ id: makeId(), name });
  selectedAccountId = accounts.at(-1).id;
  saveAccounts();
  input.value = "";
  $("account-modal").classList.add("hidden");
  renderAccounts();
  updateSelectedAccountName();
  toast(`${name} を追加しました`);
}

function renameAccount(id) {
  const account = accounts.find(a => a.id === id);
  if (!account) return;
  const name = prompt("新しいアカウント名を入力してください", account.name);
  if (!name || !name.trim()) return;
  account.name = name.trim();
  saveAccounts();
  renderAccounts();
  updateSelectedAccountName();
  if (selectedPack) renderCards();
}

function deleteAccount(id) {
  if (accounts.length <= 1) {
    alert("アカウントは最低1つ必要です。");
    return;
  }

  const account = accounts.find(a => a.id === id);
  if (!account) return;

  if (!confirm(`「${account.name}」を削除しますか？\nこのアカウントの所持枚数も削除されます。`)) return;

  const owned = getOwned();
  Object.keys(owned).forEach(cardId => {
    if (owned[cardId]?.[id] !== undefined) delete owned[cardId][id];
    if (Object.keys(owned[cardId] || {}).length === 0) delete owned[cardId];
  });
  saveOwned(owned);

  accounts = accounts.filter(a => a.id !== id);
  if (selectedAccountId === id) selectedAccountId = accounts[0].id;
  saveAccounts();
  renderAccounts();
  updateSelectedAccountName();
  updateTotal();
  renderHome();
  if (selectedPack) {
    renderCards();
    updatePackProgress();
  }
}

function updateSelectedAccountName() {
  const account = accounts.find(a => a.id === selectedAccountId);
  $("selected-account-name").textContent = account?.name || "";
}

async function loadData() {
  $("data-status").textContent = "最新カードデータを読み込んでいます...";
  try {
    const [cardRes, setRes] = await Promise.all([
      fetch(CARD_DATA_URL, { cache: "no-store" }),
      fetch(SET_DATA_URL, { cache: "no-store" })
    ]);
    if (!cardRes.ok || !setRes.ok) throw new Error("データ取得失敗");

    const rawCards = await cardRes.json();
    const setObject = await setRes.json();

    cards = rawCards.map(normalizeCard).filter(isManagedCard);

    // sets.json の構造（オブジェクト型／配列型の両方に対応）
    let allSets = [];
    if (Array.isArray(setObject)) {
      allSets = setObject;
    } else if (typeof setObject === "object" && setObject !== null) {
      allSets = Object.values(setObject).flat();
    }

    expansions = allSets.map(exp => {
      const code = String(exp.code || exp.id || "").toUpperCase();
      return {
        ...exp,
        id: code,
        name: exp.name?.ja || exp.name?.en || exp.name || code,
      };
    });

    // 取得したカードに存在するが sets に定義されていないセットをフォールバック生成
    const cardSetIds = [...new Set(cards.map(c => c.expansionId))];
    cardSetIds.forEach(setId => {
      if (!expansions.some(e => e.id === setId)) {
        expansions.push({
          id: setId,
          name: expansionJa[setId.toLowerCase()] || setId
        });
      }
    });

    $("data-status").textContent =
      `管理対象 ${cards.length.toLocaleString()}枚 / 全カード ${rawCards.length.toLocaleString()}枚。◆1〜◆4のみ表示`;

    renderAccounts();
    updateSelectedAccountName();
    renderHome();
    updateTotal();
  } catch (e) {
    console.error(e);
    $("data-status").textContent =
      "カードデータを取得できませんでした。インターネット接続を確認してください。";
    $("total-progress").textContent = "読み込み失敗";
  }
}

function renderHome() {
  const root = $("pack-list");
  root.innerHTML = "";
  const q = packSearch.trim().toLowerCase();

  expansions.forEach(exp => {
    const expCards = cardsForExpansion(exp);
    if (!expCards.length) return;

    // このエキスパンション内に含まれる全パック名を取得
    const packNames = [...new Set(expCards.flatMap(c => c.packsList))];
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
      <span>${escapeHtml(jaExpansion(exp.name, exp.id))} <small>(${escapeHtml(exp.id)})</small></span>
      <span class="expansion-progress">${info.owned} / ${info.total} (${info.percent}%)</span>
    `;
    section.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "pack-grid";

    visiblePacks.forEach(packName => {
      const list = cardsForPack(exp.id, packName);
      const p = progressInfo(list);
      const card = document.createElement("div");
      card.className = "pack";
      card.innerHTML = `
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
  selectedExpansion = expansions.find(e => e.id === expansionId) || { id: expansionId, name: expansionId };
  selectedPack = packName;
  filter = "all";
  rarityFilter = "all";
  cardSearch = "";
  $("home-section").classList.add("hidden");
  $("card-section").classList.remove("hidden");
  $("search-card").value = "";
  $("selected-pack-name").textContent = jaPack(packName);
  $("breadcrumb").textContent =
    `${jaExpansion(selectedExpansion.name, selectedExpansion.id)} / ${jaPack(packName)}`;
  updateSelectedAccountName();
  updatePackProgress();
  updateFilterButtons();
  renderCards();
}

function updatePackProgress() {
  const list = cardsForPack(selectedExpansion.id, selectedPack);
  const p = progressInfo(list);
  $("pack-progress-text").textContent =
    `${p.owned} / ${p.total} 所持 (${p.percent}%)`;
  $("pack-progress-bar").style.width = `${p.percent}%`;
}

function renderRarityButtons() {
  const root = $("rarity-filters");
  if (!root) return;
  root.innerHTML = "";

  const options = [
    ["all", "すべて"],
    ["◊", "◆1"],
    ["◊◊", "◆2"],
    ["◊◊◊", "◆3"],
    ["◊◊◊◊", "◆4"]
  ];

  options.forEach(([value, label]) => {
    const button = document.createElement("button");
    button.className = "filter-button" + (rarityFilter === value ? " active" : "");
    button.textContent = label;
    button.addEventListener("click", () => {
      rarityFilter = value;
      renderCards();
    });
    root.appendChild(button);
  });
}

function renderCards() {
  const root = $("card-list");
  root.innerHTML = "";
  const query = cardSearch.trim().toLowerCase();

  renderRarityButtons();

  let list = cardsForPack(selectedExpansion.id, selectedPack);
  list = rarityFiltered(list);
  if (filter === "owned") list = list.filter(c => isOwned(c.id));
  if (filter === "missing") list = list.filter(c => !isOwned(c.id));

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
    const selectedQty = getQty(c.id);
    const totalQty = getTotalQty(c.id);
    const el = document.createElement("article");
    el.className = `card ${totalQty ? "" : "missing"}`;

    const accountRows = accounts.map(a => `
      <div class="account-quantity-row">
        <span>${escapeHtml(a.name)}</span>
        <strong>${getQty(c.id, a.id)}</strong>
      </div>
    `).join("");

    el.innerHTML = `
      ${totalQty ? `<div class="owned-badge">所持</div>` : ""}
      <img class="card-image" loading="lazy" src="https://cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database/cards-by-set/${encodeURIComponent(c.set)}/${encodeURIComponent(c.number)}.webp" alt="${escapeHtml(c.displayName)}"
           onerror="this.style.visibility='hidden'">
      <div class="card-info">
        <div class="card-name">${escapeHtml(c.displayName)}</div>
        <div class="card-meta">${escapeHtml(c.id.toUpperCase())}</div>
        <div class="rarity">${escapeHtml(RARITY_LABELS[normalizeRarity(c.rarity)] || c.rarity || "")}${c.ex === "Yes" ? " / ex" : ""}</div>

        <div class="quantity-row">
          <button aria-label="1枚減らす">−</button>
          <span class="quantity">${selectedQty}</span>
          <button aria-label="1枚増やす">＋</button>
        </div>

        <div class="account-quantities">
          ${accountRows}
          <div class="total-owned">全アカウント合計：<strong>${totalQty}</strong>枚</div>
        </div>
      </div>
    `;

    const buttons = el.querySelectorAll(".quantity-row button");
    buttons[0].addEventListener("click", () => changeQty(c.id, -1));
    buttons[1].addEventListener("click", () => changeQty(c.id, +1));
    root.appendChild(el);
  });
}

function changeQty(cardId, delta) {
  const data = getOwned();
  if (!data[cardId]) data[cardId] = {};

  const next = Math.max(0, Number(data[cardId][selectedAccountId] || 0) + delta);
  if (next === 0) delete data[cardId][selectedAccountId];
  else data[cardId][selectedAccountId] = next;

  if (Object.keys(data[cardId]).length === 0) delete data[cardId];
  saveOwned(data);

  renderCards();
  updatePackProgress();
  updateTotal();
  renderHome();
}

function updateTotal() {
  const p = progressInfo(cards);
  $("total-progress").textContent =
    `${p.owned.toLocaleString()} / ${p.total.toLocaleString()} (${p.percent}%)`;
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

$("add-account-button").addEventListener("click", () => {
  $("new-account-name").value = "";
  $("account-modal").classList.remove("hidden");
  $("new-account-name").focus();
});

$("cancel-account-button").addEventListener("click", () =>
  $("account-modal").classList.add("hidden")
);
$("save-account-button").addEventListener("click", addAccount);
$("new-account-name").addEventListener("keydown", e => {
  if (e.key === "Enter") addAccount();
});

$("account-modal").addEventListener("click", e => {
  if (e.target === $("account-modal"))
    $("account-modal").classList.add("hidden");
});

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
  if (!confirm("すべてのアカウントの所持情報を削除します。よろしいですか？")) return;
  localStorage.removeItem(STORAGE_KEY);
  updateTotal();
  renderHome();
  if (selectedPack) {
    updatePackProgress();
    renderCards();
  }
  toast("全アカウントの所持情報をリセットしました");
});

$("export-button").addEventListener("click", () => {
  const data = {
    app: "pokepoke-card-manager",
    version: 3,
    exportedAt: new Date().toISOString(),
    accounts,
    selectedAccountId,
    owned: getOwned()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pokepoke-collection-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  toast("全アカウントのバックアップを保存しました");
});

$("import-file").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data.owned !== "object" || !Array.isArray(data.accounts)) {
      throw new Error();
    }
    accounts = data.accounts;
    selectedAccountId = accounts.some(a => a.id === data.selectedAccountId)
      ? data.selectedAccountId : accounts[0].id;
    saveAccounts();
    saveOwned(data.owned);
    renderAccounts();
    updateSelectedAccountName();
    updateTotal();
    renderHome();
    if (selectedPack) {
      updatePackProgress();
      renderCards();
    }
    toast("バックアップを復元しました");
  } catch {
    alert("このバージョンのバックアップファイルを読み込めませんでした。");
  } finally {
    e.target.value = "";
  }
});

loadData();

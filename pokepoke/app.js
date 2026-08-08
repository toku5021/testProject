let cards = [];
let selectedPack = null;
let currentFilter = "all";

const STORAGE_KEY = "pokepoke-owned-cards";

// --------------------
// 初期化
// --------------------

document.addEventListener("DOMContentLoaded", async () => {

    try {
        const response = await fetch("cards.json");

        if (!response.ok) {
            throw new Error("カードデータを取得できませんでした");
        }

        cards = await response.json();

        renderPacks();
        updateTotalProgress();

    } catch (error) {
        console.error(error);

        alert(
            "カードデータを読み込めませんでした。\n" +
            "ローカルサーバーから起動してください。"
        );
    }
});

// --------------------
// localStorage
// --------------------

function getOwnedCards() {

    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
        return {};
    }

    return JSON.parse(data);
}

function saveOwnedCards(data) {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}

function getQuantity(cardId) {

    const owned = getOwnedCards();

    return owned[cardId] || 0;
}

// --------------------
// パック一覧
// --------------------

function renderPacks() {

    const packList = document.getElementById("pack-list");

    packList.innerHTML = "";

    const packs = {};

    cards.forEach(card => {

        if (!packs[card.pack]) {

            packs[card.pack] = {
                name: card.packName,
                cards: []
            };
        }

        packs[card.pack].cards.push(card);
    });

    Object.entries(packs).forEach(([packId, pack]) => {

        const ownedCount = pack.cards.filter(
            card => getQuantity(card.id) > 0
        ).length;

        const div = document.createElement("div");

        div.className = "pack";

        div.innerHTML = `
            <div class="pack-name">
                ${packId} ${pack.name}
            </div>

            <div class="pack-progress">
                ${ownedCount} / ${pack.cards.length} 所持
            </div>
        `;

        div.addEventListener("click", () => {

            openPack(packId);

        });

        packList.appendChild(div);

    });
}

// --------------------
// パック表示
// --------------------

function openPack(packId) {

    selectedPack = packId;

    currentFilter = "all";

    document
        .querySelector("main section:nth-child(2)")
        .classList.add("hidden");

    document
        .getElementById("card-section")
        .classList.remove("hidden");

    const packCards = cards.filter(
        card => card.pack === packId
    );

    if (packCards.length === 0) {
        return;
    }

    document.getElementById(
        "selected-pack-name"
    ).textContent =
        `${packId} ${packCards[0].packName}`;

    updatePackProgress();

    renderCards();

    updateFilterButtons();
}

// --------------------
// カード一覧
// --------------------

function renderCards() {

    const cardList = document.getElementById("card-list");

    cardList.innerHTML = "";

    let packCards = cards.filter(
        card => card.pack === selectedPack
    );

    if (currentFilter === "owned") {

        packCards = packCards.filter(
            card => getQuantity(card.id) > 0
        );

    } else if (currentFilter === "missing") {

        packCards = packCards.filter(
            card => getQuantity(card.id) === 0
        );

    }

    packCards.forEach(card => {

        const quantity = getQuantity(card.id);

        const div = document.createElement("div");

        div.className = "card";

        div.innerHTML = `
            <img
                class="card-image"
                src="${card.image}"
                alt="${card.name}"
            >

            <div class="card-name">
                ${card.name}
            </div>

            <div class="card-number">
                ${card.id} / ${card.rarity}
            </div>

            <div class="quantity">

                <button data-action="minus">
                    −
                </button>

                <span class="quantity-value">
                    ${quantity}
                </span>

                <button data-action="plus">
                    ＋
                </button>

            </div>
        `;

        div.querySelector(
            '[data-action="minus"]'
        ).addEventListener("click", () => {

            changeQuantity(card.id, -1);

        });

        div.querySelector(
            '[data-action="plus"]'
        ).addEventListener("click", () => {

            changeQuantity(card.id, 1);

        });

        cardList.appendChild(div);

    });
}

// --------------------
// 所持枚数変更
// --------------------

function changeQuantity(cardId, amount) {

    const owned = getOwnedCards();

    const current = owned[cardId] || 0;

    const next = Math.max(
        0,
        current + amount
    );

    owned[cardId] = next;

    saveOwnedCards(owned);

    renderCards();

    updatePackProgress();

    updateTotalProgress();

    renderPacks();
}

// --------------------
// パック進捗
// --------------------

function updatePackProgress() {

    const packCards = cards.filter(
        card => card.pack === selectedPack
    );

    const ownedCount = packCards.filter(
        card => getQuantity(card.id) > 0
    ).length;

    const percentage =
        packCards.length === 0
            ? 0
            : Math.round(
                ownedCount / packCards.length * 100
            );

    document.getElementById(
        "pack-progress"
    ).textContent =
        `${ownedCount} / ${packCards.length} (${percentage}%)`;
}

// --------------------
// 全体進捗
// --------------------

function updateTotalProgress() {

    const total = cards.length;

    const ownedCount = cards.filter(
        card => getQuantity(card.id) > 0
    ).length;

    const percentage =
        total === 0
            ? 0
            : Math.round(
                ownedCount / total * 100
            );

    document.getElementById(
        "progress-text"
    ).textContent =
        `${ownedCount} / ${total} (${percentage}%)`;

    document.getElementById(
        "progress"
    ).style.width =
        `${percentage}%`;
}

// --------------------
// 戻る
// --------------------

document.getElementById(
    "back-button"
).addEventListener("click", () => {

    document
        .getElementById("card-section")
        .classList.add("hidden");

    document
        .querySelector("main section:nth-child(2)")
        .classList.remove("hidden");

    renderPacks();
});

// --------------------
// フィルター
// --------------------

document.querySelectorAll(
    ".filter-button"
).forEach(button => {

    button.addEventListener("click", () => {

        currentFilter =
            button.dataset.filter;

        updateFilterButtons();

        renderCards();

    });

});

function updateFilterButtons() {

    document.querySelectorAll(
        ".filter-button"
    ).forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.filter === currentFilter
        );

    });
}

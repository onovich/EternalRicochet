import { getUpgradeCost, getUpgradeLevel } from "../../logic/engine/metaProgression.js";

export function createUpgradeShop({
  documentRef = document,
  metaStore,
  config,
  onChange = () => {},
} = {}) {
  const mainMenu = documentRef.getElementById("main-menu");
  const gameOverMenu = documentRef.getElementById("game-over-menu");
  const upgradeMenu = documentRef.getElementById("upgrade-menu");
  const upgradeBalance = documentRef.getElementById("upgrade-balance");
  const upgradeList = documentRef.getElementById("upgrade-list");
  const closeButton = documentRef.getElementById("close-upgrades-btn");
  const mainOpenButton = documentRef.getElementById("upgrades-btn");
  const gameOverOpenButton = documentRef.getElementById("gameover-upgrades-btn");
  let returnPanel = "main";

  function show(source = "main") {
    returnPanel = source;
    mainMenu.classList.add("hidden");
    gameOverMenu.classList.add("hidden");
    upgradeMenu.classList.remove("hidden");
    render();
  }

  function hide() {
    upgradeMenu.classList.add("hidden");
    if (returnPanel === "gameover") {
      gameOverMenu.classList.remove("hidden");
    } else {
      mainMenu.classList.remove("hidden");
    }
  }

  function render() {
    const state = metaStore.getState();
    upgradeBalance.innerText = state.credits;
    upgradeList.innerHTML = Object.entries(config.upgrades)
      .map(([id, upgrade]) => renderUpgradeRow({ id, upgrade, state }))
      .join("");
  }

  function renderUpgradeRow({ id, upgrade, state }) {
    const level = getUpgradeLevel(id, state, config);
    const cost = getUpgradeCost(id, state, config);
    const isMaxed = level >= upgrade.maxLevel;
    const canBuy = !isMaxed && state.credits >= cost;
    const buttonText = isMaxed ? "MAX" : canBuy ? `BUY ${cost}` : `NEED ${cost}`;
    const buttonClass = canBuy
      ? "bg-cyan-600 hover:bg-cyan-500 text-white"
      : "bg-gray-800 text-gray-500 cursor-not-allowed";

    return `
      <article class="rounded-lg border border-cyan-500/25 bg-black/45 p-3 text-left">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-cyber text-sm text-cyan-200">${upgrade.label}</h3>
            <p class="mt-1 text-xs text-gray-400">${describeUpgrade(id, upgrade)}</p>
          </div>
          <div class="shrink-0 text-right font-cyber text-xs text-yellow-300">
            LV ${level}/${upgrade.maxLevel}
          </div>
        </div>
        <button
          class="mt-3 w-full rounded-md px-3 py-2 text-xs font-bold tracking-wider transition ${buttonClass}"
          data-upgrade-id="${id}"
          ${canBuy ? "" : "disabled"}
        >${buttonText}</button>
      </article>
    `;
  }

  function describeUpgrade(id, upgrade) {
    if (id === "gravityRecall") {
      return `Recall force +${upgrade.recallForcePerLevel.toFixed(2)} per level`;
    }
    if (id === "armorPiercer") {
      return `Kill damping +${Math.round(upgrade.killDampingBonusPerLevel * 100)}% per level`;
    }
    if (id === "energyShield") {
      return `Max HP +${upgrade.hpPerLevel} per level`;
    }
    if (id === "multiball") {
      return `Total balls +${upgrade.ballsPerLevel} per level`;
    }
    if (id === "ultimateCap") {
      return `Ultimate charge +${upgrade.chargesPerLevel} per level`;
    }
    return "Upgrade effect applies on the next run";
  }

  mainOpenButton.addEventListener("click", () => show("main"));
  gameOverOpenButton.addEventListener("click", () => show("gameover"));
  closeButton.addEventListener("click", hide);
  upgradeList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-upgrade-id]");
    if (!button) return;
    metaStore.purchase(button.dataset.upgradeId);
    onChange(metaStore.getState());
    render();
  });

  render();
  return { show, hide, render };
}

export function createHud(documentRef = document) {
  const uiLayer = documentRef.getElementById("ui-layer");
  const hud = documentRef.getElementById("hud");
  const mainMenu = documentRef.getElementById("main-menu");
  const gameOverMenu = documentRef.getElementById("game-over-menu");
  const finalScore = documentRef.getElementById("final-score");
  const highScore = documentRef.getElementById("high-score");
  const creditsEarned = documentRef.getElementById("credits-earned");
  const totalCredits = documentRef.getElementById("total-credits");
  const healthBar = documentRef.getElementById("health-bar");
  const ammoDisplay = documentRef.getElementById("ammo-display");
  const comboDisplay = documentRef.getElementById("combo-display");
  const score = documentRef.getElementById("score");
  const scoreContainer = documentRef.getElementById("score-container");

  function showPlaying() {
    uiLayer.classList.add("hidden");
    hud.classList.remove("hidden");
    mainMenu.classList.add("hidden");
    gameOverMenu.classList.add("hidden");
  }

  function showGameOver({ scoreValue, highScoreValue, settlement }) {
    uiLayer.classList.remove("hidden");
    gameOverMenu.classList.remove("hidden");
    finalScore.innerText = scoreValue;
    highScore.innerText = highScoreValue;
    if (creditsEarned) creditsEarned.innerText = settlement?.earned ?? 0;
    if (totalCredits) totalCredits.innerText = settlement?.state?.credits ?? 0;
    hud.classList.add("hidden");
  }

  function update({ hp, maxHp, bulletActive, ammoState, scoreValue, combo }) {
    healthBar.innerHTML = Array.from({ length: maxHp }, (_, index) => {
      const className = index < hp ? "" : ' class="text-gray-700"';
      return `<span${className}>\u2665</span>`;
    }).join("");
    const ammo = ammoState ?? { available: bulletActive ? 0 : 1, total: 1 };
    ammoDisplay.innerText = `${ammo.available} / ${ammo.total}`;
    if (comboDisplay) {
      comboDisplay.innerText = combo?.visible ? `COMBO X${combo.multiplier} / ${combo.killCount}` : "";
      comboDisplay.classList.toggle("hidden", !combo?.visible);
    }
    score.innerText = scoreValue;
  }

  function pulseScore() {
    scoreContainer.style.transform = "scale(1.3)";
    setTimeout(() => {
      scoreContainer.style.transform = "scale(1)";
    }, 100);
  }

  function updateMeta({ metaState }) {
    if (totalCredits) totalCredits.innerText = metaState?.credits ?? 0;
  }

  return { showPlaying, showGameOver, update, updateMeta, pulseScore };
}

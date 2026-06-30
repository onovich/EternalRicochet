import { GAME_METADATA } from "./data/gameMetadata.js";
import { requireElements } from "./view/components/requiredElements.js";
import { DOM_IDS } from "./view/screens/domIds.js";

export function prepareDocument() {
  document.documentElement.lang = "zh";
  document.title = `${GAME_METADATA.titleZh} / ${GAME_METADATA.titleEn}`;
}

export function ensureGameShell() {
  requireElements(Object.values(DOM_IDS));
}

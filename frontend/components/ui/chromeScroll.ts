import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Easing, makeMutable, withTiming } from "react-native-reanimated";

/**
 * Défilement de l'accueil partagé avec la barre du haut (flou) et la barre d'onglets (réduite).
 * `chromeY` : position de défilement (px) ; `chromeCompact` : 0 = barre normale, 1 = réduite.
 */
export const chromeY = makeMutable(0);
export const chromeCompact = makeMutable(0);

const THRESHOLD = 4;
let lastY = 0;
let target = 0;
// Seuls les défilements commencés au doigt sur la page courante comptent : l'inertie d'une
// page quittée continue d'émettre des événements et ne doit pas réduire la barre de la suivante.
let armed = false;

function setCompact(next: 0 | 1) {
  if (next === target) return;
  target = next;
  chromeCompact.set(withTiming(next, { duration: 480, easing: Easing.inOut(Easing.quad) }));
}

/** À brancher sur `onScroll` : réduit la barre en descendant, la rétablit en remontant. */
export function onChromeScroll(y: number) {
  if (!armed) return;
  const offset = Math.max(0, y);
  const delta = offset - lastY;
  chromeY.set(offset);
  if (offset <= 8) setCompact(0);
  else if (delta > THRESHOLD) setCompact(1);
  else if (delta < -THRESHOLD) setCompact(0);
  lastY = offset;
}

/** À appeler quand le doigt commence à faire défiler la page. */
export function armChrome() {
  armed = true;
}

export function resetChrome() {
  armed = false;
  lastY = 0;
  chromeY.set(0);
  setCompact(0);
}

/** Rétablit la barre d'onglets à sa taille normale (au toucher de la barre, par exemple). */
export function expandChrome() {
  setCompact(0);
}

/** À étaler (`{...chromeScrollProps}`) sur un ScrollView ou une FlatList verticale. */
export const chromeScrollProps = {
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    onChromeScroll(e.nativeEvent.contentOffset.y),
  onScrollBeginDrag: armChrome,
  scrollEventThrottle: 16,
};

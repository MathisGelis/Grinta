const resetters: (() => void)[] = [];

export function onSessionCleared(reset: () => void) {
  resetters.push(reset);
}

export function runSessionResets() {
  resetters.forEach((reset) => reset());
}

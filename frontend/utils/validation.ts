export const UNIQUE_NAME_REGEX = /^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$/;

export const LIMITS = {
  displayName: 50,
  uniqueNameMin: 3,
  uniqueName: 30,
  email: 254,
  password: 72,
} as const;

export const isValidUniqueName = (value: string): boolean => {
  const v = value.trim().toLowerCase();
  return (
    v.length >= LIMITS.uniqueNameMin &&
    v.length <= LIMITS.uniqueName &&
    UNIQUE_NAME_REGEX.test(v)
  );
};

/** Retire les caractères interdits dans un pseudo (pour la saisie). */
export const sanitizeUniqueName = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_.]/g, "").slice(0, LIMITS.uniqueName);

/** Génère un pseudo valide à partir d'un nom affiché ou d'un email. */
export const buildUniqueName = (name: string, email: string): string => {
  const raw = name.trim() || email.split("@")[0];
  const base = raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, LIMITS.uniqueName - 4);
  const suffix = String(Math.floor(Math.random() * 1000));
  return (base.length >= 2 ? base : "user") + suffix;
};

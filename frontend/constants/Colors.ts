import palette from './palette';

export const WorkoutTheme = {
  background: palette.background,
  backgroundSecondary: palette.surface,
  backgroundTertiary: palette.raised,

  text: {
    primary: palette.ink,
    secondary: palette.inkSoft,
    tertiary: palette.inkMuted,
    disabled: palette.inkFaint,
    light: palette.inkLight,
  },

  accent: {
    purple: palette.accent,
    purpleLight: palette.accentLight,
    purpleDark: palette.accentDark,
    purpleTint: palette.accentTint,
    purpleText: palette.accentText,
  },

  status: {
    success: palette.success,
    warning: palette.warning,
    danger: palette.danger,
    info: palette.info,
    successTint: palette.successTint,
    dangerTint: palette.dangerTint,
    dangerBorder: palette.dangerBorder,
    dangerLight: palette.dangerLight,
    infoTint: palette.infoTint,
  },

  border: palette.line,

  overlay: {
    dim: palette.overlay,
    scrim: palette.scrim,
    glassFill: palette.glassFill,
    glassBorder: palette.glassBorder,
    glassText: palette.glassText,
    glassStrong: palette.glassStrong,
  },
};

export const withAlpha = (hex: string, opacity: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
};

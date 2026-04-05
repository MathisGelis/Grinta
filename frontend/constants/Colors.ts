/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// Workout theme with dark grays and purple accents
export const WorkoutTheme = {
  // Dark backgrounds
  background: '#0F0F0F',
  backgroundSecondary: '#1A1A1A',
  backgroundTertiary: '#252525',
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#B8B8B8',
    tertiary: '#808080',
  },
  
  // Accent colors
  accent: {
    purple: '#7C5DB7',
    purpleLight: '#9B79D8',
    purpleDark: '#5A3F8F',
  },
  
  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  
  // Border colors
  border: '#333333',
};

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1e293b',
    background: '#f8fafc',
    surface: '#ffffff',
    primary: '#0ea5e9', // Ocean Blue
    secondary: '#10b981', // Emerald/Success
    accent: '#f59e0b', // Amber/Warning
    danger: '#ef4444', 
    border: '#e2e8f0',
    icon: '#64748b',
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#0ea5e9',
  },
  dark: {
    // Tackle Assist Premium Dark Marine Theme
    text: '#f8fafc',
    background: '#0f172a', // Deep Slate / Sea Bottom
    surface: '#1e293b', // Elevated Container
    primary: '#0ea5e9', // Ocean Blue / Accent
    secondary: '#10b981', // Safe / Success
    accent: '#f59e0b', // Alert / Warning
    danger: '#ef4444', // Delete / Error
    border: '#334155', // Subtle divider
    icon: '#94a3b8',
    tabIconDefault: '#64748b',
    tabIconSelected: '#0ea5e9',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

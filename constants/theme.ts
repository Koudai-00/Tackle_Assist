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
    // Tackle Assist Clean Modern Theme (Overriding dark properties for global app change)
    text: '#1e293b', // Dark Slate for crisp readability
    background: '#f8fafc', // Very subtle off-white background
    surface: '#ffffff', // Clean white cards
    primary: '#1dc6cc', // Adjusted Teal/Cyan Accent for better visibility
    secondary: '#10b981', // Success
    accent: '#f59e0b', // Warning
    danger: '#ef4444', // Danger
    border: '#e2e8f0', // Soft visible border
    icon: '#64748b', // Slate-500 neutral icons
    tabIconDefault: '#94a3b8',
    tabIconSelected: '#1dc6cc',
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

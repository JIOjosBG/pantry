import { CATEGORY_EMOJI } from '@/domain/emoji';
import { ExpiryStatus } from '@/domain/expiry';

export type ThemeName = 'light' | 'dark';

export const lightColors = {
  bg: '#f6f7f9',
  surface: '#ffffff',
  border: '#e3e6ea',
  text: '#14181d',
  textMuted: '#6b7480',
  primary: '#1f7a4d',
  primaryText: '#ffffff',
  danger: '#c0392b',
  dangerBg: '#fdecea',
  expired: '#c0392b',
  urgent: '#e07b22',
  soon: '#c9a227',
  ok: '#1f7a4d',
};

export type Colors = typeof lightColors;

export const darkColors: Colors = {
  bg: '#101418',
  surface: '#181e25',
  border: '#2a333d',
  text: '#eef2f6',
  textMuted: '#9aa5b1',
  primary: '#35a06a',
  primaryText: '#08130d',
  danger: '#ef6b5e',
  dangerBg: '#3a1f1c',
  expired: '#ef6b5e',
  urgent: '#f0a355',
  soon: '#dfc65a',
  ok: '#35a06a',
};

export const themes: Record<ThemeName, Colors> = { light: lightColors, dark: darkColors };

export function statusColors(colors: Colors): Record<ExpiryStatus, string> {
  return {
    expired: colors.expired,
    urgent: colors.urgent,
    soon: colors.soon,
    ok: colors.ok,
  };
}

/** Section headers still label a whole category; individual items use `foodEmoji`. */
export const categoryEmoji = CATEGORY_EMOJI;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 10, lg: 16 };

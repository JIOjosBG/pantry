import { ExpiryStatus } from '@/domain/expiry';
import { Category } from '@/domain/types';

export const colors = {
  bg: '#f6f7f9',
  surface: '#ffffff',
  border: '#e3e6ea',
  text: '#14181d',
  textMuted: '#6b7480',
  primary: '#1f7a4d',
  primaryText: '#ffffff',
  danger: '#c0392b',
  expired: '#c0392b',
  urgent: '#e07b22',
  soon: '#c9a227',
  ok: '#1f7a4d',
};

export const statusColor: Record<ExpiryStatus, string> = {
  expired: colors.expired,
  urgent: colors.urgent,
  soon: colors.soon,
  ok: colors.ok,
};

export const categoryEmoji: Record<Category, string> = {
  produce: '🥬',
  dairy: '🧀',
  meat: '🥩',
  seafood: '🐟',
  bakery: '🍞',
  pantry: '🥫',
  frozen: '🧊',
  drinks: '🧃',
  other: '🍽️',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 10, lg: 16 };

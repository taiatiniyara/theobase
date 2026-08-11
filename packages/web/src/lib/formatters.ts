export function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(value: number, locale: string, decimals = 0): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(date: Date | number | string, locale: string, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: style,
  }).format(new Date(date));
}

export function formatDateShort(date: Date | number | string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'short',
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = Date.now();
  const diff = new Date(date).getTime() - now;
  const seconds = Math.round(diff / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (Math.abs(days) >= 1) return rtf.format(days, 'day');
  if (Math.abs(hours) >= 1) return rtf.format(hours, 'hour');
  if (Math.abs(minutes) >= 1) return rtf.format(minutes, 'minute');
  return rtf.format(seconds, 'second');
}

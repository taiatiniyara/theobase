export interface SabbathWindow {
  sunsetFriday: Date;
  sunsetSaturday: Date;
}

export function getSabbathWindow(
  date: Date,
  lat: number,
  lng: number
): SabbathWindow {
  const friday = getFridayBefore(date);
  const saturday = new Date(friday);
  saturday.setDate(saturday.getDate() + 1);

  return {
    sunsetFriday: approximateSunset(friday, lat, lng),
    sunsetSaturday: approximateSunset(saturday, lat, lng),
  };
}

function getFridayBefore(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 5 ? 0 : day < 5 ? -(day + 2) : -(day - 5);
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function approximateSunset(date: Date, lat: number, _lng: number): Date {
  const dayOfYear = getDayOfYear(date);
  const declination = 23.45 * Math.sin(((360 / 365) * (dayOfYear - 81) * Math.PI) / 180);
  const latRad = (lat * Math.PI) / 180;
  const declRad = (declination * Math.PI) / 180;

  const cosH =
    (Math.sin((-0.83 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(declRad)) /
    (Math.cos(latRad) * Math.cos(declRad));

  const H = Math.acos(Math.max(-1, Math.min(1, cosH)));
  const hours = 12 + H * (180 / Math.PI) / 15;

  const result = new Date(date);
  result.setHours(Math.floor(hours), Math.round((hours % 1) * 60), 0, 0);
  return result;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isDuringSabbath(date: Date, window: SabbathWindow): boolean {
  return date >= window.sunsetFriday && date <= window.sunsetSaturday;
}

export function shiftBeforeSabbath(date: Date, window: SabbathWindow): Date {
  if (date >= window.sunsetFriday && date <= window.sunsetSaturday) {
    const result = new Date(window.sunsetFriday);
    result.setHours(result.getHours() - 1);
    return result;
  }
  return date;
}

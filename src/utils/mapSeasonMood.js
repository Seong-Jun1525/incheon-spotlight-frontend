/**
 * 메인 3D 맵의 가벼운 계절 틴트.
 * 구 하이라이트·랜드마크 색은 바꾸지 않고 조명·바닥만 조절합니다.
 * 값이 없으면 기존 dark/light 조명을 그대로 씁니다.
 */

export function seasonIdFromMonth(month) {
  const value = Number(month);
  if (value === 12 || value === 1 || value === 2) return 'winter';
  if (value >= 3 && value <= 5) return 'spring';
  if (value >= 6 && value <= 8) return 'summer';
  if (value >= 9 && value <= 11) return 'autumn';
  return null;
}

export function mapSeasonLights(seasonId, isDark) {
  if (seasonId === 'winter') {
    return isDark
      ? { hemi: '#b7c7dc', dir: '#d7e4f2', fill: '#7f93aa' }
      : { hemi: '#f4f7fb', dir: '#f2f6fb', fill: '#d7e3ef' };
  }
  if (seasonId === 'spring') {
    return isDark
      ? { hemi: '#c9d6c8', dir: '#efe6d4', fill: '#8fa48a' }
      : { hemi: '#fffdf8', dir: '#fff6e8', fill: '#e7efe0' };
  }
  if (seasonId === 'summer') {
    return isDark
      ? { hemi: '#b9d0e4', dir: '#e4eef6', fill: '#6f91ae' }
      : { hemi: '#f7fbff', dir: '#eef6ff', fill: '#d5e6f4' };
  }
  if (seasonId === 'autumn') {
    return isDark
      ? { hemi: '#d2c4b0', dir: '#f0d9b8', fill: '#a07a58' }
      : { hemi: '#fff8f0', dir: '#ffe7c8', fill: '#f3e2cc' };
  }
  return null;
}

export function mapSeasonFloor(seasonId, isDark) {
  if (seasonId === 'winter') return isDark ? '#121a24' : '#dfe6ee';
  if (seasonId === 'spring') return isDark ? '#182018' : '#e6eadf';
  if (seasonId === 'summer') return isDark ? '#132028' : '#dde6ec';
  if (seasonId === 'autumn') return isDark ? '#1c1814' : '#ece4d8';
  return isDark ? '#15202c' : '#e8e8e3';
}

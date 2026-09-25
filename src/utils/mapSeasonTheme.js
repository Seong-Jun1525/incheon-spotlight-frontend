/**
 * 메인 3D 맵 계절 테마.
 * 월(맵 캘린더)로 기본 연출을 고르고, 비·눈만 해당 지역 실황에 맞춥니다.
 */

export function isRainLabel(label) {
  return /비|소나기|강수|빗방울|Rain|rain|Shower|shower|雨/.test(String(label || ''));
}

export function isSnowLabel(label) {
  return /눈|적설|Snow|snow|雪/.test(String(label || ''));
}

/**
 * @param {number | null | undefined} month 1–12
 * @param {string | null | undefined} weatherLabel
 */
export function resolveMapSeasonTheme(month, weatherLabel) {
  const value = Number(month);
  const raining = isRainLabel(weatherLabel);
  const snowing = isSnowLabel(weatherLabel);

  if (value === 3 || value === 4) {
    return {
      id: 'blossom',
      petals: true,
      sun: false,
      rain: false,
      leaves: false,
      snow: false,
    };
  }
  if (value === 5 || value === 6) {
    return {
      id: 'sun',
      petals: false,
      sun: true,
      rain: false,
      leaves: false,
      snow: false,
    };
  }
  if (value === 7 || value === 8) {
    return {
      id: raining ? 'sun-rain' : 'sun',
      petals: false,
      sun: true,
      rain: raining,
      leaves: false,
      snow: false,
    };
  }
  if (value === 9 || value === 10) {
    return {
      id: 'leaves',
      petals: false,
      sun: false,
      rain: false,
      leaves: true,
      snow: false,
    };
  }
  if (value === 11 || value === 12 || value === 1 || value === 2) {
    return {
      id: snowing ? 'snow' : 'winter',
      petals: false,
      sun: false,
      rain: false,
      leaves: false,
      snow: snowing,
    };
  }

  return {
    id: null,
    petals: false,
    sun: false,
    rain: false,
    leaves: false,
    snow: false,
  };
}

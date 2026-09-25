/**
 * 주변 맛집·숙박이 인천인지 주소로 판별합니다.
 * 좌표 상자는 서울·경기와 겹치므로 행정구역 이름으로 거릅니다.
 * 백엔드 IncheonPlaceFilter와 같은 기준입니다.
 */
export function isIncheonAddress(address) {
  const compact = String(address ?? '').replace(/\s+/g, '');
  if (!compact) return false;
  if (compact.startsWith('인천') || compact.includes('인천광역시')) return true;
  return /incheon/i.test(String(address));
}

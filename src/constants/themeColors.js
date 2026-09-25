/**
 * 테마 칩·배지용 소프트 컬러 매핑 (UI 전용).
 * 관광지 데이터에 컬러 필드를 하드코딩하지 않습니다.
 */
export const THEME_COLORS = {
  데이트: {
    color: '#8A315D',
    background: '#FDEBF4',
    accent: '#EE84B5',
  },
  야경: {
    color: '#A01029',
    background: '#FDE8EC',
    accent: '#E51937',
  },
  가족: {
    color: '#9A5300',
    background: '#FFF2DD',
    accent: '#F8981D',
  },
  역사: {
    color: '#4D4314',
    background: '#FFFBE3',
    accent: '#FFF16E',
  },
  바다: {
    color: '#9A5300',
    background: '#FFF2DD',
    accent: '#F8981D',
  },
  산책: {
    color: '#4D4314',
    background: '#FFFBE3',
    accent: '#FFF16E',
  },
  노을: {
    color: '#A01029',
    background: '#FDE8EC',
    accent: '#E51937',
  },
  사진: {
    color: '#8A315D',
    background: '#FDEBF4',
    accent: '#EE84B5',
  },
};

export function getThemeColor(theme) {
  return (
    THEME_COLORS[theme] ?? {
      color: '#626262',
      background: '#F5F5F2',
      accent: '#F8981D',
    }
  );
}

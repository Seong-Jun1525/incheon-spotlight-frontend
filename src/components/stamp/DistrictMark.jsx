/**
 * DistrictMark.jsx — 인천 구·군을 상징하는 SVG 아이콘 마크
 * - regionId를 resolveDistrictId로 정규화해 지역별 글리프(ICONS)를 고름
 * - 대응 아이콘이 없으면 지역명 첫 글자를 대체 표시하고, size에 따라 축소 변형 클래스를 적용
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { resolveDistrictId } from '../../data/incheonDistricts';
import styles from './DistrictMark.module.scss';

const GLYPH = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

function Glyph({ children }) {
  useUiLanguage();
  return <svg {...GLYPH}>{uiText(children)}</svg>;
}

const ICONS = {
  jemulpo: (
    <Glyph>
      <path d='M10 21V10h4v11' />
      <path d='M9 10h6V7H9z' />
      <path d='M12 3.2v2.6' />
      <path d='M8.2 6.2 10 8M15.8 6.2 14 8' />
      <path d='M6.5 21h11' />
    </Glyph>
  ),
  yeonsu: (
    <Glyph>
      <path d='M4 19V11h4v8' />
      <path d='M9 19V7h6v12' />
      <path d='M16 19v-5h4v5' />
      <path d='M3 20.5c3 .9 6 .9 9 0s6-.9 9 0' />
    </Glyph>
  ),
  ganghwa: (
    <Glyph>
      <path d='M4 20V11h3V8h3v3h4V8h3v3h3v9' />
      <path d='M10 20v-5h4v5' />
      <path d='M4 11h16' />
    </Glyph>
  ),
  namdong: (
    <Glyph>
      <path d='M6.5 20V10' />
      <path d='M6.5 12c.8-3.4 3.6-3.6 4.2.2' />
      <path d='M11 20v-7.5' />
      <path d='M11 13.2c.8-3 3.4-3.2 4 .2' />
      <path d='M3.5 20.6c4.5 1.3 10.5 1.3 17 0' />
    </Glyph>
  ),
  seohae: (
    <Glyph>
      <circle cx='12' cy='7.5' r='2.6' />
      <path d='M12 3.2v1.2M8.1 5.1l.9.9M15.9 5.1l-.9.9' />
      <path d='M3.5 14.2c2.8 2.2 5.2 2.2 8.5 0s5.7-2.2 8.5 0' />
      <path d='M3.5 18.4c2.8 2.2 5.2 2.2 8.5 0s5.7-2.2 8.5 0' />
    </Glyph>
  ),
  geomdan: (
    <Glyph>
      <path d='M4 20V13h4v7' />
      <path d='M9.5 20V9h5v11' />
      <path d='M16 20V6h4v14' />
      <path d='M3.5 20.5h17' />
    </Glyph>
  ),
  gyeyang: (
    <Glyph>
      <path d='M3 19 8.2 8.5l4.3 7.2 3.1-5.2L21 19z' />
      <path d='M3 19h18' />
    </Glyph>
  ),
  bupyeong: (
    <Glyph>
      <path d='M4 19V10.5L12 6l8 4.5V19' />
      <path d='M9 19v-5h6v5' />
      <path d='M4 19h16' />
      <path d='M8 10.8h8' />
    </Glyph>
  ),
  michuhol: (
    <Glyph>
      <path d='M4 12 12 5l8 7' />
      <path d='M6.5 12v8h11v-8' />
      <path d='M12 12v8' />
      <path d='M9 16h6' />
    </Glyph>
  ),
  yeongjong: (
    <svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true'>
      <path d='M3 13.1h8.1L20.6 7.8l-1.35 5.3H21l-2.55 2.05h-5.35l-3.55 5.2-1.55-.75 1.5-4.45H3z' />
    </svg>
  ),
  ongjin: (
    <Glyph>
      <path d='M4.2 15.6c1.2-2.6 2.8-2.6 4 0' />
      <path d='M9.6 14.6c1.5-3.2 3.4-3.2 4.9 0' />
      <path d='M15.8 15.8c1.2-2.4 2.8-2.4 4 0' />
      <path d='M3 18.8c6 1.6 12 1.6 18 0' />
      <path d='M3 21.2c6 1.2 12 1.2 18 0' />
    </Glyph>
  ),
};

export function DistrictMark({ regionId, name = '', size = 40 }) {
  useUiLanguage();
  const id = resolveDistrictId(regionId);
  const icon = ICONS[id];
  const label = String(name || '').replace(/[구군시]$/, '').slice(0, 1) || '?';

  return (
    <span className={`${styles.mark} ${size <= 36 ? styles.sm : ''} ${id && styles[id] ? styles[id] : ''}`}>
      {icon || <span className={styles.letter}>{uiText(label)}</span>}
    </span>
  );
}

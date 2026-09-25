/**
 * VisitCard.jsx — 공개 방문 후기 피드용 카드 링크
 * - 커버 사진(없으면 장소명 첫 글자), 구·군, 장소명, 작성자 아바타를 표시
 * - variant='featured'면 제목을 h2로 올리고, 기본 이동 경로는 /visits/:verifyId
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { Link } from 'react-router-dom';
import { districtLabels } from '../../data/incheonDistricts';
import { resolveAssetUrl } from '../../utils/resolveAssetUrl';
import { NicknameAvatar } from '../stamp/NicknameAvatar';
import styles from '../../pages/VisitFeed.module.scss';

function coverOf(visit) {
  return visit.photos?.find((p) => p.sortNo === visit.coverSortNo) || visit.photos?.[0];
}

export function VisitCard({ visit, to, variant = 'card' }) {
  useUiLanguage();
  const cover = coverOf(visit);
  const src = cover?.thumbUrl || cover?.imageUrl || visit.heroImageUrl;
  const resolved = resolveAssetUrl(src || '');
  const region = districtLabels[visit.regionId] || visit.regionName;
  const HeadingTag = variant === 'featured' ? 'h2' : 'h3';

  return (
    <Link
      className={styles[variant] || styles.card}
      to={to || `/visits/${visit.verifyId}`}
    >
      <span className={styles.mediaWrap}>
        {resolved ? (
          <img
            className={styles.media}
            src={resolved}
            alt={uiText(`${visit.placeName} 방문 사진`)}
          />
        ) : (
          <span className={styles.fallback} aria-hidden>
            {(visit.placeName || '?').slice(0, 1)}
          </span>
        )}
      </span>
      <span className={styles.body}>
        {region ? <span className={styles.region}>{uiText(region)}</span> : null}
        <HeadingTag>{uiText(visit.placeName)}</HeadingTag>
        {visit.review ? <span className={styles.excerpt}>{visit.review}</span> : null}
        <span className={styles.who}>
          <NicknameAvatar nickname={visit.nickname} size={22} />
          <span>
            {visit.nickname}
            {uiText(visit.visitDate ? ` · ${visit.visitDate}` : '')}
          </span>
        </span>
      </span>
    </Link>
  );
}

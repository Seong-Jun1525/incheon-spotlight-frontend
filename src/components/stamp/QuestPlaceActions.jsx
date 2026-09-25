/**
 * QuestPlaceActions.jsx — 장소 상세에서 방문 인증(퀘스트) 가능 여부를 안내하는 액션
 * - fetchQuestPlaces로 해당 contentId가 스탬프 대상인지 확인하고 인증 작성 링크로 연결
 * - 대상이 아니면 여권 둘러보기, 오류면 재시도, 로그인이 필요하면 로그인으로 유도
 */
import { uiText, useUiLanguage } from '../../i18n/uiText';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Landmark } from 'lucide-react';
import { fetchQuestPlaces } from '../../api/stampApi';
import { useAuthStore } from '../../stores/useAuthStore';
import { Skeleton } from '../atoms/Skeleton';
import styles from '../layout/MemberShell.module.scss';
import questStyles from './QuestPlaceActions.module.scss';

export function QuestPlaceActions({ contentId, className = '', primaryClassName, secondaryClassName }) {
  useUiLanguage();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const query = useQuery({
    queryKey: ['quest-place', String(contentId || '')],
    queryFn: () => fetchQuestPlaces({ contentId: String(contentId) }),
    enabled: Boolean(contentId),
    staleTime: 60_000,
    retry: 1,
  });
  const place = query.data?.[0];

  if (query.isLoading) {
    return <Skeleton variant='text' count={1} className={[questStyles.notice, className].join(' ')} label={t('stamp.loading')} />;
  }
  if (!place) {
    return (
      <div className={[questStyles.notice, className].join(' ')}>
        <BookOpen size={18} aria-hidden='true' />
        <div className={questStyles.body}>
          <p>{t(query.isError ? 'stamp.unavailable' : 'stamp.notIncluded')}</p>
          {query.isError ? (
            <button type='button' onClick={() => query.refetch()}>{t('common.retry')}</button>
          ) : (
            <Link to='/mypage/passport'>{t('stamp.browse')} <ArrowRight size={14} aria-hidden='true' /></Link>
          )}
        </div>
      </div>
    );
  }
  const composeTo = '/visits/new?placeId=' + encodeURIComponent(place.placeId);
  return (
    <div className={[questStyles.eligible, className].join(' ')}>
      <div className={questStyles.buildReward}>
        <span className={questStyles.buildIcon} aria-hidden='true'><Landmark size={20} /></span>
        <div>
          <small>{uiText("방문 인증 보상")}</small>
          <strong>{uiText("인증하면 3D 지도에 이 랜드마크가 세워져요")}</strong>
          <p>{uiText("현장 사진을 남기고 스탬프를 받으면 공사현장이 완성된 랜드마크로 바뀝니다.")}</p>
        </div>
      </div>
      {place.verifyGuide && <p>{uiText(place.verifyGuide)}</p>}
      <div className={styles.actions}>
        <Link className={primaryClassName || styles.primary} to={user?.authenticated ? composeTo : '/login'} state={user?.authenticated ? undefined : { from: composeTo }}>
          {t(user?.authenticated ? 'stamp.verify' : 'stamp.loginVerify')}
        </Link>
        <Link className={secondaryClassName || styles.secondary} to={'/mypage/passport/' + place.regionId}>{t('stamp.passport')}</Link>
      </div>
    </div>
  );
}

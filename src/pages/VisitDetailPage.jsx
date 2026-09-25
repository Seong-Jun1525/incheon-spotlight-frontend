/**
 * VisitDetailPage.jsx — 방문 인증의 공개 상세·작성·내 인증 관리 화면 묶음
 * - 라우트: `/visits/:verifyId` (공개), VisitComposePage 는 `/visits/new` (로그인 필요)
 * - 공개 상세는 fetchPublicVisit 으로 사진·후기를 보여주고, 작성 화면은 PhotoUploader 로 올린 사진을 createVisit 으로 제출
 * - MyVisitDetailPage 는 `/mypage/verifications/:verifyId` 에서 수정·재제출·AI 재확인·삭제를 처리
 */
import { uiText, useUiLanguage } from '../i18n/uiText';
import { Skeleton } from '../components/atoms/Skeleton';
import { getDisplayLocale } from '../utils/formatDate';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Camera, Check, ChevronRight, ClipboardCheck, Info, Landmark, Sparkles, Stamp } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  createVisit,
  deleteTempPhoto,
  deleteVisit,
  fetchMyVisit,
  fetchPublicVisit,
  resubmitVisit,
  retryVisitAiReview,
  updateVisit,
} from '../api/visitApi';
import { fetchQuestPlaces, fetchQuestRegions } from '../api/stampApi';
import { getApiErrorMessage, isSchemaNotReady } from '../api/http';
import { SiteChrome } from '../components/layout/SiteChrome';
import { PhotoUploader } from '../components/visit/PhotoUploader';
import { SchemaNotice } from '../components/stamp/NicknameAvatar';
import { StatusBadge } from '../components/stamp/StatusBadge';
import { NicknameAvatar } from '../components/stamp/NicknameAvatar';
import { resolveAssetUrl } from '../utils/resolveAssetUrl';
import { useAuthStore } from '../stores/useAuthStore';
import { districtLabels, districtRegionOptions } from '../data/incheonDistricts';
import { visitStatusLabel } from '../utils/stampStatus';
import { toMapPageState } from '../utils/mapNavigation';
import styles from '../components/layout/MemberShell.module.scss';
import feed from './VisitFeed.module.scss';
import compose from './VisitCompose.module.scss';

export default function VisitDetailPage() {
  useUiLanguage();
  const { verifyId } = useParams();
  const user = useAuthStore((s) => s.user);
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    fetchPublicVisit(verifyId)
      .then((data) => {
        setVisit(data);
        setPhotoIndex(0);
      })
      .catch((err) => {
        setSchema(isSchemaNotReady(err));
        setError(getApiErrorMessage(err, '여행 기록을 찾지 못했습니다.'));
      });
  }, [verifyId]);

  if (schema) {
    return (
      <SiteChrome activeNavId='visits'>
        <div className={feed.inner}>
          <SchemaNotice />
        </div>
      </SiteChrome>
    );
  }
  if (error) {
    return (
      <SiteChrome activeNavId='visits'>
        <div className={feed.inner}>
          <p className={feed.alert} role='alert'>
            {uiText(error)}
          </p>
        </div>
      </SiteChrome>
    );
  }
  if (!visit) {
    return (
      <SiteChrome activeNavId='visits'>
        <div className={feed.inner}>
          <Skeleton variant='detail' label={uiText("여행 기록을 불러오는 중…")} />
        </div>
      </SiteChrome>
    );
  }

  const photos = visit.photos?.length ? visit.photos : [];
  const cover = photos[photoIndex] || photos[0];
  const region = districtLabels[visit.regionId] || visit.regionName;

  return (
    <SiteChrome activeNavId='visits'>
      <div className={feed.page}>
        <div className={feed.crumbBar}>
          <nav className={feed.breadcrumb} aria-label={uiText("현재 위치")}>
            <Link to='/'>{uiText("홈")}</Link>
            <span className={feed.sep} aria-hidden>
              /
            </span>
            <Link to='/visits'>{uiText("여행자들의 한 장")}</Link>
            <span className={feed.sep} aria-hidden>
              /
            </span>
            <span aria-current='page'>{uiText(visit.placeName)}</span>
          </nav>
        </div>

        <div className={feed.detailHero}>
          {cover ? (
            <img
              src={resolveAssetUrl(cover.imageUrl || cover.thumbUrl)}
              alt={uiText(cover.altText || `${visit.placeName} 방문 사진`)}
            />
          ) : (
            <div className={feed.detailFallback} aria-hidden>
              {(visit.placeName || '?').slice(0, 1)}
            </div>
          )}
        </div>

        <article className={feed.article}>
          <p className={feed.kicker}>{uiText(region)}</p>
          <h1>{uiText(visit.placeName)}</h1>
          <div className={feed.detailMeta}>
            <span>
              <NicknameAvatar nickname={visit.nickname} size={20} /> {visit.nickname}
            </span>
            {visit.visitDate ? <span>{uiText("방문일")}{uiText(visit.visitDate)}</span> : null}
          </div>
          {photos.length > 1 ? (
            <div className={feed.thumbs} role='list'>
              {photos.map((photo, index) => (
                <button
                  key={photo.photoId || index}
                  type='button'
                  className={
                    index === photoIndex
                      ? `${feed.thumb} ${feed.thumbActive}`
                      : feed.thumb
                  }
                  onClick={() => setPhotoIndex(index)}
                  aria-label={uiText(`${index + 1}번째 사진`)}
                  aria-current={index === photoIndex ? 'true' : undefined}
                >
                  <img
                    src={resolveAssetUrl(photo.thumbUrl || photo.imageUrl)}
                    alt=''
                  />
                </button>
              ))}
            </div>
          ) : null}
          {visit.review ? <p className={feed.review}>{visit.review}</p> : null}
          <div className={feed.actions}>
            {visit.contentId ? (
              <Link className={feed.linkGhost} to={`/map/${visit.contentId}`} state={toMapPageState(visit)}>{uiText("관광지 정보")}</Link>
            ) : null}
            <Link className={feed.linkGhost} to={`/mypage/passport/${visit.regionId}`}>{uiText("내 스탬프북")}</Link>
            {visit.mine ? (
              <Link className={feed.linkBtn} to={`/mypage/verifications/${visit.verifyId}`}>{uiText("내 인증 관리")}</Link>
            ) : null}
            {!user?.authenticated ? (
              <Link className={feed.linkBtn} to='/login'>{uiText("로그인하고 인증하기")}</Link>
            ) : null}
          </div>
        </article>
      </div>
    </SiteChrome>
  );
}

export function VisitComposePage() {
  useUiLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPlaceId = searchParams.get('placeId') || '';
  const user = useAuthStore((s) => s.user);
  const [regions, setRegions] = useState([]);
  const [places, setPlaces] = useState([]);
  const [regionId, setRegionId] = useState('');
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [visitDate, setVisitDate] = useState('');
  const [review, setReview] = useState('');
  const [publicVisible, setPublicVisible] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [schema, setSchema] = useState(false);
  const [pending, setPending] = useState(false);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(false);
  const submittedRef = useRef(false);
  const photosRef = useRef([]);
  const selected = places.find((p) => p.placeId === placeId);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      if (submittedRef.current) return;
      photosRef.current.forEach((photo) => {
        if (photo?.photoId) {
          deleteTempPhoto(photo.photoId).catch(() => {});
        }
      });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchQuestRegions()
      .then((data) => {
        if (cancelled) return;
        setRegions(data);
        if (!initialPlaceId) return undefined;
        return fetchQuestPlaces().then((all) => {
          if (cancelled) return;
          const found = all.find((place) => place.placeId === initialPlaceId);
          if (found) {
            setRegionId(found.regionId);
            setPlaceId(found.placeId);
            setPlaces(all.filter((place) => place.regionId === found.regionId));
          }
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setRegions(districtRegionOptions());
        setSchema(isSchemaNotReady(err));
        if (isSchemaNotReady(err)) {
          setError(getApiErrorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setRegionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialPlaceId]);

  useEffect(() => {
    if (!regionId) return undefined;
    let cancelled = false;
    fetchQuestPlaces({ regionId })
      .then((data) => {
        if (!cancelled) setPlaces(data);
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [regionId]);

  async function onSubmit(event) {
    event.preventDefault();
    if (!user?.authenticated) {
      navigate('/login', { state: { from: '/visits/new' } });
      return;
    }
    setPending(true);
    setError('');
    try {
      const created = await createVisit({
        placeId,
        visitDate,
        review,
        publicVisible,
        coverSortNo: photos.findIndex((p) => p.cover) + 1 || 1,
        photoIds: photos.map((p) => p.photoId),
      });
      submittedRef.current = true;
      navigate(`/mypage/verifications/${created.verifyId}`);
    } catch (err) {
      setSchema(isSchemaNotReady(err));
      setError(getApiErrorMessage(err, '방문 인증을 제출하지 못했습니다.'));
    } finally {
      setPending(false);
    }
  }

  return (
    <SiteChrome activeNavId='visits'>
      <main className={compose.page}>
        <nav className={compose.breadcrumb} aria-label={uiText('현재 위치')}>
          <Link to='/'>{uiText('홈')}</Link>
          <ChevronRight size={14} aria-hidden />
          <Link to='/visits'>{uiText('여행자들의 한 장')}</Link>
          <ChevronRight size={14} aria-hidden />
          <span aria-current='page'>{uiText('방문 인증')}</span>
        </nav>
        <header className={compose.header}>
          <p className={compose.eyebrow}>{uiText('인천 여행 참여 서비스')}</p>
          <h1>{uiText('방문 인증')}</h1>
          <p>{uiText('방문한 관광지와 현장 사진을 등록하고, 인천 여행의 기록을 남겨 보세요.')}</p>
        </header>

        <ol className={compose.process} aria-label={uiText('방문 인증 절차')}>
          <li>
            <span className={compose.processNumber}>01</span>
            <Camera size={20} aria-hidden />
            <span>{uiText('방문 정보·사진 등록')}</span>
            <ChevronRight className={compose.processArrow} size={18} aria-hidden />
          </li>
          <li>
            <span className={compose.processNumber}>02</span>
            <ClipboardCheck size={20} aria-hidden />
            <span>{uiText('AI 사진 확인')}</span>
            <ChevronRight className={compose.processArrow} size={18} aria-hidden />
          </li>
          <li>
            <span className={compose.processNumber}>03</span>
            <Stamp size={20} aria-hidden />
            <span>{uiText('스탬프·랜드마크 획득')}</span>
          </li>
        </ol>

        {schema ? <SchemaNotice /> : null}
        {error && !schema ? (
          <p className={styles.alert} role='alert'>
            {uiText(error)}
          </p>
        ) : null}
        <div className={compose.layout}>
          <form className={compose.form} onSubmit={onSubmit}>
            <section className={compose.section} aria-labelledby='visit-information-title'>
              <div className={compose.sectionHeading}>
                <h2 id='visit-information-title'>
                  <span>01</span>
                  {uiText('방문 정보')}
                </h2>
                <p className={compose.requiredNote}>
                  <span aria-hidden>*</span> {uiText('필수 입력 항목')}
                </p>
              </div>
              <div className={compose.fields}>
                <div className={compose.row}>
                  <label className={compose.label} htmlFor='compose-region'>
                    {uiText('지역')}
                    <span aria-hidden>*</span>
                  </label>
                  <div className={compose.control}>
                    <select
                      id='compose-region'
                      value={regionId}
                      onChange={(e) => {
                        const nextRegionId = e.target.value;
                        setPlacesLoading(Boolean(nextRegionId));
                        setRegionId(nextRegionId);
                        setPlaceId('');
                        setPlaces([]);
                      }}
                      disabled={regionsLoading}
                      required
                    >
                      <option value=''>
                        {uiText(regionsLoading ? '지역을 불러오는 중…' : '지역 선택')}
                      </option>
                      {regions.map((region) => (
                        <option key={region.regionId} value={region.regionId}>
                          {uiText(region.regionName)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={compose.row}>
                  <label className={compose.label} htmlFor='compose-place'>
                    {uiText('관광지')}
                    <span aria-hidden>*</span>
                  </label>
                  <div className={compose.control}>
                    <select
                      id='compose-place'
                      value={placeId}
                      onChange={(e) => setPlaceId(e.target.value)}
                      disabled={!regionId || placesLoading}
                      aria-describedby={!regionId ? 'compose-place-hint' : undefined}
                      required
                    >
                      <option value=''>
                        {uiText(placesLoading ? '관광지를 불러오는 중…' : '관광지 선택')}
                      </option>
                      {places.map((place) => (
                        <option key={place.placeId} value={place.placeId}>
                          {uiText(place.name)}
                        </option>
                      ))}
                    </select>
                    {!regionId ? (
                      <p id='compose-place-hint' className={compose.hint}>
                        {uiText('지역을 먼저 선택해 주세요.')}
                      </p>
                    ) : null}
                    {regionId && !placesLoading && places.length === 0 ? (
                      <p className={compose.hint} role='status'>
                        {uiText('이 지역에 선택할 관광지가 없습니다. 잠시 후 다시 시도해 주세요.')}
                      </p>
                    ) : null}
                    {selected?.verifyGuide ? (
                      <div className={compose.placeGuide} role='note'>
                        <strong>{uiText('이 관광지 촬영 안내')}</strong>
                        <p>{uiText(selected.verifyGuide)}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className={compose.row}>
                  <label className={compose.label} htmlFor='compose-date'>
                    {uiText('방문일')}
                    <span aria-hidden>*</span>
                  </label>
                  <div className={compose.control}>
                    <input
                      id='compose-date'
                      type='date'
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      aria-describedby='compose-date-hint'
                      required
                    />
                    <p id='compose-date-hint' className={compose.hint}>
                      {uiText('오늘을 포함한 최근 3년 이내의 방문일을 입력해 주세요.')}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className={compose.section} aria-labelledby='visit-photos-title'>
              <div className={compose.sectionHeading}>
                <h2 id='visit-photos-title'>
                  <span>02</span>
                  {uiText('현장 사진')}
                  <span className={compose.required} aria-hidden>
                    *
                  </span>
                </h2>
                <span className={compose.photoCount}>{photos.length} / 5</span>
              </div>
              <div className={compose.photoBody}>
                <p className={compose.photoIntro}>
                  {uiText(
                    '입구, 안내판, 간판, 대표 건물이나 전경처럼 장소를 알아볼 수 있는 현장 사진을 올려 주세요.',
                  )}
                </p>
                <PhotoUploader
                  photos={photos}
                  onChange={setPhotos}
                  disabled={pending}
                  variant='form'
                />
                <details className={compose.photoGuide}>
                  <summary>
                    <Info size={16} aria-hidden />
                    {uiText('사진 등록 시 유의사항')}
                  </summary>
                  <ul>
                    <li>
                      {uiText(
                        '지도·검색 화면, 웹 이미지, 광고 사진, 장소와 관계없는 셀카는 인증되지 않습니다.',
                      )}
                    </li>
                    <li>{uiText('얼굴, 신분증, 티켓, GPS 정보는 필요하지 않습니다.')}</li>
                    <li>
                      {uiText(
                        '사진으로 장소를 확인하기 어려우면 보완을 요청할 수 있습니다. 관광지별 촬영 안내가 표시되면 그 안내를 우선해 주세요.',
                      )}
                    </li>
                  </ul>
                </details>
              </div>
            </section>

            <section className={compose.section} aria-labelledby='visit-review-title'>
              <div className={compose.sectionHeading}>
                <h2 id='visit-review-title'>
                  <span>03</span>
                  {uiText('후기 및 공개 설정')}
                </h2>
                <span className={compose.optional}>{uiText('선택 입력')}</span>
              </div>
              <div className={compose.fields}>
                <div className={compose.row}>
                  <label className={compose.label} htmlFor='compose-review'>
                    {uiText('짧은 여행 후기')}
                  </label>
                  <div className={compose.control}>
                    <textarea
                      id='compose-review'
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      maxLength={1000}
                      placeholder={uiText(
                        '방문 소감이나 다른 여행자에게 전하고 싶은 정보를 남겨 주세요.',
                      )}
                      aria-describedby='compose-review-count'
                    />
                    <p id='compose-review-count' className={compose.counter}>
                      {review.length.toLocaleString()} / 1,000
                    </p>
                  </div>
                </div>
                <div className={compose.row}>
                  <span className={compose.label} id='compose-visibility-label'>
                    {uiText('공개 설정')}
                  </span>
                  <div
                    className={compose.control}
                    role='group'
                    aria-labelledby='compose-visibility-label'
                  >
                    <label className={compose.check}>
                      <input
                        type='checkbox'
                        checked={publicVisible}
                        onChange={(e) => setPublicVisible(e.target.checked)}
                      />
                      <span>{uiText('확인되면 ‘여행자들의 한 장’에 공개합니다.')}</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
            <div className={compose.actions}>
              <button
                className={compose.cancel}
                type='button'
                onClick={() => navigate(-1)}
                disabled={pending}
              >
                {uiText('취소')}
              </button>
              <button className={compose.submit} type='submit' disabled={pending}>
                {uiText(pending ? '제출 중…' : '방문 인증 신청')}
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          </form>
          <aside className={compose.aside} aria-label={uiText('방문 인증 이용 안내')}>
            <section className={compose.guideCard}>
              <h2>
                <Info size={19} aria-hidden />
                {uiText('이용 안내')}
              </h2>
              <ul className={compose.guideList}>
                <li>
                  <Check size={16} aria-hidden />
                  <span>
                    {uiText('사진은 1~5장, JPEG·PNG·WebP 형식으로 장당 5MB까지 올릴 수 있습니다.')}
                  </span>
                </li>
                <li>
                  <Check size={16} aria-hidden />
                  <span>{uiText('제출한 사진은 AI가 장소를 확인합니다.')}</span>
                </li>
                <li>
                  <Check size={16} aria-hidden />
                  <span>
                    {uiText('인증 결과와 보완 요청은 내 방문 인증에서 확인할 수 있습니다.')}
                  </span>
                </li>
              </ul>
              <Link to='/mypage/verifications' className={compose.resultLink}>
                {uiText('내 방문 인증')}
                <ChevronRight size={16} aria-hidden />
              </Link>
            </section>
            <section className={compose.rewardCard} aria-labelledby='visit-build-reward'>
              <p className={compose.eyebrow}>{uiText('방문 인증 보상')}</p>
              <h2 id='visit-build-reward'>{uiText('여행의 기록이 쌓입니다')}</h2>
              <div className={compose.rewardItem}>
                <Stamp size={21} aria-hidden />
                <div>
                  <strong>{uiText('여행 스탬프 획득')}</strong>
                  <p>{uiText('여행 여권에 방문 기록을 남깁니다.')}</p>
                </div>
              </div>
              <div className={compose.rewardItem}>
                <Landmark size={21} aria-hidden />
                <div>
                  <strong>{uiText('3D 랜드마크 완성')}</strong>
                  <p>{uiText('인증 후 지도에서 랜드마크를 건설할 수 있습니다.')}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </SiteChrome>
  );
}

function formatVisitDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(getDisplayLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function historyActor(item) {
  if (item.adminNickname) return item.adminNickname;
  if (
    item.toStatus === 'APPROVED'
    || item.toStatus === 'NEEDS_REVISION'
    || item.toStatus === 'REJECTED'
  ) {
    return '사진 확인 완료';
  }
  return '회원';
}

export function MyVisitDetailPage() {
  useUiLanguage();
  const { verifyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [visit, setVisit] = useState(null);
  const [review, setReview] = useState('');
  const [publicVisible, setPublicVisible] = useState(true);
  const [visitDate, setVisitDate] = useState('');
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetchMyVisit(verifyId)
      .then(applyVisit)
      .catch((err) => setError(getApiErrorMessage(err)));
  }, [verifyId]);

  useEffect(() => {
    if (visit?.status !== 'PENDING' || !verifyId) return undefined;
    const timer = window.setInterval(() => {
      fetchMyVisit(verifyId)
        .then((data) => {
          setVisit((prev) => {
            if (prev?.status === 'PENDING' && data.status === 'APPROVED') {
              window.setTimeout(() => {
                window.dispatchEvent(new Event('incheon-stamp-refresh'));
              }, 0);
            }
            return data;
          });
        })
        .catch(() => {});
    }, 2500);
    return () => window.clearInterval(timer);
  }, [verifyId, visit?.status]);

  function applyVisit(data) {
    setVisit(data);
    setReview(data.review || '');
    setPublicVisible(data.publicVisible);
    setVisitDate(data.visitDate);
    setPhotos((data.photos || []).map((p, i) => ({ ...p, cover: i === (data.coverSortNo || 1) - 1 })));
  }

  async function save(resubmit = false) {
    setPending(true);
    setError('');
    setMessage('');
    try {
      const payload = {
        visitDate,
        review,
        publicVisible,
        coverSortNo: (photos.findIndex((p) => p.cover) + 1) || 1,
        photoIds: photos.map((p) => p.photoId),
        expectedReviewVer: visit.reviewVer,
      };
      const next = resubmit
        ? await resubmitVisit(verifyId, payload)
        : await updateVisit(verifyId, payload);
      applyVisit(next);
      setMessage(resubmit ? '다시 제출했습니다. AI가 사진을 확인하고 있습니다.' : '저장했습니다.');
    } catch (err) {
      setError(getApiErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setPending(false);
    }
  }

  async function retryReview() {
    setPending(true);
    setError('');
    setMessage('');
    try {
      const next = await retryVisitAiReview(verifyId);
      applyVisit(next);
      setMessage('AI에게 다시 확인을 요청했습니다.');
    } catch (err) {
      setError(getApiErrorMessage(err, '다시 확인하지 못했습니다.'));
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!window.confirm(
      visit?.status === 'APPROVED'
        ? '이 방문 인증을 삭제할까요? 받은 스탬프와 지도 건설 현황도 함께 줄어듭니다.'
        : '이 방문 인증을 삭제할까요?',
    )) {
      return;
    }
    setPending(true);
    try {
      const result = await deleteVisit(verifyId);
      setMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ['stampLandmarkStates'] });
      window.dispatchEvent(new Event('incheon-stamp-refresh'));
      navigate('/mypage/verifications');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  if (error && !visit) return <p className={styles.alert} role='alert'>{uiText(error)}</p>;
  if (!visit) return <Skeleton variant='detail' />;

  const region = districtLabels[visit.regionId] || visit.regionName;
  const canResubmit = visit.status === 'NEEDS_REVISION' || visit.status === 'REJECTED';

  return (
    <div className={styles.verifyDetail}>
      <Link className={styles.backLink} to='/mypage/verifications'>{uiText("← 목록으로")}</Link>

      <section className={styles.detailCard}>
        {region ? <p className={styles.eyebrow}>{uiText(region)}</p> : null}
        <div className={styles.detailHead}>
          <h2>{uiText(visit.placeName)}</h2>
          <StatusBadge status={visit.status} />
        </div>
        <div className={styles.meta}>
          {visit.visitDate ? <span>{uiText("방문일")}{uiText(visit.visitDate)}</span> : null}
          <span className={`${styles.pill} ${visit.publicVisible ? styles.pillOn : ''}`}>
            {uiText(visit.publicVisible ? '공개' : '비공개')}
          </span>
          {visit.submittedAt ? <span>{uiText("제출")}{formatVisitDateTime(visit.submittedAt)}</span> : null}
        </div>
        <div className={styles.inlineLinks}>
          {visit.contentId ? (
            <Link className={styles.linkQuiet} to={`/map/${visit.contentId}`} state={toMapPageState(visit)}>{uiText("관광지 정보")}</Link>
          ) : null}
          {visit.status === 'APPROVED' && visit.publicVisible ? (
            <Link className={styles.linkQuiet} to={`/visits/${visit.verifyId}`}>{uiText("공개된 기록 보기")}</Link>
          ) : null}
          {visit.regionId ? (
            <Link className={styles.linkQuiet} to={`/mypage/passport/${visit.regionId}`}>{uiText("스탬프북 보기")}</Link>
          ) : null}
        </div>
      </section>

      {visit.status === 'PENDING' ? (
        <div className={styles.aiStatus} role='status'>
          <span className={styles.aiPulse} aria-hidden />
          <div>
            <strong>{uiText("AI가 사진을 확인하고 있습니다")}</strong>
            <p>{uiText("관광지와 사진이 맞는지 살펴보는 중입니다. 보통 몇 초에서 1분 정도 걸리며, 끝나면 이 화면이 바뀝니다.")}</p>
          </div>
        </div>
      ) : null}
      {visit.status === 'APPROVED' ? (
        <p className={styles.notice} role='status'>{uiText("방문이 확인됐어요. 사진과 후기, 공개 여부를 수정할 수 있어요.")}</p>
      ) : null}
      {visit.status === 'NEEDS_REVISION' ? (
        <p className={styles.noticeWarn} role='status'>
          {uiText(visit.adminReason
            ? `AI가 보완을 요청했습니다. ${visit.adminReason}`
            : '사진이 장소를 확인하기 어렵습니다. 현장 사진을 바꾼 뒤 다시 제출해 주세요.')}
        </p>
      ) : null}
      {visit.status === 'REJECTED' ? (
        <p className={styles.noticeWarn} role='status'>
          {uiText(visit.adminReason
            ? `이 장소의 방문으로 확인되지 않았습니다. ${visit.adminReason} 현장 사진을 바꾼 뒤 다시 제출할 수 있습니다.`
            : '이 장소의 방문으로 확인되지 않았습니다. 현장 사진을 바꾼 뒤 다시 제출할 수 있습니다.')}
        </p>
      ) : null}
      {message ? <p className={styles.notice} role='status'>{uiText(message)}</p> : null}
      {error ? <p className={styles.alert} role='alert'>{uiText(error)}</p> : null}

      <section className={styles.detailCard}>
        <div className={styles.split}>
          <section className={styles.formSection}>
            <h2>{uiText("현장 사진")}</h2>
            <PhotoUploader
              photos={photos}
              onChange={setPhotos}
              disabled={pending}
            />
          </section>
          <section className={styles.formSection}>
            <h2>{uiText("방문 정보")}</h2>
            <div className={styles.field}>
              <label htmlFor='edit-date'>{uiText("방문일")}</label>
              <input
                id='edit-date'
                type='date'
                value={visitDate}
                disabled={pending}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor='edit-review'>{uiText("짧은 여행 후기")}</label>
              <textarea
                id='edit-review'
                value={review}
                maxLength={1000}
                disabled={pending}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
            <label className={styles.check}>
              <input
                type='checkbox'
                checked={publicVisible}
                disabled={pending}
                onChange={(e) => setPublicVisible(e.target.checked)}
              />
              <span>{uiText("확인되면 ‘여행자들의 한 장’에 공개합니다.")}</span>
            </label>
          </section>
        </div>

        <div className={styles.actionBar}>
          <button
            className={canResubmit ? styles.secondary : styles.primary}
            type='button'
            disabled={pending || photos.length === 0}
            onClick={() => save(false)}
          >{uiText("저장하기")}</button>
          {visit.status === 'PENDING' ? (
            <button className={styles.secondary} type='button' disabled={pending} onClick={retryReview}>
              <Sparkles size={16} aria-hidden />{uiText("AI에게 다시 확인 요청")}</button>
          ) : null}
          {canResubmit ? (
            <button
              className={styles.primary}
              type='button'
              disabled={pending || photos.length === 0}
              onClick={() => save(true)}
            >
              <Sparkles size={16} aria-hidden />
              {uiText(visit.status === 'REJECTED' ? '사진 보완 후 재제출' : '보완 후 재제출')}
            </button>
          ) : null}
          <button className={styles.danger} type='button' data-intent='danger' disabled={pending} onClick={remove}>{uiText("삭제")}</button>
        </div>
      </section>

      <section className={styles.detailCard}>
        <h2 className={styles.sectionTitle}>{uiText("확인 이력")}</h2>
        {visit.history?.length ? (
          <ol className={styles.history}>
            {visit.history.map((item, index) => (
              <li key={`${item.processedAt}-${index}`} className={styles.historyItem}>
                <strong>{uiText(visitStatusLabel(item.toStatus) || item.toStatus)}</strong>
                <div className={styles.meta}>
                  <span>
                    {uiText(visitStatusLabel(item.fromStatus) || item.fromStatus || '없음')}
                    {uiText(' → ')}
                    {uiText(visitStatusLabel(item.toStatus) || item.toStatus)}
                  </span>
                  <span>{historyActor(item)}</span>
                  {item.processedAt ? <span>{formatVisitDateTime(item.processedAt)}</span> : null}
                </div>
                {item.reason ? <p>{uiText(item.reason)}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>{uiText("아직 확인 이력이 없습니다.")}</p>
        )}
      </section>
    </div>
  );
}

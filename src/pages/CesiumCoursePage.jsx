/**
 * CesiumCoursePage.jsx — 추천 코스의 이동 경로를 3D 지도에 그리는 화면
 * - 라우트: `/course/:courseId/map` (공개, AI 생성 코스와 오늘의 코스 ID도 처리)
 * - 코스 정류장마다 fetchPlaceDetail 로 좌표를 모아 useCourseRouteQuery 로 도보·자동차 경로를 계산
 * - 좌측 패널에 이동 수단 전환, 경유지 최적화, 거리·소요시간 요약과 정류장 목록을 제공
 */
import { routeNotice } from '../utils/routeNotice';
import { Skeleton } from '../components/atoms/Skeleton';
import { formatTravelDuration } from '../utils/formatTravel';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ArrowLeft, CarFront, Footprints, MapPinned } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LanguageSelect } from '../components/atoms/LanguageSelect';
import { DisplayModeSwitch } from '../components/atoms/DisplayModeSwitch';
import { CesiumPlaceViewer } from '../components/map/LazyCesiumPlaceViewer';
import { toMapPageState } from '../utils/mapNavigation';
import { AiChatWidget } from '../components/ai/AiChatWidget';
import { fetchPlaceDetail } from '../api/placeApi';
import { getCourseById } from '../data/recommendedCourses';
import { useAiCourseStore } from '../stores/useAiCourseStore';
import { AI_GENERATED_COURSE_ID, AI_TODAY_COURSE_ID, toExploreCourse } from '../utils/aiCourseAdapter';
import { useTodayCourseQuery } from '../hooks/queries/useTodayCourseQuery';
import { useAppLanguage } from '../hooks/useAppLanguage';
import { useCourseRouteQuery } from '../hooks/queries/useRouteQuery';
import { normalizePlaceDetail } from '../utils/placeNormalize';
import { resolveCourseStopSource } from '../utils/courseStopSource';
import {
  hasRouteCoordinates,
  toRouteWaypoint,
} from '../utils/routeCoordinates';
import { STAT_EVENTS } from '../constants/statEvents';
import { trackStat } from '../utils/trackStat';
import { useStatPageView } from '../hooks/useStatPageView';
import { PublicFooter } from '../components/layout/PublicFooter';
import styles from './CesiumCoursePage.module.scss';

function formatDistance(value) {
  if (!Number.isFinite(Number(value))) return '-';
  return Number(value) >= 1000
    ? `${(Number(value) / 1000).toFixed(1)}km`
    : `${Math.round(Number(value))}m`;
}


export default function CesiumCoursePage() {
  const { t } = useTranslation();
  const language = useAppLanguage();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const aiExploreCourse = useAiCourseStore((state) => state.exploreCourse);
  const todayCourseQuery = useTodayCourseQuery();
  const todayCourse = toExploreCourse(todayCourseQuery.data, AI_TODAY_COURSE_ID);
  const course =
    courseId === AI_GENERATED_COURSE_ID
      ? aiExploreCourse
      : courseId === AI_TODAY_COURSE_ID
        ? todayCourse
        : getCourseById(courseId);
  const [mode, setMode] = useState(
    (course?.stops?.length ?? 0) >= 4 ? 'CAR' : 'PEDESTRIAN',
  );
  const [optimizeWaypoints, setOptimizeWaypoints] = useState(false);

  useStatPageView({ courseId });

  useEffect(() => {
    if (!course) return;
    trackStat({
      eventType: STAT_EVENTS.COURSE_MAP,
      courseId: course.id || courseId,
      districtId: course.districtId || null,
      theme: course.theme || null,
    });
  }, [course, courseId]);

  const detailQueries = useQueries({
    queries: (course?.stops ?? []).map((stop) => ({
      queryKey: ['placeDetail', language, stop.contentId],
      queryFn: () => fetchPlaceDetail(stop.contentId),
      staleTime: 1000 * 60 * 10,
      retry: 1,
    })),
  });

  const places = useMemo(
    () =>
      (course?.stops ?? []).map((stop, index) => {
        const { detail, mapX, mapY } = resolveCourseStopSource(
          stop, detailQueries[index]?.data,
        );
        return {
          ...normalizePlaceDetail(detail, {
            ...stop,
            title: stop.name,
          }),
          order: stop.order,
          name: stop.name,
          title: detail?.title || stop.name,
          mapX,
          mapY,
        };
      }),
    [course, detailQueries],
  );

  const routedPlaces = useMemo(
    () =>
      places
        .map((place, index) => toRouteWaypoint(place, index))
        .filter(Boolean),
    [places],
  );
  const skippedStops = places.filter((place) => !hasRouteCoordinates(place));
  const isDetailsLoading = detailQueries.some((query) => query.isLoading);
  const detailsFailed = detailQueries.some((query) => query.isError);

  const routeQuery = useCourseRouteQuery({
    waypoints: routedPlaces,
    mode,
    optimize: mode === 'CAR' && optimizeWaypoints,
    enabled: routedPlaces.length >= 2,
  });

  useEffect(() => {
    if (!routeQuery.isSuccess || !routeQuery.data) return;
    trackStat({
      eventType: STAT_EVENTS.ROUTE_REQUEST,
      courseId: course?.id || courseId,
      districtId: course?.districtId || null,
      source: mode,
    });
  }, [
    routeQuery.dataUpdatedAt,
    routeQuery.isSuccess,
    routeQuery.data,
    course?.id,
    course?.districtId,
    courseId,
    mode,
  ]);

  const displayedPlaces = useMemo(() => {
    const optimizedOrder = routeQuery.data?.waypointOrder;
    if (
      mode !== 'CAR' ||
      !optimizeWaypoints ||
      !Array.isArray(optimizedOrder) ||
      optimizedOrder.length !== routedPlaces.length
    ) {
      return places;
    }

    return optimizedOrder.map((waypoint, index) => {
      const match = places.find(
        (place) =>
          Math.abs(Number(place.mapX) - Number(waypoint.lng)) < 0.0000001 &&
          Math.abs(Number(place.mapY) - Number(waypoint.lat)) < 0.0000001,
      );
      return {
        ...match,
        name: waypoint.name || match?.name,
        title: waypoint.name || match?.title,
        mapX: waypoint.lng,
        mapY: waypoint.lat,
        order: index + 1,
      };
    });
  }, [mode, optimizeWaypoints, places, routedPlaces.length, routeQuery.data?.waypointOrder]);

  const routeWaypoints = useMemo(() => displayedPlaces.filter(hasRouteCoordinates), [displayedPlaces]);

  if (!course) {
    const waitingToday =
      courseId === AI_TODAY_COURSE_ID
      && (todayCourseQuery.isFetching || todayCourseQuery.isGenerating);
    return (
      <main className={styles.notFound}>
        <LanguageSelect />
        {waitingToday ? (
          <>
            <h1>{t('course.loading')}</h1>
            <Skeleton variant='text' count={2} label={t('course.loadingLabel', { title: t('course.today') })} />
          </>
        ) : (
          <>
            <h1>{t('course.notFound')}</h1>
            <Link to='/'>{t('course.back')}</Link>
          </>
        )}
      </main>
    );
  }

  const first = routedPlaces[0] ?? places[0] ?? course.stops[0];
  return (
    <>
    <main id='main-content' className={styles.page}>
      <aside className={styles.side}>
        <div className={styles.sideTop}>
          <Link to='/' className={styles.back}>
            <ArrowLeft size={16} />{t('course.explore')}</Link>
          <LanguageSelect /><DisplayModeSwitch compact />
        </div>

        <div className={styles.head}>
          <p><MapPinned size={15} />{t('course.3d')}</p>
          <h1>{course.courseName}</h1>
          <span>{course.summary}</span>
        </div>

        <div className={styles.mode} role='group' aria-label={t('course.mode')}>
          <button
            type='button'
            aria-pressed={mode === 'PEDESTRIAN'}
            onClick={() => setMode('PEDESTRIAN')}
          >
            <Footprints size={15} />{t('directions.walk')}</button>
          <button
            type='button'
            aria-pressed={mode === 'CAR'}
            onClick={() => setMode('CAR')}
          >
            <CarFront size={15} />{t('directions.car')}</button>
        </div>

        {mode === 'CAR' && (
          <label className={styles.optimize}>
            <input
              type='checkbox'
              checked={optimizeWaypoints}
              onChange={(event) => setOptimizeWaypoints(event.target.checked)}
            />
            <span>
              <strong>{t('course.optimize')}</strong>
              <small>{t('course.optimizeHint')}</small>
            </span>
          </label>
        )}

        {routeQuery.isLoading && <Skeleton variant='text' count={1} label={t('course.calculating')} />}
        {routedPlaces.length < 2 && !isDetailsLoading && (
          <p className={styles.error}>{t('course.notEnoughCoordinates')}{detailsFailed ? t('course.missingCoordinates') : ''}
          </p>
        )}
        {skippedStops.length > 0 && routedPlaces.length >= 2 ? (
          <p className={styles.warning}>
            좌표가 없는 {skippedStops.length}곳은 경로에서 빠집니다.
          </p>
        ) : null}
        {routeQuery.isError && (
          <p className={styles.error}>{t('course.routeError')}</p>
        )}
        {routeQuery.data && (
          <div className={styles.summary}>
            <div><span>{t('course.distance')}</span><strong>{formatDistance(routeQuery.data.distanceM)}</strong></div>
            <div><span>{t('directions.duration')}</span><strong>{formatTravelDuration(routeQuery.data.durationSeconds)}</strong></div>
            {routeNotice(routeQuery.data, t) && (<p className={routeQuery.data.approximate ? styles.warning : styles.message}>
              {routeNotice(routeQuery.data, t)}
            </p>)}
          </div>
        )}

        {mode === 'CAR' && optimizeWaypoints && routeQuery.data && (
          <p className={styles.orderLabel}>{t('course.order')}</p>
        )}
        <ol className={styles.stops}>
          {displayedPlaces.map((place) => (
            <li key={place.contentId ?? `${place.mapX}-${place.mapY}`}>
              <button
                type='button'
                onClick={() =>
                  navigate(`/map/${place.contentId}`, {
                    state: toMapPageState(place),
                  })
                }
              >
                <b>{place.order}</b>
                <span><strong>{place.title}</strong><small>{place.address || '장소 자세히 보기'}</small></span>
              </button>
            </li>
          ))}
        </ol>

        {isDetailsLoading && <Skeleton count={2} />}
      </aside>

      <section className={styles.map} aria-label={`${course.courseName} 여행 경로`}>
        <CesiumPlaceViewer
          mapX={first?.mapX}
          mapY={first?.mapY}
          title={course.courseName}
          route={routeQuery.data ?? null}
          routeWaypoints={routeWaypoints}
        />
      </section>
    </main>
    <AiChatWidget
      districtId={course.districtId}
      contentId={first?.contentId ? String(first.contentId) : null}
      placeTitle={first?.title || course.courseName}
    />
    <PublicFooter />
    </>
  );
}
